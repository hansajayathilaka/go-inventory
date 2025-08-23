package models

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/components"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

type ProductListEnhancedState int

const (
	ProductListViewState ProductListEnhancedState = iota
	ProductFilterState
	ProductBulkOpState
	ProductDetailViewState
	ProductLoadingState
)

type SortColumn int

const (
	SortBySKU SortColumn = iota
	SortByName
	SortByCategory
	SortBySupplier
	SortByCostPrice
	SortByRetailPrice
	SortByStockLevel
	SortByCreatedDate
)

type SortOrder int

const (
	SortAsc SortOrder = iota
	SortDesc
)

type StockStatus int

const (
	StockGood StockStatus = iota
	StockLow
	StockZero
	StockCritical
)

type ProductFilter struct {
	SearchTerm   string
	Category     string
	Supplier     string
	MinPrice     float64
	MaxPrice     float64
	StockStatus  StockStatus
	ShowInactive bool
}

type BulkOperation struct {
	Name         string
	Description  string
	Action       string
	RequiredRole models.UserRole
}

type ProductListEnhanced struct {
	state       ProductListEnhancedState
	appCtx      *app.Context
	currentUser *models.User

	// Data
	products         []models.Product
	filteredProducts []models.Product
	categories       []models.Category
	suppliers        []models.Supplier
	inventoryMap     map[string]InventoryInfo // SKU -> InventoryInfo
	selectedProduct  *models.Product

	// UI State
	table       components.Table
	filterForm  components.Form
	searchInput string
	errorMsg    string
	successMsg  string
	infoMsg     string

	// Sorting & Filtering
	currentFilter ProductFilter
	sortColumn    SortColumn
	sortOrder     SortOrder

	// Pagination
	currentPage  int
	itemsPerPage int
	totalItems   int

	// Bulk Operations
	selectedItems  []int
	bulkOperations []BulkOperation
	selectedBulkOp int

	// Loading
	loading     bool
	lastUpdated time.Time
}

type InventoryInfo struct {
	TotalStock    int
	ReorderLevel  int
	LocationCount int
	Status        StockStatus
}

type ProductDataMsg struct {
	Products   []models.Product
	Categories []models.Category
	Suppliers  []models.Supplier
	Inventory  map[string]InventoryInfo
}

type ProductErrorMsg struct {
	Error string
}

func NewProductListEnhanced(appCtx *app.Context, user *models.User) ProductListEnhanced {
	// Define table columns
	columns := []components.Column{
		{Header: "SKU", Width: 12, Flex: false},
		{Header: "Name", Width: 25, Flex: true},
		{Header: "Category", Width: 15, Flex: false},
		{Header: "Supplier", Width: 15, Flex: false},
		{Header: "Cost", Width: 10, Flex: false},
		{Header: "Retail", Width: 10, Flex: false},
		{Header: "Stock", Width: 8, Flex: false},
		{Header: "Status", Width: 8, Flex: false},
	}

	table := components.NewTable("Enhanced Product List", columns)
	table.ShowHeader = true

	// Filter form fields
	filterFields := []components.Field{
		{
			Label:       "Search",
			Key:         "search",
			Type:        components.TextInput,
			Placeholder: "Search by SKU, name, or barcode...",
		},
		{
			Label: "Category",
			Key:   "category",
			Type:  components.SelectInput,
		},
		{
			Label: "Supplier",
			Key:   "supplier",
			Type:  components.SelectInput,
		},
		{
			Label:       "Min Price",
			Key:         "min_price",
			Type:        components.NumberInput,
			Placeholder: "0.00",
		},
		{
			Label:       "Max Price",
			Key:         "max_price",
			Type:        components.NumberInput,
			Placeholder: "999.99",
		},
	}

	filterForm := components.NewFormWithLayout("Product Filters", filterFields, components.CompactLayout)

	// Bulk operations based on user role
	bulkOps := []BulkOperation{
		{"Update Prices", "Bulk price update for selected products", "bulk_price", models.RoleManager},
		{"Update Categories", "Change category for selected products", "bulk_category", models.RoleStaff},
		{"Export Data", "Export selected products to CSV", "bulk_export", models.RoleViewer},
		{"Archive Products", "Archive selected products", "bulk_archive", models.RoleManager},
		{"Delete Products", "Permanently delete selected products", "bulk_delete", models.RoleAdmin},
	}

	return ProductListEnhanced{
		state:            ProductLoadingState,
		appCtx:           appCtx,
		currentUser:      user,
		table:            table,
		filterForm:       filterForm,
		products:         []models.Product{},
		filteredProducts: []models.Product{},
		categories:       []models.Category{},
		suppliers:        []models.Supplier{},
		inventoryMap:     make(map[string]InventoryInfo),
		currentFilter:    ProductFilter{},
		sortColumn:       SortByName,
		sortOrder:        SortAsc,
		currentPage:      0,
		itemsPerPage:     20,
		selectedItems:    []int{},
		bulkOperations:   bulkOps,
		loading:          true,
	}
}

func (p ProductListEnhanced) Init() tea.Cmd {
	return tea.Batch(
		p.loadProductData(),
		p.table.Init(),
		p.filterForm.Init(),
	)
}

func (p ProductListEnhanced) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	// Clear messages on each update
	p.errorMsg = ""
	p.infoMsg = ""

	switch msg := msg.(type) {
	case tea.KeyMsg:
		return p.handleKeyMsg(msg)

	case ProductDataMsg:
		p.products = msg.Products
		p.categories = msg.Categories
		p.suppliers = msg.Suppliers
		p.inventoryMap = msg.Inventory
		p.state = ProductListViewState
		p.loading = false
		p.lastUpdated = time.Now()
		p.applyFilters()
		return p, nil

	case ProductErrorMsg:
		p.errorMsg = msg.Error
		p.state = ProductListViewState
		p.loading = false
		return p, nil

	case components.TableMsg:
		return p.handleTableMsg(msg)

	case components.FormMsg:
		return p.handleFormMsg(msg)

	case tea.WindowSizeMsg:
		p.table.Width = msg.Width - 4
		p.table.Height = msg.Height - 10
		return p, nil
	}

	// Update active component based on state
	switch p.state {
	case ProductListViewState:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = p.table.Update(msg)
		p.table = model.(components.Table)
		return p, cmd

	case ProductFilterState:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = p.filterForm.Update(msg)
		p.filterForm = model.(components.Form)
		return p, cmd
	}

	return p, nil
}

func (p ProductListEnhanced) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "ctrl+c":
		return p, tea.Quit

	case "esc", "q":
		switch p.state {
		case ProductListViewState:
			// Return to main dashboard or product menu
			if p.appCtx != nil {
				return NewDashboard(p.appCtx, nil, p.currentUser), nil
			}
			return p, tea.Quit
		case ProductFilterState, ProductBulkOpState, ProductDetailViewState:
			p.state = ProductListViewState
			return p, nil
		}

	case "f", "/":
		if p.state == ProductListViewState {
			p.state = ProductFilterState
			return p, nil
		}

	case "r", "f5":
		if p.state == ProductListViewState {
			p.state = ProductLoadingState
			p.loading = true
			return p, p.loadProductData()
		}

	case "s":
		if p.state == ProductListViewState {
			return p.handleSortToggle()
		}

	case "b":
		if p.state == ProductListViewState && len(p.selectedItems) > 0 {
			p.state = ProductBulkOpState
			return p, nil
		}

	case " ":
		if p.state == ProductListViewState {
			return p.handleItemSelection()
		}

	case "enter":
		switch p.state {
		case ProductListViewState:
			return p.handleProductSelect()
		case ProductBulkOpState:
			return p.handleBulkOperation()
		}

	case "n":
		if p.state == ProductListViewState {
			// Navigate to create new product
			return NewProductFormWithContext(p.appCtx), nil
		}

	case "e":
		if p.state == ProductListViewState && p.selectedProduct != nil {
			// Edit selected product
			return NewProductFormWithContext(p.appCtx), nil
		}

	case "up", "k":
		if p.state == ProductBulkOpState {
			if p.selectedBulkOp > 0 {
				p.selectedBulkOp--
			}
			return p, nil
		}

	case "down", "j":
		if p.state == ProductBulkOpState {
			if p.selectedBulkOp < len(p.bulkOperations)-1 {
				p.selectedBulkOp++
			}
			return p, nil
		}

	case "c":
		if p.state == ProductListViewState {
			// Clear all selections
			p.selectedItems = []int{}
			p.infoMsg = "All selections cleared"
			return p, nil
		}
	}

	return p, nil
}

func (p ProductListEnhanced) handleTableMsg(msg components.TableMsg) (tea.Model, tea.Cmd) {
	if p.state == ProductListViewState {
		switch msg.Action {
		case "select":
			if msg.Index >= 0 && msg.Index < len(p.filteredProducts) {
				p.selectedProduct = &p.filteredProducts[msg.Index]
				p.state = ProductDetailViewState
				return p, nil
			}
		}
	}
	return p, nil
}

func (p ProductListEnhanced) handleFormMsg(msg components.FormMsg) (tea.Model, tea.Cmd) {
	if p.state == ProductFilterState {
		switch msg.Action {
		case "submit":
			p.applyFormFilters(msg.Values)
			p.state = ProductListViewState
			return p, nil
		case "cancel":
			p.state = ProductListViewState
			return p, nil
		}
	}
	return p, nil
}

func (p ProductListEnhanced) View() string {
	var content strings.Builder

	// Header
	content.WriteString(p.renderHeader())
	content.WriteString("\n")

	// Messages
	if p.errorMsg != "" {
		content.WriteString(styles.ErrorStyle.Render("❌ " + p.errorMsg))
		content.WriteString("\n")
	}
	if p.infoMsg != "" {
		content.WriteString(styles.InfoStyle.Render("ℹ️  " + p.infoMsg))
		content.WriteString("\n")
	}

	switch p.state {
	case ProductLoadingState:
		content.WriteString(p.renderLoading())

	case ProductListViewState:
		content.WriteString(p.renderProductList())

	case ProductFilterState:
		content.WriteString(p.renderFilterForm())

	case ProductBulkOpState:
		content.WriteString(p.renderBulkOperations())

	case ProductDetailViewState:
		content.WriteString(p.renderProductDetail())
	}

	// Footer
	content.WriteString("\n")
	content.WriteString(p.renderFooter())

	return content.String()
}

func (p ProductListEnhanced) renderHeader() string {
	var header strings.Builder

	// Title with stats
	title := fmt.Sprintf("📦 Enhanced Product List (%d products", len(p.products))
	if len(p.filteredProducts) != len(p.products) {
		title += fmt.Sprintf(", %d filtered", len(p.filteredProducts))
	}
	if len(p.selectedItems) > 0 {
		title += fmt.Sprintf(", %d selected", len(p.selectedItems))
	}
	title += ")"

	header.WriteString(styles.TitleStyle.Render(title))
	header.WriteString("\n")

	// Filter info
	if p.hasActiveFilters() {
		filterInfo := p.renderActiveFilters()
		header.WriteString(styles.HelpStyle.Render("🔍 " + filterInfo))
		header.WriteString(" ")
		header.WriteString(styles.HelpStyle.Render("(Press 'f' to modify filters)"))
		header.WriteString("\n")
	}

	// Sort info
	sortInfo := fmt.Sprintf("📊 Sorted by: %s (%s)",
		p.getSortColumnName(),
		map[SortOrder]string{SortAsc: "↑", SortDesc: "↓"}[p.sortOrder])
	header.WriteString(styles.HelpStyle.Render(sortInfo))

	// Last updated
	if !p.lastUpdated.IsZero() {
		updateInfo := fmt.Sprintf("🕒 Last updated: %s", p.lastUpdated.Format("15:04:05"))
		header.WriteString("  ")
		header.WriteString(styles.HelpStyle.Render(updateInfo))
	}

	return header.String()
}

func (p ProductListEnhanced) renderProductList() string {
	var content strings.Builder

	if p.loading {
		content.WriteString(p.renderLoading())
		return content.String()
	}

	if len(p.filteredProducts) == 0 {
		if len(p.products) == 0 {
			content.WriteString(styles.InfoStyle.Render("📭 No products found. Press 'n' to add a new product."))
		} else {
			content.WriteString(styles.InfoStyle.Render("🔍 No products match your current filters. Press 'f' to modify filters or 'c' to clear them."))
		}
		return content.String()
	}

	// Pagination info
	start := p.currentPage * p.itemsPerPage
	end := start + p.itemsPerPage
	if end > len(p.filteredProducts) {
		end = len(p.filteredProducts)
	}

	paginationInfo := fmt.Sprintf("Page %d of %d | Showing %d-%d of %d",
		p.currentPage+1,
		(len(p.filteredProducts)+p.itemsPerPage-1)/p.itemsPerPage,
		start+1, end, len(p.filteredProducts))

	content.WriteString(styles.HelpStyle.Render(paginationInfo))
	content.WriteString("\n\n")

	// Table content
	content.WriteString(p.table.View())

	return content.String()
}

func (p ProductListEnhanced) renderFilterForm() string {
	var content strings.Builder

	content.WriteString(styles.HeaderStyle.Render("🔍 Product Filters"))
	content.WriteString("\n\n")

	content.WriteString(p.filterForm.View())

	content.WriteString("\n")
	content.WriteString(styles.HelpStyle.Render("Enter: Apply filters | Esc: Cancel"))

	return content.String()
}

func (p ProductListEnhanced) renderBulkOperations() string {
	var content strings.Builder

	content.WriteString(styles.HeaderStyle.Render(fmt.Sprintf("⚡ Bulk Operations (%d items selected)", len(p.selectedItems))))
	content.WriteString("\n\n")

	for i, op := range p.bulkOperations {
		if !p.hasPermission(op.RequiredRole) {
			continue
		}

		var line string
		if i == p.selectedBulkOp {
			line = styles.MenuItemSelectedStyle.Render(fmt.Sprintf("▶ %s", op.Name))
		} else {
			line = styles.MenuItemStyle.Render(fmt.Sprintf("  %s", op.Name))
		}

		content.WriteString(line)
		content.WriteString("\n")

		if i == p.selectedBulkOp {
			desc := styles.HelpStyle.Render("    " + op.Description)
			content.WriteString(desc)
			content.WriteString("\n")
		}
	}

	return content.String()
}

func (p ProductListEnhanced) renderProductDetail() string {
	if p.selectedProduct == nil {
		return styles.ErrorStyle.Render("No product selected")
	}

	var content strings.Builder
	product := p.selectedProduct

	content.WriteString(styles.HeaderStyle.Render("📦 Product Details"))
	content.WriteString("\n\n")

	// Basic info
	basicInfo := [][]string{
		{"SKU:", product.SKU},
		{"Name:", product.Name},
		{"Description:", product.Description},
		{"Barcode:", product.Barcode},
	}

	content.WriteString(styles.TitleStyle.Render("Basic Information"))
	content.WriteString("\n")
	for _, info := range basicInfo {
		if info[1] != "" {
			line := fmt.Sprintf("%-15s %s", info[0], info[1])
			content.WriteString(styles.BaseStyle.Render(line))
			content.WriteString("\n")
		}
	}

	// Pricing info
	content.WriteString("\n")
	content.WriteString(styles.TitleStyle.Render("Pricing"))
	content.WriteString("\n")

	pricingInfo := [][]string{
		{"Cost Price:", fmt.Sprintf("$%.2f", product.CostPrice)},
		{"Retail Price:", fmt.Sprintf("$%.2f", product.RetailPrice)},
		{"Wholesale Price:", fmt.Sprintf("$%.2f", product.WholesalePrice)},
	}

	for _, info := range pricingInfo {
		line := fmt.Sprintf("%-15s %s", info[0], info[1])
		content.WriteString(styles.BaseStyle.Render(line))
		content.WriteString("\n")
	}

	// Category and Supplier
	content.WriteString("\n")
	content.WriteString(styles.TitleStyle.Render("Relationships"))
	content.WriteString("\n")

	if product.Category.Name != "" {
		content.WriteString(fmt.Sprintf("%-15s %s\n", "Category:", product.Category.Name))
	}
	if product.Supplier != nil && product.Supplier.Name != "" {
		content.WriteString(fmt.Sprintf("%-15s %s\n", "Supplier:", product.Supplier.Name))
	}

	// Inventory status
	if invInfo, exists := p.inventoryMap[product.SKU]; exists {
		content.WriteString("\n")
		content.WriteString(styles.TitleStyle.Render("Inventory Status"))
		content.WriteString("\n")

		statusIcon := p.getStockStatusIcon(invInfo.Status)
		statusText := p.getStockStatusText(invInfo.Status)

		invItems := []string{
			fmt.Sprintf("%-15s %d", "Total Stock:", invInfo.TotalStock),
			fmt.Sprintf("%-15s %d", "Reorder Level:", invInfo.ReorderLevel),
			fmt.Sprintf("%-15s %d", "Locations:", invInfo.LocationCount),
			fmt.Sprintf("%-15s %s %s", "Status:", statusIcon, statusText),
		}

		for _, item := range invItems {
			content.WriteString(styles.BaseStyle.Render(item))
			content.WriteString("\n")
		}
	}

	return content.String()
}

func (p ProductListEnhanced) renderLoading() string {
	spinner := "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	frame := int(time.Now().UnixNano()/100000000) % len(spinner)

	loadingText := fmt.Sprintf("%c Loading product data...", rune(spinner[frame]))

	return lipgloss.Place(80, 10, lipgloss.Center, lipgloss.Center,
		styles.InfoStyle.Render(loadingText))
}

func (p ProductListEnhanced) renderFooter() string {
	var helpItems []string

	switch p.state {
	case ProductListViewState:
		helpItems = []string{
			"↑↓: Navigate",
			"Enter: View details",
			"Space: Select",
			"F: Filter",
			"S: Sort",
			"N: New",
			"E: Edit",
			"B: Bulk ops",
			"R: Refresh",
			"Q: Back",
		}

	case ProductFilterState:
		helpItems = []string{
			"Tab: Navigate fields",
			"Enter: Apply filters",
			"Esc: Cancel",
		}

	case ProductBulkOpState:
		helpItems = []string{
			"↑↓: Navigate",
			"Enter: Execute",
			"Esc: Cancel",
		}

	case ProductDetailViewState:
		helpItems = []string{
			"Esc: Back to list",
			"E: Edit product",
		}

	default:
		helpItems = []string{"Loading..."}
	}

	help := strings.Join(helpItems, " • ")

	return styles.FooterStyle.
		Width(120).
		Align(lipgloss.Center).
		Render(help)
}

func (p ProductListEnhanced) loadProductData() tea.Cmd {
	if p.appCtx == nil {
		return func() tea.Msg {
			return ProductErrorMsg{Error: "Application context not available"}
		}
	}

	return func() tea.Msg {
		ctx := context.Background()

		// Load products
		products, err := p.appCtx.ProductRepo.List(ctx, 1000, 0) // Load more products
		if err != nil {
			return ProductErrorMsg{Error: fmt.Sprintf("Failed to load products: %v", err)}
		}

		// Convert to value slice
		productList := make([]models.Product, len(products))
		for i, prod := range products {
			productList[i] = *prod
		}

		// Load categories
		categories, err := p.appCtx.CategoryRepo.List(ctx, 100, 0)
		if err != nil {
			return ProductErrorMsg{Error: fmt.Sprintf("Failed to load categories: %v", err)}
		}

		categoryList := make([]models.Category, len(categories))
		for i, cat := range categories {
			categoryList[i] = *cat
		}

		// Load suppliers
		suppliers, err := p.appCtx.SupplierRepo.List(ctx, 100, 0)
		if err != nil {
			return ProductErrorMsg{Error: fmt.Sprintf("Failed to load suppliers: %v", err)}
		}

		supplierList := make([]models.Supplier, len(suppliers))
		for i, sup := range suppliers {
			supplierList[i] = *sup
		}

		// Load inventory info for each product
		inventoryMap := make(map[string]InventoryInfo)
		for _, product := range productList {
			if invList, err := p.appCtx.InventoryService.GetInventoryByProduct(ctx, product.ID); err == nil {
				var totalStock, locationCount int
				var minReorderLevel int = 999999
				var status StockStatus = StockGood

				for _, inv := range invList {
					totalStock += inv.Quantity
					locationCount++
					if inv.ReorderLevel < minReorderLevel {
						minReorderLevel = inv.ReorderLevel
					}
				}

				// Determine stock status
				if totalStock == 0 {
					status = StockZero
				} else if totalStock <= minReorderLevel {
					status = StockLow
				} else if totalStock <= minReorderLevel*2 {
					status = StockCritical
				}

				if minReorderLevel == 999999 {
					minReorderLevel = 0
				}

				inventoryMap[product.SKU] = InventoryInfo{
					TotalStock:    totalStock,
					ReorderLevel:  minReorderLevel,
					LocationCount: locationCount,
					Status:        status,
				}
			}
		}

		return ProductDataMsg{
			Products:   productList,
			Categories: categoryList,
			Suppliers:  supplierList,
			Inventory:  inventoryMap,
		}
	}
}

func (p *ProductListEnhanced) applyFilters() {
	p.filteredProducts = p.products

	// Apply search filter
	if p.currentFilter.SearchTerm != "" {
		var filtered []models.Product
		searchTerm := strings.ToLower(p.currentFilter.SearchTerm)

		for _, product := range p.filteredProducts {
			if strings.Contains(strings.ToLower(product.SKU), searchTerm) ||
				strings.Contains(strings.ToLower(product.Name), searchTerm) ||
				strings.Contains(strings.ToLower(product.Barcode), searchTerm) ||
				strings.Contains(strings.ToLower(product.Description), searchTerm) {
				filtered = append(filtered, product)
			}
		}
		p.filteredProducts = filtered
	}

	// Apply category filter
	if p.currentFilter.Category != "" {
		var filtered []models.Product
		for _, product := range p.filteredProducts {
			if product.Category.Name == p.currentFilter.Category {
				filtered = append(filtered, product)
			}
		}
		p.filteredProducts = filtered
	}

	// Apply supplier filter
	if p.currentFilter.Supplier != "" {
		var filtered []models.Product
		for _, product := range p.filteredProducts {
			if product.Supplier != nil && product.Supplier.Name == p.currentFilter.Supplier {
				filtered = append(filtered, product)
			}
		}
		p.filteredProducts = filtered
	}

	// Apply price filters
	if p.currentFilter.MinPrice > 0 || p.currentFilter.MaxPrice > 0 {
		var filtered []models.Product
		for _, product := range p.filteredProducts {
			price := product.RetailPrice
			if (p.currentFilter.MinPrice == 0 || price >= p.currentFilter.MinPrice) &&
				(p.currentFilter.MaxPrice == 0 || price <= p.currentFilter.MaxPrice) {
				filtered = append(filtered, product)
			}
		}
		p.filteredProducts = filtered
	}

	// Apply stock status filter
	if p.currentFilter.StockStatus != StockGood {
		var filtered []models.Product
		for _, product := range p.filteredProducts {
			if invInfo, exists := p.inventoryMap[product.SKU]; exists {
				if invInfo.Status == p.currentFilter.StockStatus {
					filtered = append(filtered, product)
				}
			}
		}
		p.filteredProducts = filtered
	}

	// Apply sorting
	p.sortProducts()

	// Update table rows
	p.updateTableRows()
}

func (p *ProductListEnhanced) sortProducts() {
	sort.Slice(p.filteredProducts, func(i, j int) bool {
		a, b := p.filteredProducts[i], p.filteredProducts[j]
		var result bool

		switch p.sortColumn {
		case SortBySKU:
			result = a.SKU < b.SKU
		case SortByName:
			result = a.Name < b.Name
		case SortByCategory:
			result = a.Category.Name < b.Category.Name
		case SortBySupplier:
			aSup := ""
			bSup := ""
			if a.Supplier != nil {
				aSup = a.Supplier.Name
			}
			if b.Supplier != nil {
				bSup = b.Supplier.Name
			}
			result = aSup < bSup
		case SortByCostPrice:
			result = a.CostPrice < b.CostPrice
		case SortByRetailPrice:
			result = a.RetailPrice < b.RetailPrice
		case SortByStockLevel:
			aStock := 0
			bStock := 0
			if inv, exists := p.inventoryMap[a.SKU]; exists {
				aStock = inv.TotalStock
			}
			if inv, exists := p.inventoryMap[b.SKU]; exists {
				bStock = inv.TotalStock
			}
			result = aStock < bStock
		case SortByCreatedDate:
			result = a.CreatedAt.Before(b.CreatedAt)
		}

		if p.sortOrder == SortDesc {
			result = !result
		}

		return result
	})
}

func (p *ProductListEnhanced) updateTableRows() {
	rows := make([]components.Row, len(p.filteredProducts))

	for i, product := range p.filteredProducts {
		categoryName := "—"
		if product.Category.Name != "" {
			categoryName = product.Category.Name
		}

		supplierName := "—"
		if product.Supplier != nil && product.Supplier.Name != "" {
			supplierName = product.Supplier.Name
		}

		stock := "—"
		status := "—"
		if invInfo, exists := p.inventoryMap[product.SKU]; exists {
			stock = fmt.Sprintf("%d", invInfo.TotalStock)
			status = p.getStockStatusIcon(invInfo.Status)
		}

		rows[i] = components.Row{
			product.SKU,
			product.Name,
			categoryName,
			supplierName,
			fmt.Sprintf("$%.2f", product.CostPrice),
			fmt.Sprintf("$%.2f", product.RetailPrice),
			stock,
			status,
		}
	}

	p.table.SetRows(rows)
}

// Helper functions

func (p *ProductListEnhanced) applyFormFilters(values map[string]string) {
	// Update filter from form values
	p.currentFilter.SearchTerm = values["search"]
	p.currentFilter.Category = values["category"]
	p.currentFilter.Supplier = values["supplier"]

	if minPrice, err := strconv.ParseFloat(values["min_price"], 64); err == nil {
		p.currentFilter.MinPrice = minPrice
	}

	if maxPrice, err := strconv.ParseFloat(values["max_price"], 64); err == nil {
		p.currentFilter.MaxPrice = maxPrice
	}

	p.applyFilters()
}

func (p ProductListEnhanced) hasActiveFilters() bool {
	return p.currentFilter.SearchTerm != "" ||
		p.currentFilter.Category != "" ||
		p.currentFilter.Supplier != "" ||
		p.currentFilter.MinPrice > 0 ||
		p.currentFilter.MaxPrice > 0 ||
		p.currentFilter.StockStatus != StockGood
}

func (p ProductListEnhanced) renderActiveFilters() string {
	var filters []string

	if p.currentFilter.SearchTerm != "" {
		filters = append(filters, fmt.Sprintf("Search: %s", p.currentFilter.SearchTerm))
	}
	if p.currentFilter.Category != "" {
		filters = append(filters, fmt.Sprintf("Category: %s", p.currentFilter.Category))
	}
	if p.currentFilter.Supplier != "" {
		filters = append(filters, fmt.Sprintf("Supplier: %s", p.currentFilter.Supplier))
	}
	if p.currentFilter.MinPrice > 0 {
		filters = append(filters, fmt.Sprintf("Min: $%.2f", p.currentFilter.MinPrice))
	}
	if p.currentFilter.MaxPrice > 0 {
		filters = append(filters, fmt.Sprintf("Max: $%.2f", p.currentFilter.MaxPrice))
	}

	return strings.Join(filters, ", ")
}

func (p ProductListEnhanced) getSortColumnName() string {
	switch p.sortColumn {
	case SortBySKU:
		return "SKU"
	case SortByName:
		return "Name"
	case SortByCategory:
		return "Category"
	case SortBySupplier:
		return "Supplier"
	case SortByCostPrice:
		return "Cost Price"
	case SortByRetailPrice:
		return "Retail Price"
	case SortByStockLevel:
		return "Stock Level"
	case SortByCreatedDate:
		return "Created Date"
	default:
		return "Unknown"
	}
}

func (p ProductListEnhanced) getStockStatusIcon(status StockStatus) string {
	switch status {
	case StockGood:
		return "✅"
	case StockLow:
		return "🟡"
	case StockZero:
		return "🔴"
	case StockCritical:
		return "⚠️"
	default:
		return "❓"
	}
}

func (p ProductListEnhanced) getStockStatusText(status StockStatus) string {
	switch status {
	case StockGood:
		return "Good"
	case StockLow:
		return "Low"
	case StockZero:
		return "Zero"
	case StockCritical:
		return "Critical"
	default:
		return "Unknown"
	}
}

func (p ProductListEnhanced) handleSortToggle() (tea.Model, tea.Cmd) {
	// Cycle through sort columns
	p.sortColumn = SortColumn((int(p.sortColumn) + 1) % 8)
	p.applyFilters()
	p.infoMsg = fmt.Sprintf("Sorted by %s", p.getSortColumnName())
	return p, nil
}

func (p ProductListEnhanced) handleItemSelection() (tea.Model, tea.Cmd) {
	currentIndex := p.table.Selected

	// Toggle selection
	found := false
	for i, idx := range p.selectedItems {
		if idx == currentIndex {
			// Remove from selection
			p.selectedItems = append(p.selectedItems[:i], p.selectedItems[i+1:]...)
			found = true
			break
		}
	}

	if !found {
		// Add to selection
		p.selectedItems = append(p.selectedItems, currentIndex)
	}

	p.infoMsg = fmt.Sprintf("%d items selected", len(p.selectedItems))
	return p, nil
}

func (p ProductListEnhanced) handleProductSelect() (tea.Model, tea.Cmd) {
	currentIndex := p.table.Selected
	if currentIndex >= 0 && currentIndex < len(p.filteredProducts) {
		p.selectedProduct = &p.filteredProducts[currentIndex]
		p.state = ProductDetailViewState
	}
	return p, nil
}

func (p ProductListEnhanced) handleBulkOperation() (tea.Model, tea.Cmd) {
	if p.selectedBulkOp < len(p.bulkOperations) {
		operation := p.bulkOperations[p.selectedBulkOp]

		if !p.hasPermission(operation.RequiredRole) {
			p.errorMsg = "You don't have permission to perform this operation"
			p.state = ProductListViewState
			return p, nil
		}

		// Execute bulk operation
		switch operation.Action {
		case "bulk_export":
			p.infoMsg = fmt.Sprintf("Exported %d products to CSV", len(p.selectedItems))
		case "bulk_category":
			p.infoMsg = fmt.Sprintf("Updated category for %d products", len(p.selectedItems))
		case "bulk_price":
			p.infoMsg = fmt.Sprintf("Updated prices for %d products", len(p.selectedItems))
		case "bulk_archive":
			p.infoMsg = fmt.Sprintf("Archived %d products", len(p.selectedItems))
		case "bulk_delete":
			p.infoMsg = fmt.Sprintf("Deleted %d products", len(p.selectedItems))
		}

		// Clear selections after operation
		p.selectedItems = []int{}
		p.state = ProductListViewState
	}

	return p, nil
}

func (p ProductListEnhanced) hasPermission(requiredRole models.UserRole) bool {
	if p.currentUser == nil {
		return false
	}

	userLevel := getRoleLevel(p.currentUser.Role)
	requiredLevel := getRoleLevel(requiredRole)

	return userLevel >= requiredLevel
}

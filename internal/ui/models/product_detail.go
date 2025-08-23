package models

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"
)

type ProductDetailState int

const (
	ProdDetailViewState ProductDetailState = iota
	ProdDetailLoadingState
	ProdDetailStockAdjustmentState
	ProdDetailTransferState
	ProdDetailEditingState
)

type ProductDetailModel struct {
	appCtx      *app.Context
	currentUser *models.User
	state       ProductDetailState
	width       int
	height      int
	currentItem int
	productID   uuid.UUID

	// Data
	product         *models.Product
	inventoryItems  []*models.Inventory
	recentMovements []*models.StockMovement
	totalStock      int
	locations       []*models.Location

	// Quick adjustment form
	adjustmentLocation uuid.UUID
	adjustmentQuantity string
	adjustmentNotes    string

	// Transfer form
	transferFrom     uuid.UUID
	transferTo       uuid.UUID
	transferQuantity string
	transferNotes    string

	// Status messages
	message     string
	messageType string
	loading     bool
}

type ProductDetailLoadedMsg struct {
	Product         *models.Product
	InventoryItems  []*models.Inventory
	RecentMovements []*models.StockMovement
	TotalStock      int
	Locations       []*models.Location
}

type ProductDetailErrorMsg struct {
	Err error
}

type StockAdjustedMsg struct {
	Success bool
	Message string
}

type StockTransferredMsg struct {
	Success bool
	Message string
}

func NewProductDetailModel(appCtx *app.Context, currentUser *models.User, productID uuid.UUID) ProductDetailModel {
	return ProductDetailModel{
		appCtx:      appCtx,
		currentUser: currentUser,
		state:       ProdDetailLoadingState,
		productID:   productID,
		loading:     true,
	}
}

func (m ProductDetailModel) Init() tea.Cmd {
	return m.loadProductDetails()
}

func (m ProductDetailModel) Update(msg tea.Msg) (ProductDetailModel, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case tea.KeyMsg:
		switch m.state {
		case ProdDetailViewState:
			return m.handleViewStateKeys(msg)
		case ProdDetailStockAdjustmentState:
			return m.handleAdjustmentStateKeys(msg)
		case ProdDetailTransferState:
			return m.handleTransferStateKeys(msg)
		}

	case ProductDetailLoadedMsg:
		m.product = msg.Product
		m.inventoryItems = msg.InventoryItems
		m.recentMovements = msg.RecentMovements
		m.totalStock = msg.TotalStock
		m.locations = msg.Locations
		m.state = ProdDetailViewState
		m.loading = false
		m.message = ""

	case ProductDetailErrorMsg:
		m.state = ProdDetailViewState
		m.loading = false
		m.message = fmt.Sprintf("Error: %v", msg.Err)
		m.messageType = "error"

	case StockAdjustedMsg:
		m.state = ProdDetailViewState
		if msg.Success {
			m.message = msg.Message
			m.messageType = "success"
			// Reload data
			cmds = append(cmds, m.loadProductDetails())
		} else {
			m.message = msg.Message
			m.messageType = "error"
		}

	case StockTransferredMsg:
		m.state = ProdDetailViewState
		if msg.Success {
			m.message = msg.Message
			m.messageType = "success"
			// Reload data
			cmds = append(cmds, m.loadProductDetails())
		} else {
			m.message = msg.Message
			m.messageType = "error"
		}
	}

	return m, tea.Batch(cmds...)
}

func (m ProductDetailModel) handleViewStateKeys(msg tea.KeyMsg) (ProductDetailModel, tea.Cmd) {
	switch msg.String() {
	case "q", "ctrl+c":
		return m, tea.Quit
	case "esc":
		// Return to product list - for now just set state
		m.message = "Returning to product list not implemented"
		m.messageType = "info"
		return m, nil
	case "r":
		// Reload data
		m.loading = true
		m.state = ProdDetailLoadingState
		return m, m.loadProductDetails()
	case "a":
		// Quick stock adjustment
		if !m.canWrite() {
			m.message = "Insufficient permissions for stock adjustment"
			m.messageType = "error"
			return m, nil
		}
		m.state = ProdDetailStockAdjustmentState
		m.resetAdjustmentForm()
		return m, nil
	case "t":
		// Stock transfer
		if !m.canWrite() {
			m.message = "Insufficient permissions for stock transfer"
			m.messageType = "error"
			return m, nil
		}
		m.state = ProdDetailTransferState
		m.resetTransferForm()
		return m, nil
	case "e":
		// Edit product (future implementation)
		if !m.canWrite() {
			m.message = "Insufficient permissions to edit product"
			m.messageType = "error"
			return m, nil
		}
		// For now just show a message
		m.message = "Product editing not yet implemented"
		m.messageType = "info"
		return m, nil
	case "up", "k":
		if m.currentItem > 0 {
			m.currentItem--
		}
	case "down", "j":
		maxItems := 3 + len(m.inventoryItems) + len(m.recentMovements) - 1
		if m.currentItem < maxItems {
			m.currentItem++
		}
	}

	return m, nil
}

func (m ProductDetailModel) handleAdjustmentStateKeys(msg tea.KeyMsg) (ProductDetailModel, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.state = ProdDetailViewState
		return m, nil
	case "enter":
		return m, m.performStockAdjustment()
	}

	return m, nil
}

func (m ProductDetailModel) handleTransferStateKeys(msg tea.KeyMsg) (ProductDetailModel, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.state = ProdDetailViewState
		return m, nil
	case "enter":
		return m, m.performStockTransfer()
	}

	return m, nil
}

func (m ProductDetailModel) View() string {
	if m.loading || m.state == ProdDetailLoadingState {
		return m.loadingView()
	}

	switch m.state {
	case ProdDetailViewState:
		return m.detailView()
	case ProdDetailStockAdjustmentState:
		return m.adjustmentView()
	case ProdDetailTransferState:
		return m.transferView()
	default:
		return m.detailView()
	}
}

func (m ProductDetailModel) loadingView() string {
	return lipgloss.Place(
		m.width, m.height,
		lipgloss.Center, lipgloss.Center,
		styles.TitleStyle.Render("Loading product details..."),
	)
}

func (m ProductDetailModel) detailView() string {
	if m.product == nil {
		return lipgloss.Place(
			m.width, m.height,
			lipgloss.Center, lipgloss.Center,
			styles.ErrorStyle.Render("Product not found"),
		)
	}

	var sections []string

	// Header
	header := styles.HeaderStyle.Width(m.width - 2).Render(
		fmt.Sprintf("Product Detail - %s (%s)", m.product.Name, m.product.SKU),
	)
	sections = append(sections, header)

	// Status message
	if m.message != "" {
		msgStyle := styles.SuccessStyle
		if m.messageType == "error" {
			msgStyle = styles.ErrorStyle
		} else if m.messageType == "info" {
			msgStyle = styles.InfoStyle
		}
		sections = append(sections, msgStyle.Render(m.message))
		sections = append(sections, "")
	}

	// Product Information Section
	sections = append(sections, m.productInfoSection())
	sections = append(sections, "")

	// Stock Levels Section
	sections = append(sections, m.stockLevelsSection())
	sections = append(sections, "")

	// Recent Movements Section
	sections = append(sections, m.recentMovementsSection())
	sections = append(sections, "")

	// Help section
	sections = append(sections, m.helpSection())

	content := strings.Join(sections, "\n")
	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Render(content)
}

func (m ProductDetailModel) productInfoSection() string {
	var lines []string

	lines = append(lines, styles.TitleStyle.Render("📦 Product Information"))

	// Basic info in two columns
	leftCol := []string{
		fmt.Sprintf("SKU: %s", m.product.SKU),
		fmt.Sprintf("Name: %s", m.product.Name),
		fmt.Sprintf("Category: %s", m.getProductCategory()),
	}

	rightCol := []string{
		fmt.Sprintf("Total Stock: %s", m.getStockStatusStyle(m.totalStock)),
		fmt.Sprintf("Cost Price: $%.2f", m.product.CostPrice),
		fmt.Sprintf("Retail Price: $%.2f", m.product.RetailPrice),
	}

	// Combine columns
	for i := 0; i < len(leftCol) || i < len(rightCol); i++ {
		var left, right string
		if i < len(leftCol) {
			left = leftCol[i]
		}
		if i < len(rightCol) {
			right = rightCol[i]
		}

		line := lipgloss.JoinHorizontal(
			lipgloss.Top,
			lipgloss.NewStyle().Width(m.width/2-2).Render(left),
			lipgloss.NewStyle().Width(m.width/2-2).Render(right),
		)
		lines = append(lines, line)
	}

	// Additional details
	if m.product.Description != "" {
		lines = append(lines, fmt.Sprintf("Description: %s", m.product.Description))
	}

	if m.product.Supplier != nil {
		lines = append(lines, fmt.Sprintf("Supplier: %s", m.product.Supplier.Name))
	}

	return strings.Join(lines, "\n")
}

func (m ProductDetailModel) stockLevelsSection() string {
	var lines []string

	lines = append(lines, styles.TitleStyle.Render("📊 Stock Levels by Location"))

	if len(m.inventoryItems) == 0 {
		lines = append(lines, "No inventory records found")
		return strings.Join(lines, "\n")
	}

	// Table header
	header := fmt.Sprintf("%-20s %-12s %-12s %-12s %s",
		"Location", "Available", "Reserved", "Reorder", "Status")
	lines = append(lines, styles.TableHeaderStyle.Render(header))

	// Table rows
	for _, inv := range m.inventoryItems {
		locationName := m.getLocationName(inv.LocationID)
		available := inv.AvailableQuantity()
		status := m.getInventoryStatus(inv)

		row := fmt.Sprintf("%-20s %-12d %-12d %-12d %s",
			locationName,
			available,
			inv.ReservedQuantity,
			inv.ReorderLevel,
			status)

		style := styles.TableCellStyle
		if available <= inv.ReorderLevel && inv.ReorderLevel > 0 {
			style = styles.WarningStyle
		}
		if available == 0 {
			style = styles.ErrorStyle
		}

		lines = append(lines, style.Render(row))
	}

	return strings.Join(lines, "\n")
}

func (m ProductDetailModel) recentMovementsSection() string {
	var lines []string

	lines = append(lines, styles.TitleStyle.Render("📈 Recent Stock Movements"))

	if len(m.recentMovements) == 0 {
		lines = append(lines, "No recent movements")
		return strings.Join(lines, "\n")
	}

	// Table header
	header := fmt.Sprintf("%-12s %-10s %-12s %-8s %-20s %s",
		"Date", "Type", "Location", "Qty", "User", "Notes")
	lines = append(lines, styles.TableHeaderStyle.Render(header))

	// Show only last 10 movements
	maxMovements := 10
	if len(m.recentMovements) < maxMovements {
		maxMovements = len(m.recentMovements)
	}

	for i := 0; i < maxMovements; i++ {
		mov := m.recentMovements[i]
		locationName := m.getLocationName(mov.LocationID)
		userName := m.getUserName(mov.UserID)

		row := fmt.Sprintf("%-12s %-10s %-12s %-8d %-20s %s",
			mov.CreatedAt.Format("2006-01-02"),
			string(mov.MovementType),
			locationName,
			mov.Quantity,
			userName,
			m.truncateString(mov.Notes, 30))

		lines = append(lines, styles.TableCellStyle.Render(row))
	}

	return strings.Join(lines, "\n")
}

func (m ProductDetailModel) helpSection() string {
	var helpItems []string

	if m.canWrite() {
		helpItems = append(helpItems,
			"[a] Adjust Stock",
			"[t] Transfer Stock",
			"[e] Edit Product",
		)
	}

	helpItems = append(helpItems,
		"[r] Reload",
		"[esc] Back to List",
		"[q] Quit",
	)

	return styles.HelpStyle.Render(strings.Join(helpItems, " | "))
}

func (m ProductDetailModel) adjustmentView() string {
	var sections []string

	// Header
	header := styles.HeaderStyle.Width(m.width - 2).Render("Quick Stock Adjustment")
	sections = append(sections, header)
	sections = append(sections, "")

	if m.product != nil {
		sections = append(sections, fmt.Sprintf("Product: %s (%s)", m.product.Name, m.product.SKU))
		sections = append(sections, "")
	}

	// Form fields
	sections = append(sections, "Location:")
	sections = append(sections, m.locationDropdown())
	sections = append(sections, "")

	sections = append(sections, "Adjustment Quantity (+ for increase, - for decrease):")
	sections = append(sections, styles.InputStyle.Render(m.adjustmentQuantity))
	sections = append(sections, "")

	sections = append(sections, "Notes:")
	sections = append(sections, styles.InputStyle.Render(m.adjustmentNotes))
	sections = append(sections, "")

	sections = append(sections, styles.HelpStyle.Render("[Enter] Submit | [Esc] Cancel"))

	content := strings.Join(sections, "\n")
	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Render(content)
}

func (m ProductDetailModel) transferView() string {
	var sections []string

	// Header
	header := styles.HeaderStyle.Width(m.width - 2).Render("Stock Transfer")
	sections = append(sections, header)
	sections = append(sections, "")

	if m.product != nil {
		sections = append(sections, fmt.Sprintf("Product: %s (%s)", m.product.Name, m.product.SKU))
		sections = append(sections, "")
	}

	// Form fields
	sections = append(sections, "From Location:")
	sections = append(sections, m.fromLocationDropdown())
	sections = append(sections, "")

	sections = append(sections, "To Location:")
	sections = append(sections, m.toLocationDropdown())
	sections = append(sections, "")

	sections = append(sections, "Quantity to Transfer:")
	sections = append(sections, styles.InputStyle.Render(m.transferQuantity))
	sections = append(sections, "")

	sections = append(sections, "Notes:")
	sections = append(sections, styles.InputStyle.Render(m.transferNotes))
	sections = append(sections, "")

	sections = append(sections, styles.HelpStyle.Render("[Enter] Submit | [Esc] Cancel"))

	content := strings.Join(sections, "\n")
	return lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Render(content)
}

// Helper methods
func (m ProductDetailModel) canWrite() bool {
	return m.currentUser != nil && (m.currentUser.Role == models.RoleAdmin || m.currentUser.Role == models.RoleManager || m.currentUser.Role == models.RoleStaff)
}

func (m ProductDetailModel) getProductCategory() string {
	if m.product.Category.Name != "" {
		return m.product.Category.Name
	}
	return "Unknown Category"
}

func (m ProductDetailModel) getStockStatusStyle(stock int) string {
	if stock == 0 {
		return styles.ErrorStyle.Render(fmt.Sprintf("%d (Out of Stock)", stock))
	} else if stock <= 10 { // Assuming low stock threshold
		return styles.WarningStyle.Render(fmt.Sprintf("%d (Low Stock)", stock))
	}
	return styles.SuccessStyle.Render(strconv.Itoa(stock))
}

func (m ProductDetailModel) getLocationName(locationID uuid.UUID) string {
	for _, loc := range m.locations {
		if loc.ID == locationID {
			return loc.Name
		}
	}
	return "Unknown Location"
}

func (m ProductDetailModel) getInventoryStatus(inv *models.Inventory) string {
	available := inv.AvailableQuantity()
	if available == 0 {
		return styles.ErrorStyle.Render("OUT")
	}
	if available <= inv.ReorderLevel && inv.ReorderLevel > 0 {
		return styles.WarningStyle.Render("LOW")
	}
	return styles.SuccessStyle.Render("OK")
}

func (m ProductDetailModel) getUserName(userID uuid.UUID) string {
	// For now, return the user ID substring
	// In a full implementation, this would lookup the user name
	return userID.String()[:8]
}

func (m ProductDetailModel) truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func (m ProductDetailModel) locationDropdown() string {
	// Simplified dropdown - in a full implementation this would be interactive
	var options []string
	for _, loc := range m.locations {
		prefix := "  "
		if loc.ID == m.adjustmentLocation {
			prefix = "▶ "
		}
		options = append(options, prefix+loc.Name)
	}
	return strings.Join(options, "\n")
}

func (m ProductDetailModel) fromLocationDropdown() string {
	var options []string
	for _, loc := range m.locations {
		prefix := "  "
		if loc.ID == m.transferFrom {
			prefix = "▶ "
		}
		options = append(options, prefix+loc.Name)
	}
	return strings.Join(options, "\n")
}

func (m ProductDetailModel) toLocationDropdown() string {
	var options []string
	for _, loc := range m.locations {
		prefix := "  "
		if loc.ID == m.transferTo {
			prefix = "▶ "
		}
		options = append(options, prefix+loc.Name)
	}
	return strings.Join(options, "\n")
}

func (m *ProductDetailModel) resetAdjustmentForm() {
	if len(m.locations) > 0 {
		m.adjustmentLocation = m.locations[0].ID
	}
	m.adjustmentQuantity = ""
	m.adjustmentNotes = ""
}

func (m *ProductDetailModel) resetTransferForm() {
	if len(m.locations) > 0 {
		m.transferFrom = m.locations[0].ID
		if len(m.locations) > 1 {
			m.transferTo = m.locations[1].ID
		}
	}
	m.transferQuantity = ""
	m.transferNotes = ""
}

// Commands
func (m ProductDetailModel) loadProductDetails() tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()

		// Get product details through product repository
		productRepo := m.appCtx.ProductRepo
		product, err := productRepo.GetByID(ctx, m.productID)
		if err != nil {
			return ProductDetailErrorMsg{Err: fmt.Errorf("product not found: %w", err)}
		}

		// Get inventory items
		inventoryService := m.appCtx.InventoryService
		inventoryItems, err := inventoryService.GetInventoryByProduct(ctx, m.productID)
		if err != nil {
			return ProductDetailErrorMsg{Err: err}
		}

		// Get total stock
		totalStock, err := inventoryService.GetTotalStockByProduct(ctx, m.productID)
		if err != nil {
			return ProductDetailErrorMsg{Err: err}
		}

		// Get recent movements (last 20)
		stockMovementRepo := m.appCtx.StockMovementRepo
		recentMovements, err := stockMovementRepo.GetByProduct(ctx, m.productID, 20, 0)
		if err != nil {
			// Don't fail if we can't get movements, just log and continue
			recentMovements = []*models.StockMovement{}
		}

		// Get all locations
		locationRepo := m.appCtx.LocationRepo
		locations, err := locationRepo.GetActive(ctx)
		if err != nil {
			return ProductDetailErrorMsg{Err: err}
		}

		return ProductDetailLoadedMsg{
			Product:         product,
			InventoryItems:  inventoryItems,
			RecentMovements: recentMovements,
			TotalStock:      totalStock,
			Locations:       locations,
		}
	}
}

func (m ProductDetailModel) performStockAdjustment() tea.Cmd {
	return func() tea.Msg {
		if m.adjustmentQuantity == "" {
			return StockAdjustedMsg{
				Success: false,
				Message: "Adjustment quantity is required",
			}
		}

		adjustment, err := strconv.Atoi(m.adjustmentQuantity)
		if err != nil {
			return StockAdjustedMsg{
				Success: false,
				Message: "Invalid adjustment quantity",
			}
		}

		if adjustment == 0 {
			return StockAdjustedMsg{
				Success: false,
				Message: "Adjustment quantity cannot be zero",
			}
		}

		ctx := context.Background()
		inventoryService := m.appCtx.InventoryService

		err = inventoryService.AdjustStock(
			ctx,
			m.productID,
			m.adjustmentLocation,
			adjustment,
			m.currentUser.ID,
			m.adjustmentNotes,
		)

		if err != nil {
			return StockAdjustedMsg{
				Success: false,
				Message: fmt.Sprintf("Stock adjustment failed: %v", err),
			}
		}

		return StockAdjustedMsg{
			Success: true,
			Message: fmt.Sprintf("Stock adjusted by %+d successfully", adjustment),
		}
	}
}

func (m ProductDetailModel) performStockTransfer() tea.Cmd {
	return func() tea.Msg {
		if m.transferQuantity == "" {
			return StockTransferredMsg{
				Success: false,
				Message: "Transfer quantity is required",
			}
		}

		quantity, err := strconv.Atoi(m.transferQuantity)
		if err != nil || quantity <= 0 {
			return StockTransferredMsg{
				Success: false,
				Message: "Invalid transfer quantity",
			}
		}

		if m.transferFrom == m.transferTo {
			return StockTransferredMsg{
				Success: false,
				Message: "From and To locations cannot be the same",
			}
		}

		ctx := context.Background()
		inventoryService := m.appCtx.InventoryService

		err = inventoryService.TransferStock(
			ctx,
			m.productID,
			m.transferFrom,
			m.transferTo,
			quantity,
			m.currentUser.ID,
			m.transferNotes,
		)

		if err != nil {
			return StockTransferredMsg{
				Success: false,
				Message: fmt.Sprintf("Stock transfer failed: %v", err),
			}
		}

		return StockTransferredMsg{
			Success: true,
			Message: fmt.Sprintf("Transferred %d units successfully", quantity),
		}
	}
}
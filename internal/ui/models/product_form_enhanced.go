package models

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/components"
	"tui-inventory/internal/ui/styles"
)

type ProductFormEnhancedState int

const (
	ProductFormMainState ProductFormEnhancedState = iota
	ProductFormCategoryPickerState
	ProductFormSupplierPickerState
	ProductFormSavingState
	ProductFormValidatingState
)

type ProductFormMode int

const (
	ProductFormCreateMode ProductFormMode = iota
	ProductFormEditMode
	ProductFormViewMode
)

type ProductFormEnhanced struct {
	state        ProductFormEnhancedState
	mode         ProductFormMode
	appCtx       *app.Context
	currentUser  *models.User
	editProduct  *models.Product

	// Data
	categories       []models.Category
	suppliers        []models.Supplier
	categoryTree     []CategoryTreeNode
	selectedCategory *models.Category
	selectedSupplier *models.Supplier

	// UI Components
	mainForm         components.Form
	categoryPicker   CategoryPicker
	supplierPicker   SupplierPicker
	
	// Form State
	formData         map[string]string
	validationErrors map[string]string
	errorMsg         string
	successMsg       string
	infoMsg          string
	
	// SKU Generation
	autoGenerateSKU  bool
	skuPattern       string
	
	// Barcode Validation
	barcodeValidated bool
	
	// Weight and Dimensions
	hasPhysicalProps bool
}

type CategoryTreeNode struct {
	Category *models.Category
	Level    int
	Path     string
	Children []CategoryTreeNode
}

type CategoryPicker struct {
	tree           []CategoryTreeNode
	selectedIndex  int
	expanded       map[string]bool
	searchTerm     string
	filteredTree   []CategoryTreeNode
}

type SupplierPicker struct {
	suppliers      []models.Supplier
	selectedIndex  int
	searchTerm     string
	filtered       []models.Supplier
	showAll        bool
}

func NewProductFormEnhanced(appCtx *app.Context, mode ProductFormMode, product *models.Product, user *models.User) *ProductFormEnhanced {
	pf := &ProductFormEnhanced{
		state:            ProductFormMainState,
		mode:             mode,
		appCtx:           appCtx,
		editProduct:      product,
		autoGenerateSKU:  true,
		skuPattern:       "AUTO",
		hasPhysicalProps: false,
		formData:         make(map[string]string),
		validationErrors: make(map[string]string),
	}

	pf.currentUser = user

	// Initialize data
	pf.loadDependencies()
	pf.initializeForm()
	
	return pf
}

func (m *ProductFormEnhanced) loadDependencies() {
	if m.appCtx == nil {
		return
	}
	
	ctx := context.Background()
	
	// Load categories with hierarchy
	if cats, err := m.appCtx.CategoryRepo.List(ctx, 500, 0); err == nil {
		m.categories = make([]models.Category, 0, len(cats))
		for _, cat := range cats {
			if cat != nil {
				m.categories = append(m.categories, *cat)
			}
		}
		m.buildCategoryTree()
	}
	
	// Load suppliers
	if sups, err := m.appCtx.SupplierRepo.List(ctx, 500, 0); err == nil {
		m.suppliers = make([]models.Supplier, 0, len(sups))
		for _, sup := range sups {
			if sup != nil {
				m.suppliers = append(m.suppliers, *sup)
			}
		}
		// Sort suppliers by name
		sort.Slice(m.suppliers, func(i, j int) bool {
			return m.suppliers[i].Name < m.suppliers[j].Name
		})
	}
	
	// Initialize pickers
	m.categoryPicker = CategoryPicker{
		tree:         m.categoryTree,
		expanded:     make(map[string]bool),
		filteredTree: m.categoryTree,
	}
	
	m.supplierPicker = SupplierPicker{
		suppliers: m.suppliers,
		filtered:  m.suppliers,
		showAll:   true,
	}
}

func (m *ProductFormEnhanced) buildCategoryTree() {
	categoryMap := make(map[string]*models.Category)
	for i := range m.categories {
		categoryMap[m.categories[i].ID.String()] = &m.categories[i]
	}
	
	// Build tree structure
	var rootNodes []CategoryTreeNode
	
	for _, cat := range m.categories {
		if cat.ParentID == nil {
			node := m.buildCategoryNode(&cat, categoryMap, 0, cat.Name)
			rootNodes = append(rootNodes, node)
		}
	}
	
	m.categoryTree = rootNodes
}

func (m *ProductFormEnhanced) buildCategoryNode(category *models.Category, categoryMap map[string]*models.Category, level int, path string) CategoryTreeNode {
	node := CategoryTreeNode{
		Category: category,
		Level:    level,
		Path:     path,
		Children: []CategoryTreeNode{},
	}
	
	// Find children
	for _, cat := range m.categories {
		if cat.ParentID != nil && *cat.ParentID == category.ID {
			childPath := path + " > " + cat.Name
			childNode := m.buildCategoryNode(&cat, categoryMap, level+1, childPath)
			node.Children = append(node.Children, childNode)
		}
	}
	
	return node
}

func (m *ProductFormEnhanced) initializeForm() {
	var fields []components.Field
	
	// Pre-populate form data if editing
	if m.mode == ProductFormEditMode && m.editProduct != nil {
		m.formData = map[string]string{
			"sku":             m.editProduct.SKU,
			"name":            m.editProduct.Name,
			"description":     m.editProduct.Description,
			"cost_price":      fmt.Sprintf("%.2f", m.editProduct.CostPrice),
			"retail_price":    fmt.Sprintf("%.2f", m.editProduct.RetailPrice),
			"wholesale_price": fmt.Sprintf("%.2f", m.editProduct.WholesalePrice),
			"barcode":         m.editProduct.Barcode,
			"weight":          "0.00",
			"length":          "0.00",
			"width":           "0.00",
			"height":          "0.00",
		}
		m.autoGenerateSKU = false
		
		// Find selected category
		for _, cat := range m.categories {
			if cat.ID == m.editProduct.CategoryID {
				m.selectedCategory = &cat
				break
			}
		}
		
		// Find selected supplier
		if m.editProduct.SupplierID != nil {
			for _, sup := range m.suppliers {
				if sup.ID == *m.editProduct.SupplierID {
					m.selectedSupplier = &sup
					break
				}
			}
		}
	} else {
		// Default values for new product
		m.formData = map[string]string{
			"sku":             "AUTO-GENERATED",
			"name":            "",
			"description":     "",
			"cost_price":      "0.00",
			"retail_price":    "0.00",
			"wholesale_price": "0.00",
			"barcode":         "",
			"weight":          "0.00",
			"length":          "0.00",
			"width":           "0.00",
			"height":          "0.00",
		}
	}
	
	// Build form fields based on mode
	fields = []components.Field{
		{
			Label:       "SKU",
			Key:         "sku",
			Required:    true,
			Type:        components.TextInput,
			Placeholder: "Auto-generated or enter custom",
			Value:       m.formData["sku"],
		},
		{
			Label:       "Product Name",
			Key:         "name",
			Required:    true,
			Type:        components.TextInput,
			Placeholder: "Enter product name",
			Value:       m.formData["name"],
		},
		{
			Label:       "Description",
			Key:         "description",
			Required:    false,
			Type:        components.TextInput,
			Placeholder: "Product description (optional)",
			Value:       m.formData["description"],
		},
		{
			Label:       "Category",
			Key:         "category",
			Required:    true,
			Type:        components.TextInput,
			Placeholder: "Click to select category",
			Value:       m.getCategoryDisplayName(),
		},
		{
			Label:       "Supplier",
			Key:         "supplier",
			Required:    false,
			Type:        components.TextInput,
			Placeholder: "Click to select supplier (optional)",
			Value:       m.getSupplierDisplayName(),
		},
		{
			Label:       "Cost Price ($)",
			Key:         "cost_price",
			Required:    true,
			Type:        components.NumberInput,
			Placeholder: "0.00",
			Value:       m.formData["cost_price"],
		},
		{
			Label:       "Retail Price ($)",
			Key:         "retail_price",
			Required:    true,
			Type:        components.NumberInput,
			Placeholder: "0.00",
			Value:       m.formData["retail_price"],
		},
		{
			Label:       "Wholesale Price ($)",
			Key:         "wholesale_price",
			Required:    false,
			Type:        components.NumberInput,
			Placeholder: "0.00 (defaults to retail)",
			Value:       m.formData["wholesale_price"],
		},
		{
			Label:       "Barcode",
			Key:         "barcode",
			Required:    false,
			Type:        components.TextInput,
			Placeholder: "Product barcode (optional)",
			Value:       m.formData["barcode"],
		},
	}
	
	// Add physical properties if enabled
	if m.hasPhysicalProps {
		physicalFields := []components.Field{
			{
				Label:       "Weight (kg)",
				Key:         "weight",
				Required:    false,
				Type:        components.NumberInput,
				Placeholder: "0.00",
				Value:       m.formData["weight"],
			},
			{
				Label:       "Length (cm)",
				Key:         "length",
				Required:    false,
				Type:        components.NumberInput,
				Placeholder: "0.00",
				Value:       m.formData["length"],
			},
			{
				Label:       "Width (cm)",
				Key:         "width",
				Required:    false,
				Type:        components.NumberInput,
				Placeholder: "0.00",
				Value:       m.formData["width"],
			},
			{
				Label:       "Height (cm)",
				Key:         "height",
				Required:    false,
				Type:        components.NumberInput,
				Placeholder: "0.00",
				Value:       m.formData["height"],
			},
		}
		fields = append(fields, physicalFields...)
	}
	
	// Create form title based on mode
	title := "Create New Product"
	if m.mode == ProductFormEditMode {
		title = "Edit Product"
		if m.editProduct != nil {
			title = fmt.Sprintf("Edit Product: %s", m.editProduct.Name)
		}
	} else if m.mode == ProductFormViewMode {
		title = "View Product Details"
		if m.editProduct != nil {
			title = fmt.Sprintf("Product Details: %s", m.editProduct.Name)
		}
	}
	
	m.mainForm = components.NewFormWithLayout(title, fields, components.TwoColumnLayout)
}

func (m *ProductFormEnhanced) getCategoryDisplayName() string {
	if m.selectedCategory == nil {
		return "Select Category..."
	}
	return m.selectedCategory.Name
}

func (m *ProductFormEnhanced) getSupplierDisplayName() string {
	if m.selectedSupplier == nil {
		return "Select Supplier..."
	}
	return m.selectedSupplier.Name
}

func (m ProductFormEnhanced) Init() tea.Cmd {
	return nil
}

func (m ProductFormEnhanced) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.clearMessages()
	
	switch m.state {
	case ProductFormMainState:
		return m.updateMainForm(msg)
	case ProductFormCategoryPickerState:
		return m.updateCategoryPicker(msg)
	case ProductFormSupplierPickerState:
		return m.updateSupplierPicker(msg)
	case ProductFormSavingState:
		return m.updateSaving(msg)
	case ProductFormValidatingState:
		return m.updateValidating(msg)
	}
	
	return m, nil
}

func (m *ProductFormEnhanced) clearMessages() {
	m.errorMsg = ""
	m.successMsg = ""
	m.infoMsg = ""
}

func (m *ProductFormEnhanced) updateMainForm(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			if m.mode == ProductFormCreateMode {
				return NewProductListEnhanced(m.appCtx, m.currentUser), nil
			} else {
				return NewProductListEnhanced(m.appCtx, m.currentUser), nil
			}
		case "ctrl+c":
			return m, tea.Quit
		case "ctrl+s":
			if m.mode != ProductFormViewMode {
				return m.handleSave()
			}
		case "f1":
			m.infoMsg = m.getHelpText()
			return m, nil
		case "f2":
			m.hasPhysicalProps = !m.hasPhysicalProps
			m.initializeForm()
			return m, nil
		case "f3":
			m.autoGenerateSKU = !m.autoGenerateSKU
			if m.autoGenerateSKU {
				m.formData["sku"] = "AUTO-GENERATED"
				m.initializeForm()
			}
			return m, nil
		case "f4":
			if m.mode != ProductFormViewMode {
				m.state = ProductFormCategoryPickerState
				return m, nil
			}
		case "f5":
			if m.mode != ProductFormViewMode {
				m.state = ProductFormSupplierPickerState
				return m, nil
			}
		}
		
	case components.FormMsg:
		if msg.Action == "submit" && m.mode != ProductFormViewMode {
			return m.handleSave()
		} else if msg.Action == "cancel" {
			if m.mode == ProductFormCreateMode {
				return NewProductListEnhanced(m.appCtx, m.currentUser), nil
			} else {
				return NewProductListEnhanced(m.appCtx, m.currentUser), nil
			}
		}
		
		// Update form data
		if msg.Values != nil {
			for key, value := range msg.Values {
				m.formData[key] = value
			}
		}
	}
	
	// Update form component
	var cmd tea.Cmd
	var model tea.Model
	model, cmd = m.mainForm.Update(msg)
	m.mainForm = model.(components.Form)
	
	return m, cmd
}

func (m *ProductFormEnhanced) updateCategoryPicker(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			m.state = ProductFormMainState
			return m, nil
		case "enter":
			if m.categoryPicker.selectedIndex >= 0 && m.categoryPicker.selectedIndex < len(m.categoryPicker.filteredTree) {
				selected := m.categoryPicker.filteredTree[m.categoryPicker.selectedIndex]
				m.selectedCategory = selected.Category
				m.initializeForm()
				m.state = ProductFormMainState
				return m, nil
			}
		case "up", "k":
			if m.categoryPicker.selectedIndex > 0 {
				m.categoryPicker.selectedIndex--
			}
		case "down", "j":
			if m.categoryPicker.selectedIndex < len(m.categoryPicker.filteredTree)-1 {
				m.categoryPicker.selectedIndex++
			}
		case "space":
			if m.categoryPicker.selectedIndex >= 0 && m.categoryPicker.selectedIndex < len(m.categoryPicker.filteredTree) {
				selected := m.categoryPicker.filteredTree[m.categoryPicker.selectedIndex]
				categoryID := selected.Category.ID.String()
				m.categoryPicker.expanded[categoryID] = !m.categoryPicker.expanded[categoryID]
			}
		case "/":
			// Start search mode
			return m, nil
		default:
			// Handle search input
			if len(msg.String()) == 1 {
				m.categoryPicker.searchTerm += msg.String()
				m.filterCategoryTree()
			} else if msg.String() == "backspace" && len(m.categoryPicker.searchTerm) > 0 {
				m.categoryPicker.searchTerm = m.categoryPicker.searchTerm[:len(m.categoryPicker.searchTerm)-1]
				m.filterCategoryTree()
			}
		}
	}
	
	return m, nil
}

func (m *ProductFormEnhanced) filterCategoryTree() {
	if m.categoryPicker.searchTerm == "" {
		m.categoryPicker.filteredTree = m.categoryTree
		return
	}
	
	searchTerm := strings.ToLower(m.categoryPicker.searchTerm)
	var filtered []CategoryTreeNode
	
	for _, node := range m.categoryTree {
		if m.matchesCategorySearch(node, searchTerm) {
			filtered = append(filtered, node)
		}
	}
	
	m.categoryPicker.filteredTree = filtered
	if m.categoryPicker.selectedIndex >= len(filtered) {
		m.categoryPicker.selectedIndex = len(filtered) - 1
	}
	if m.categoryPicker.selectedIndex < 0 && len(filtered) > 0 {
		m.categoryPicker.selectedIndex = 0
	}
}

func (m *ProductFormEnhanced) matchesCategorySearch(node CategoryTreeNode, searchTerm string) bool {
	if strings.Contains(strings.ToLower(node.Category.Name), searchTerm) ||
		strings.Contains(strings.ToLower(node.Category.Description), searchTerm) ||
		strings.Contains(strings.ToLower(node.Path), searchTerm) {
		return true
	}
	
	// Check children
	for _, child := range node.Children {
		if m.matchesCategorySearch(child, searchTerm) {
			return true
		}
	}
	
	return false
}

func (m *ProductFormEnhanced) updateSupplierPicker(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			m.state = ProductFormMainState
			return m, nil
		case "enter":
			if m.supplierPicker.selectedIndex >= 0 && m.supplierPicker.selectedIndex < len(m.supplierPicker.filtered) {
				selected := m.supplierPicker.filtered[m.supplierPicker.selectedIndex]
				m.selectedSupplier = &selected
				m.initializeForm()
				m.state = ProductFormMainState
				return m, nil
			}
		case "up", "k":
			if m.supplierPicker.selectedIndex > 0 {
				m.supplierPicker.selectedIndex--
			}
		case "down", "j":
			if m.supplierPicker.selectedIndex < len(m.supplierPicker.filtered)-1 {
				m.supplierPicker.selectedIndex++
			}
		case "ctrl+n":
			m.selectedSupplier = nil
			m.initializeForm()
			m.state = ProductFormMainState
			return m, nil
		default:
			// Handle search input
			if len(msg.String()) == 1 {
				m.supplierPicker.searchTerm += msg.String()
				m.filterSuppliers()
			} else if msg.String() == "backspace" && len(m.supplierPicker.searchTerm) > 0 {
				m.supplierPicker.searchTerm = m.supplierPicker.searchTerm[:len(m.supplierPicker.searchTerm)-1]
				m.filterSuppliers()
			}
		}
	}
	
	return m, nil
}

func (m *ProductFormEnhanced) filterSuppliers() {
	if m.supplierPicker.searchTerm == "" {
		m.supplierPicker.filtered = m.suppliers
		return
	}
	
	searchTerm := strings.ToLower(m.supplierPicker.searchTerm)
	var filtered []models.Supplier
	
	for _, supplier := range m.suppliers {
		if strings.Contains(strings.ToLower(supplier.Name), searchTerm) ||
			strings.Contains(strings.ToLower(supplier.Code), searchTerm) ||
			strings.Contains(strings.ToLower(supplier.Email), searchTerm) {
			filtered = append(filtered, supplier)
		}
	}
	
	m.supplierPicker.filtered = filtered
	if m.supplierPicker.selectedIndex >= len(filtered) {
		m.supplierPicker.selectedIndex = len(filtered) - 1
	}
	if m.supplierPicker.selectedIndex < 0 && len(filtered) > 0 {
		m.supplierPicker.selectedIndex = 0
	}
}

func (m *ProductFormEnhanced) updateSaving(msg tea.Msg) (tea.Model, tea.Cmd) {
	// Show saving animation/progress
	return m, nil
}

func (m *ProductFormEnhanced) updateValidating(msg tea.Msg) (tea.Model, tea.Cmd) {
	// Show validation progress
	return m, nil
}

func (m *ProductFormEnhanced) handleSave() (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	// Validate form
	if !m.validateForm() {
		return m, nil
	}
	
	m.state = ProductFormSavingState
	
	ctx := context.Background()
	
	// Prepare product data
	product := m.buildProductFromForm()
	if product == nil {
		m.errorMsg = "Failed to build product data"
		m.state = ProductFormMainState
		return m, nil
	}
	
	var err error
	if m.mode == ProductFormCreateMode {
		err = m.appCtx.ProductRepo.Create(ctx, product)
		if err == nil {
			m.successMsg = fmt.Sprintf("Product '%s' created successfully", product.Name)
		}
	} else if m.mode == ProductFormEditMode {
		err = m.appCtx.ProductRepo.Update(ctx, product)
		if err == nil {
			m.successMsg = fmt.Sprintf("Product '%s' updated successfully", product.Name)
		}
	}
	
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to save product: %v", err)
		m.state = ProductFormMainState
		return m, nil
	}
	
	// Redirect back to product list  
	return NewProductListEnhanced(m.appCtx, m.currentUser), nil
}

func (m *ProductFormEnhanced) validateForm() bool {
	m.validationErrors = make(map[string]string)
	isValid := true
	
	// Validate required fields
	if strings.TrimSpace(m.formData["name"]) == "" {
		m.validationErrors["name"] = "Product name is required"
		isValid = false
	}
	
	if m.selectedCategory == nil {
		m.validationErrors["category"] = "Category selection is required"
		isValid = false
	}
	
	// Validate SKU
	sku := strings.TrimSpace(m.formData["sku"])
	if sku == "" || sku == "AUTO-GENERATED" {
		if !m.autoGenerateSKU {
			m.validationErrors["sku"] = "SKU is required when not auto-generating"
			isValid = false
		}
	}
	
	// Validate prices
	if costPrice, err := strconv.ParseFloat(m.formData["cost_price"], 64); err != nil || costPrice < 0 {
		m.validationErrors["cost_price"] = "Valid cost price is required"
		isValid = false
	}
	
	if retailPrice, err := strconv.ParseFloat(m.formData["retail_price"], 64); err != nil || retailPrice < 0 {
		m.validationErrors["retail_price"] = "Valid retail price is required"
		isValid = false
	}
	
	// Validate wholesale price if provided
	if m.formData["wholesale_price"] != "" && m.formData["wholesale_price"] != "0.00" {
		if wholesalePrice, err := strconv.ParseFloat(m.formData["wholesale_price"], 64); err != nil || wholesalePrice < 0 {
			m.validationErrors["wholesale_price"] = "Valid wholesale price required"
			isValid = false
		}
	}
	
	// Validate barcode format if provided
	if barcode := strings.TrimSpace(m.formData["barcode"]); barcode != "" {
		if !m.isValidBarcode(barcode) {
			m.validationErrors["barcode"] = "Invalid barcode format"
			isValid = false
		}
	}
	
	if !isValid {
		m.errorMsg = "Please correct the validation errors below"
	}
	
	return isValid
}

func (m *ProductFormEnhanced) isValidBarcode(barcode string) bool {
	// Basic barcode validation - can be enhanced
	if len(barcode) < 8 || len(barcode) > 14 {
		return false
	}
	
	// Check if all characters are digits
	for _, char := range barcode {
		if char < '0' || char > '9' {
			return false
		}
	}
	
	return true
}

func (m *ProductFormEnhanced) buildProductFromForm() *models.Product {
	if m.selectedCategory == nil {
		return nil
	}
	
	// Parse prices
	costPrice, _ := strconv.ParseFloat(m.formData["cost_price"], 64)
	retailPrice, _ := strconv.ParseFloat(m.formData["retail_price"], 64)
	wholesalePrice := retailPrice // Default to retail
	if m.formData["wholesale_price"] != "" && m.formData["wholesale_price"] != "0.00" {
		if wp, err := strconv.ParseFloat(m.formData["wholesale_price"], 64); err == nil {
			wholesalePrice = wp
		}
	}
	
	// Generate SKU if needed
	sku := strings.TrimSpace(m.formData["sku"])
	if sku == "" || sku == "AUTO-GENERATED" || m.autoGenerateSKU {
		sku = m.generateSKU()
	}
	
	product := &models.Product{
		SKU:            sku,
		Name:           strings.TrimSpace(m.formData["name"]),
		Description:    strings.TrimSpace(m.formData["description"]),
		CategoryID:     m.selectedCategory.ID,
		CostPrice:      costPrice,
		RetailPrice:    retailPrice,
		WholesalePrice: wholesalePrice,
		Barcode:        strings.TrimSpace(m.formData["barcode"]),
	}
	
	// Set supplier if selected
	if m.selectedSupplier != nil {
		product.SupplierID = &m.selectedSupplier.ID
	}
	
	// If editing, preserve ID and timestamps
	if m.mode == ProductFormEditMode && m.editProduct != nil {
		product.ID = m.editProduct.ID
		product.CreatedAt = m.editProduct.CreatedAt
	}
	
	return product
}

func (m *ProductFormEnhanced) generateSKU() string {
	// Enhanced SKU generation
	timestamp := time.Now().Unix()
	categoryPrefix := "GEN"
	
	if m.selectedCategory != nil {
		// Use first 3 characters of category name (uppercase)
		name := strings.ToUpper(m.selectedCategory.Name)
		if len(name) >= 3 {
			categoryPrefix = name[:3]
		} else {
			categoryPrefix = name
		}
		
		// Remove non-alphabetic characters
		var cleanPrefix strings.Builder
		for _, char := range categoryPrefix {
			if (char >= 'A' && char <= 'Z') {
				cleanPrefix.WriteRune(char)
			}
		}
		if cleanPrefix.Len() > 0 {
			categoryPrefix = cleanPrefix.String()
		}
	}
	
	return fmt.Sprintf("%s-%d", categoryPrefix, timestamp%100000)
}

func (m ProductFormEnhanced) View() string {
	switch m.state {
	case ProductFormMainState:
		return m.viewMainForm()
	case ProductFormCategoryPickerState:
		return m.viewCategoryPicker()
	case ProductFormSupplierPickerState:
		return m.viewSupplierPicker()
	case ProductFormSavingState:
		return m.viewSaving()
	case ProductFormValidatingState:
		return m.viewValidating()
	}
	
	return "Invalid state"
}

func (m ProductFormEnhanced) viewMainForm() string {
	var content strings.Builder
	
	// Header with mode indicator
	modeText := "Create Mode"
	if m.mode == ProductFormEditMode {
		modeText = "Edit Mode"
	} else if m.mode == ProductFormViewMode {
		modeText = "View Mode"
	}
	
	header := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.Primary).
		Render(fmt.Sprintf("Enhanced Product Form - %s", modeText))
	content.WriteString(header)
	content.WriteString("\n\n")
	
	// Show messages
	if m.errorMsg != "" {
		errorStyle := lipgloss.NewStyle().Foreground(styles.Danger).Bold(true)
		content.WriteString(errorStyle.Render("Error: " + m.errorMsg))
		content.WriteString("\n\n")
	}
	
	if m.successMsg != "" {
		successStyle := lipgloss.NewStyle().Foreground(styles.Success).Bold(true)
		content.WriteString(successStyle.Render("Success: " + m.successMsg))
		content.WriteString("\n\n")
	}
	
	if m.infoMsg != "" {
		infoStyle := lipgloss.NewStyle().Foreground(styles.Info)
		content.WriteString(infoStyle.Render("Info: " + m.infoMsg))
		content.WriteString("\n\n")
	}
	
	// Show validation errors
	if len(m.validationErrors) > 0 {
		errorStyle := lipgloss.NewStyle().Foreground(styles.Danger)
		content.WriteString(errorStyle.Render("Validation Errors:"))
		content.WriteString("\n")
		for field, error := range m.validationErrors {
			content.WriteString(errorStyle.Render(fmt.Sprintf("  • %s: %s", field, error)))
			content.WriteString("\n")
		}
		content.WriteString("\n")
	}
	
	// Form content
	content.WriteString(m.mainForm.View())
	content.WriteString("\n\n")
	
	// Status indicators
	var indicators []string
	
	if m.selectedCategory != nil {
		indicators = append(indicators, fmt.Sprintf("Category: %s", m.selectedCategory.Name))
	}
	
	if m.selectedSupplier != nil {
		indicators = append(indicators, fmt.Sprintf("Supplier: %s", m.selectedSupplier.Name))
	}
	
	if m.autoGenerateSKU {
		indicators = append(indicators, "Auto-SKU: ON")
	}
	
	if m.hasPhysicalProps {
		indicators = append(indicators, "Physical Props: ON")
	}
	
	if len(indicators) > 0 {
		statusStyle := lipgloss.NewStyle().Foreground(styles.Secondary)
		content.WriteString(statusStyle.Render("Status: " + strings.Join(indicators, " | ")))
		content.WriteString("\n\n")
	}
	
	// Help text
	helpText := m.getHelpText()
	helpStyle := lipgloss.NewStyle().Foreground(styles.Subtle).Italic(true)
	content.WriteString(helpStyle.Render(helpText))
	
	return content.String()
}

func (m ProductFormEnhanced) viewCategoryPicker() string {
	var content strings.Builder
	
	title := lipgloss.NewStyle().Bold(true).Foreground(styles.Primary).Render("Select Category")
	content.WriteString(title)
	content.WriteString("\n\n")
	
	// Search bar
	if m.categoryPicker.searchTerm != "" {
		searchStyle := lipgloss.NewStyle().Foreground(styles.Info)
		content.WriteString(searchStyle.Render("Search: " + m.categoryPicker.searchTerm))
		content.WriteString("\n\n")
	}
	
	// Category tree
	for i, node := range m.categoryPicker.filteredTree {
		style := lipgloss.NewStyle()
		
		if i == m.categoryPicker.selectedIndex {
			style = style.Background(styles.Primary).Foreground(styles.Light)
		}
		
		// Indentation for hierarchy
		indent := strings.Repeat("  ", node.Level)
		
		// Expansion indicator
		expansionIndicator := ""
		if len(node.Children) > 0 {
			categoryID := node.Category.ID.String()
			if m.categoryPicker.expanded[categoryID] {
				expansionIndicator = "▼ "
			} else {
				expansionIndicator = "▶ "
			}
		}
		
		line := fmt.Sprintf("%s%s%s (%s)", indent, expansionIndicator, node.Category.Name, node.Category.Description)
		content.WriteString(style.Render(line))
		content.WriteString("\n")
	}
	
	// Help text for category picker
	content.WriteString("\n")
	helpStyle := lipgloss.NewStyle().Foreground(styles.Subtle).Italic(true)
	helpText := "↑↓: navigate | Enter: select | Space: expand/collapse | Type: search | Esc: cancel"
	content.WriteString(helpStyle.Render(helpText))
	
	return content.String()
}

func (m ProductFormEnhanced) viewSupplierPicker() string {
	var content strings.Builder
	
	title := lipgloss.NewStyle().Bold(true).Foreground(styles.Primary).Render("Select Supplier")
	content.WriteString(title)
	content.WriteString("\n\n")
	
	// Search bar
	if m.supplierPicker.searchTerm != "" {
		searchStyle := lipgloss.NewStyle().Foreground(styles.Info)
		content.WriteString(searchStyle.Render("Search: " + m.supplierPicker.searchTerm))
		content.WriteString("\n\n")
	}
	
	// Supplier list
	for i, supplier := range m.supplierPicker.filtered {
		style := lipgloss.NewStyle()
		
		if i == m.supplierPicker.selectedIndex {
			style = style.Background(styles.Primary).Foreground(styles.Light)
		}
		
		line := fmt.Sprintf("%s - %s (%s)", supplier.Code, supplier.Name, supplier.Email)
		content.WriteString(style.Render(line))
		content.WriteString("\n")
	}
	
	// Help text for supplier picker
	content.WriteString("\n")
	helpStyle := lipgloss.NewStyle().Foreground(styles.Subtle).Italic(true)
	helpText := "↑↓: navigate | Enter: select | Ctrl+N: clear selection | Type: search | Esc: cancel"
	content.WriteString(helpStyle.Render(helpText))
	
	return content.String()
}

func (m ProductFormEnhanced) viewSaving() string {
	savingStyle := lipgloss.NewStyle().Foreground(styles.Info).Bold(true)
	return savingStyle.Render("Saving product... Please wait.")
}

func (m ProductFormEnhanced) viewValidating() string {
	validatingStyle := lipgloss.NewStyle().Foreground(styles.Info).Bold(true)
	return validatingStyle.Render("Validating product data... Please wait.")
}

func (m ProductFormEnhanced) getHelpText() string {
	if m.mode == ProductFormViewMode {
		return "Esc: back to list | F1: help"
	}
	
	help := []string{
		"Tab/Shift+Tab: navigate fields",
		"Enter: submit form",
		"Esc: cancel and return",
		"Ctrl+S: save",
		"F1: help",
		"F2: toggle physical properties",
		"F3: toggle auto-SKU generation",
		"F4: select category",
		"F5: select supplier",
	}
	
	return strings.Join(help, " | ")
}
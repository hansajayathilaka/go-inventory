package models

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/components"
)

type ProductForm struct {
	form       components.Form
	appCtx     *app.Context
	categories []models.Category
	suppliers  []models.Supplier
	errorMsg   string
	successMsg string
}

func NewProductFormWithContext(appCtx *app.Context) ProductForm {
	pf := ProductForm{
		appCtx:     appCtx,
		categories: []models.Category{},
		suppliers:  []models.Supplier{},
	}
	
	// Load categories and suppliers first, then create form
	if appCtx != nil {
		pf.loadDependencies()
	}
	
	pf.createForm()
	return pf
}

func (m *ProductForm) loadDependencies() {
	ctx := context.Background()
	
	// Load categories
	if cats, err := m.appCtx.CategoryRepo.List(ctx, 100, 0); err == nil {
		m.categories = make([]models.Category, len(cats))
		for i, cat := range cats {
			m.categories[i] = *cat
		}
	}
	
	// Load suppliers
	if sups, err := m.appCtx.SupplierRepo.List(ctx, 100, 0); err == nil {
		m.suppliers = make([]models.Supplier, len(sups))
		for i, sup := range sups {
			m.suppliers[i] = *sup
		}
	}
}

func (m *ProductForm) createForm() {
	// Create category options
	categoryOptions := []string{""}
	for _, cat := range m.categories {
		categoryOptions = append(categoryOptions, cat.Name)
	}
	
	// Create supplier options
	supplierOptions := []string{""}
	for _, sup := range m.suppliers {
		supplierOptions = append(supplierOptions, sup.Name)
	}
	
	fields := []components.Field{
		{Label: "SKU", Key: "sku", Required: true, Type: components.TextInput, Placeholder: "AUTO-GENERATED"},
		{Label: "Name", Key: "name", Required: true, Type: components.TextInput},
		{Label: "Description", Key: "description", Required: false, Type: components.TextInput},
		{Label: "Category", Key: "category", Required: true, Type: components.SelectInput, Options: categoryOptions},
		{Label: "Supplier", Key: "supplier", Required: false, Type: components.SelectInput, Options: supplierOptions},
		{Label: "Cost Price", Key: "cost_price", Required: true, Type: components.NumberInput, Placeholder: "0.00"},
		{Label: "Retail Price", Key: "retail_price", Required: true, Type: components.NumberInput, Placeholder: "0.00"},
		{Label: "Wholesale Price", Key: "wholesale_price", Required: false, Type: components.NumberInput, Placeholder: "0.00"},
		{Label: "Barcode", Key: "barcode", Required: false, Type: components.TextInput},
	}
	
	m.form = components.NewFormWithLayout("Add Product", fields, components.TwoColumnLayout)
}

func (m ProductForm) Init() tea.Cmd {
	return nil
}

func (m ProductForm) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			return NewProductMenuWithContext(m.appCtx), nil
		case "ctrl+c":
			return m, tea.Quit
		}
		
	case components.FormMsg:
		if msg.Action == "submit" {
			return m.handleSubmit(msg.Values)
		} else if msg.Action == "cancel" {
			return NewProductMenuWithContext(m.appCtx), nil
		}
	}
	
	// Update form
	var cmd tea.Cmd
	var model tea.Model
	model, cmd = m.form.Update(msg)
	m.form = model.(components.Form)
	return m, cmd
}

func (m ProductForm) View() string {
	var content strings.Builder
	
	// Show messages
	if m.errorMsg != "" {
		content.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("9")).Render("Error: " + m.errorMsg))
		content.WriteString("\n\n")
	}
	if m.successMsg != "" {
		content.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("10")).Render("Success: " + m.successMsg))
		content.WriteString("\n\n")
	}
	
	content.WriteString(m.form.View())
	content.WriteString("\n\nPress 'tab' to navigate, 'enter' to submit, 'esc' to cancel")
	
	return content.String()
}

func (m ProductForm) handleSubmit(values map[string]string) (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	
	// Parse form data
	name := strings.TrimSpace(values["name"])
	description := strings.TrimSpace(values["description"])
	categoryName := values["category"]
	supplierName := values["supplier"]
	
	// Parse prices
	costPrice, err := strconv.ParseFloat(values["cost_price"], 64)
	if err != nil {
		m.errorMsg = "Invalid cost price"
		return m, nil
	}
	
	retailPrice, err := strconv.ParseFloat(values["retail_price"], 64)
	if err != nil {
		m.errorMsg = "Invalid retail price"
		return m, nil
	}
	
	wholesalePrice := retailPrice // Default to retail if not specified
	if values["wholesale_price"] != "" {
		if wp, err := strconv.ParseFloat(values["wholesale_price"], 64); err == nil {
			wholesalePrice = wp
		}
	}
	
	barcode := strings.TrimSpace(values["barcode"])
	
	// Find category
	var categoryID *models.Category
	for _, cat := range m.categories {
		if cat.Name == categoryName {
			categoryID = &cat
			break
		}
	}
	if categoryID == nil {
		m.errorMsg = "Category not found"
		return m, nil
	}
	
	// Find supplier (optional)
	var supplierID *models.Supplier
	if supplierName != "" {
		for _, sup := range m.suppliers {
			if sup.Name == supplierName {
				supplierID = &sup
				break
			}
		}
	}
	
	// Generate SKU if not provided or empty
	sku := strings.TrimSpace(values["sku"])
	if sku == "" || sku == "AUTO-GENERATED" {
		// Simple SKU generation - could be enhanced
		sku = fmt.Sprintf("SKU%d", len(m.categories)*100 + len(m.suppliers))
	}
	
	// Create product
	product := models.Product{
		SKU:            sku,
		Name:           name,
		Description:    description,
		CategoryID:     categoryID.ID,
		CostPrice:      costPrice,
		RetailPrice:    retailPrice,
		WholesalePrice: wholesalePrice,
		Barcode:        barcode,
	}
	
	if supplierID != nil {
		product.SupplierID = &supplierID.ID
	}
	
	// Save to database
	if err := m.appCtx.ProductRepo.Create(ctx, &product); err != nil {
		m.errorMsg = fmt.Sprintf("Failed to create product: %v", err)
		return m, nil
	}
	
	m.successMsg = fmt.Sprintf("Product '%s' created successfully", name)
	
	// Redirect to product list
	return NewProductListWithContext(m.appCtx), nil
}
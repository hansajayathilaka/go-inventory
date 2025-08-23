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

type StockAdjustmentForm struct {
	form       components.Form
	appCtx     *app.Context
	products   []models.Product
	locations  []models.Location
	errorMsg   string
	successMsg string
}

func NewStockAdjustmentFormWithContext(appCtx *app.Context) StockAdjustmentForm {
	saf := StockAdjustmentForm{
		appCtx:    appCtx,
		products:  []models.Product{},
		locations: []models.Location{},
	}
	
	// Load products and locations
	if appCtx != nil {
		saf.loadDependencies()
	}
	
	saf.createForm()
	return saf
}

func (m *StockAdjustmentForm) loadDependencies() {
	ctx := context.Background()
	
	// Load products
	if prods, err := m.appCtx.ProductRepo.List(ctx, 100, 0); err == nil {
		m.products = make([]models.Product, len(prods))
		for i, prod := range prods {
			m.products[i] = *prod
		}
	}
	
	// Load locations
	if locs, err := m.appCtx.LocationRepo.List(ctx, 100, 0); err == nil {
		m.locations = make([]models.Location, len(locs))
		for i, loc := range locs {
			m.locations[i] = *loc
		}
	}
}

func (m *StockAdjustmentForm) createForm() {
	// Create product options
	productOptions := []string{""}
	for _, prod := range m.products {
		productOptions = append(productOptions, fmt.Sprintf("%s - %s", prod.SKU, prod.Name))
	}
	
	// Create location options
	locationOptions := []string{""}
	for _, loc := range m.locations {
		locationOptions = append(locationOptions, loc.Name)
	}
	
	fields := []components.Field{
		{Label: "Product", Key: "product", Required: true, Type: components.SelectInput, Options: productOptions},
		{Label: "Location", Key: "location", Required: true, Type: components.SelectInput, Options: locationOptions},
		{Label: "Adjustment Quantity", Key: "quantity", Required: true, Type: components.NumberInput, Placeholder: "Enter positive or negative number"},
		{Label: "Reason/Notes", Key: "notes", Required: false, Type: components.TextInput, Placeholder: "Reason for adjustment"},
	}
	
	m.form = components.NewFormWithLayout("Stock Adjustment", fields, components.CompactLayout)
}

func (m StockAdjustmentForm) Init() tea.Cmd {
	return nil
}

func (m StockAdjustmentForm) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			return NewInventoryMenuWithContext(m.appCtx), nil
		case "ctrl+c":
			return m, tea.Quit
		}
		
	case components.FormMsg:
		if msg.Action == "submit" {
			return m.handleSubmit(msg.Values)
		} else if msg.Action == "cancel" {
			return NewInventoryMenuWithContext(m.appCtx), nil
		}
	}
	
	// Update form
	var cmd tea.Cmd
	var model tea.Model
	model, cmd = m.form.Update(msg)
	m.form = model.(components.Form)
	return m, cmd
}

func (m StockAdjustmentForm) View() string {
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

func (m StockAdjustmentForm) handleSubmit(values map[string]string) (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	
	// Parse form data
	productSelection := values["product"]
	locationName := values["location"]
	quantityStr := strings.TrimSpace(values["quantity"])
	notes := strings.TrimSpace(values["notes"])
	
	// Parse quantity
	quantity, err := strconv.Atoi(quantityStr)
	if err != nil {
		m.errorMsg = "Invalid quantity"
		return m, nil
	}
	
	if quantity == 0 {
		m.errorMsg = "Quantity cannot be zero"
		return m, nil
	}
	
	// Find product by SKU-Name format
	var selectedProduct *models.Product
	for _, prod := range m.products {
		productDisplay := fmt.Sprintf("%s - %s", prod.SKU, prod.Name)
		if productDisplay == productSelection {
			selectedProduct = &prod
			break
		}
	}
	if selectedProduct == nil {
		m.errorMsg = "Product not found"
		return m, nil
	}
	
	// Find location
	var selectedLocation *models.Location
	for _, loc := range m.locations {
		if loc.Name == locationName {
			selectedLocation = &loc
			break
		}
	}
	if selectedLocation == nil {
		m.errorMsg = "Location not found"
		return m, nil
	}
	
	// Get system user (admin) for the adjustment
	// TODO: Replace with actual logged-in user when authentication is implemented
	admin, err := m.appCtx.UserRepo.GetByUsername(ctx, "admin")
	if err != nil {
		m.errorMsg = "System user not found - please ensure database is seeded"
		return m, nil
	}
	
	// Perform stock adjustment using inventory service
	err = m.appCtx.InventoryService.AdjustStock(ctx, selectedProduct.ID, selectedLocation.ID, quantity, admin.ID, notes)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to adjust stock: %v", err)
		return m, nil
	}
	
	m.successMsg = fmt.Sprintf("Stock adjusted successfully: %s %d units at %s", 
		selectedProduct.Name, quantity, selectedLocation.Name)
	
	// Redirect to stock levels view
	return NewStockLevelsListWithContext(m.appCtx), nil
}
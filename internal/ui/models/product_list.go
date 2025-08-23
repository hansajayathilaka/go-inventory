package models

import (
	"context"
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/components"
)

type ProductListState int

const (
	ProductListView ProductListState = iota
	ProductDetailView
)

type ProductList struct {
	state        ProductListState
	table        components.Table
	appCtx       *app.Context
	products     []models.Product
	selectedProduct *models.Product
	errorMsg     string
	successMsg   string
}

func NewProductListWithContext(appCtx *app.Context) ProductList {
	columns := []components.Column{
		{Header: "SKU", Width: 12, Flex: false},
		{Header: "Name", Width: 25, Flex: true},
		{Header: "Category", Width: 15, Flex: false},
		{Header: "Cost Price", Width: 12, Flex: false},
		{Header: "Retail Price", Width: 12, Flex: false},
	}
	table := components.NewTable("Products", columns)
	
	pl := ProductList{
		state:    ProductListView,
		table:    table,
		appCtx:   appCtx,
		products: []models.Product{},
	}
	
	return pl
}

func (m ProductList) Init() tea.Cmd {
	return tea.Sequence(
		tea.Cmd(func() tea.Msg { return m.loadProducts() }),
	)
}

func (m ProductList) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			switch m.state {
			case ProductListView:
				return NewProductMenuWithContext(m.appCtx), nil
			case ProductDetailView:
				m.state = ProductListView
				return m, nil
			}
		case "ctrl+c":
			return m, tea.Quit
		case "r":
			if m.state == ProductListView {
				return m, tea.Cmd(func() tea.Msg { return m.loadProducts() })
			}
		}
		
	case components.TableMsg:
		if m.state == ProductListView {
			if msg.Action == "select" && msg.Index >= 0 && msg.Index < len(m.products) {
				m.selectedProduct = &m.products[msg.Index]
				m.state = ProductDetailView
				return m, nil
			}
		}
		
	case ProductList:
		// Handle product load result
		return msg, nil
	}
	
	// Update active component
	if m.state == ProductListView {
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.table.Update(msg)
		m.table = model.(components.Table)
		return m, cmd
	}
	
	return m, nil
}

func (m ProductList) View() string {
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
	
	switch m.state {
	case ProductListView:
		content.WriteString(m.table.View())
		content.WriteString("\n\nPress 'enter' to view details, 'r' to refresh, 'esc' to go back")
		
	case ProductDetailView:
		if m.selectedProduct != nil {
			content.WriteString(m.renderProductDetails())
			content.WriteString("\n\nPress 'esc' to go back to list")
		}
	}
	
	return content.String()
}

func (m ProductList) loadProducts() ProductList {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m
	}
	
	ctx := context.Background()
	products, err := m.appCtx.ProductRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load products: %v", err)
		return m
	}
	
	m.products = make([]models.Product, len(products))
	for i, product := range products {
		m.products[i] = *product
	}
	
	// Convert products to table rows
	rows := make([]components.Row, len(products))
	for i, product := range products {
		categoryName := "Unknown"
		if product.Category.Name != "" {
			categoryName = product.Category.Name
		}
		
		rows[i] = components.Row{
			product.SKU,
			product.Name,
			categoryName,
			fmt.Sprintf("$%.2f", product.CostPrice),
			fmt.Sprintf("$%.2f", product.RetailPrice),
		}
	}
	
	m.table.SetRows(rows)
	return m
}

func (m ProductList) renderProductDetails() string {
	if m.selectedProduct == nil {
		return "No product selected"
	}
	
	p := m.selectedProduct
	var content strings.Builder
	
	content.WriteString(lipgloss.NewStyle().Bold(true).Render("Product Details"))
	content.WriteString("\n\n")
	
	details := [][]string{
		{"SKU:", p.SKU},
		{"Name:", p.Name},
		{"Description:", p.Description},
		{"Cost Price:", fmt.Sprintf("$%.2f", p.CostPrice)},
		{"Retail Price:", fmt.Sprintf("$%.2f", p.RetailPrice)},
		{"Wholesale Price:", fmt.Sprintf("$%.2f", p.WholesalePrice)},
	}
	
	if p.Barcode != "" {
		details = append(details, []string{"Barcode:", p.Barcode})
	}
	
	if p.Category.Name != "" {
		details = append(details, []string{"Category:", p.Category.Name})
	}
	
	if p.Supplier != nil {
		details = append(details, []string{"Supplier:", p.Supplier.Name})
	}
	
	for _, detail := range details {
		line := lipgloss.NewStyle().Bold(true).Width(15).Render(detail[0])
		line += " " + detail[1]
		content.WriteString(line)
		content.WriteString("\n")
	}
	
	return content.String()
}
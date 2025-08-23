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

type StockLevelsState int

const (
	StockLevelsListView StockLevelsState = iota
	StockDetailView
)

type StockLevelsList struct {
	state       StockLevelsState
	table       components.Table
	appCtx      *app.Context
	inventory   []models.Inventory
	selectedInventory *models.Inventory
	errorMsg    string
	successMsg  string
}

func NewStockLevelsListWithContext(appCtx *app.Context) StockLevelsList {
	columns := []components.Column{
		{Header: "Product", Width: 25, Flex: true},
		{Header: "SKU", Width: 12, Flex: false},
		{Header: "Location", Width: 15, Flex: false},
		{Header: "Current", Width: 10, Flex: false},
		{Header: "Reserved", Width: 10, Flex: false},
		{Header: "Available", Width: 10, Flex: false},
		{Header: "Reorder", Width: 10, Flex: false},
	}
	table := components.NewTable("Stock Levels", columns)
	
	sl := StockLevelsList{
		state:     StockLevelsListView,
		table:     table,
		appCtx:    appCtx,
		inventory: []models.Inventory{},
	}
	
	return sl
}

func (m StockLevelsList) Init() tea.Cmd {
	return tea.Sequence(
		tea.Cmd(func() tea.Msg { return m.loadStockLevels() }),
	)
}

func (m StockLevelsList) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			switch m.state {
			case StockLevelsListView:
				return NewInventoryMenuWithContext(m.appCtx), nil
			case StockDetailView:
				m.state = StockLevelsListView
				return m, nil
			}
		case "ctrl+c":
			return m, tea.Quit
		case "r":
			if m.state == StockLevelsListView {
				return m, tea.Cmd(func() tea.Msg { return m.loadStockLevels() })
			}
		}
		
	case components.TableMsg:
		if m.state == StockLevelsListView {
			if msg.Action == "select" && msg.Index >= 0 && msg.Index < len(m.inventory) {
				m.selectedInventory = &m.inventory[msg.Index]
				m.state = StockDetailView
				return m, nil
			}
		}
		
	case StockLevelsList:
		// Handle stock load result
		return msg, nil
	}
	
	// Update active component
	if m.state == StockLevelsListView {
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.table.Update(msg)
		m.table = model.(components.Table)
		return m, cmd
	}
	
	return m, nil
}

func (m StockLevelsList) View() string {
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
	case StockLevelsListView:
		content.WriteString(m.table.View())
		content.WriteString("\n\nPress 'enter' to view details, 'r' to refresh, 'esc' to go back")
		
	case StockDetailView:
		if m.selectedInventory != nil {
			content.WriteString(m.renderStockDetails())
			content.WriteString("\n\nPress 'esc' to go back to list")
		}
	}
	
	return content.String()
}

func (m StockLevelsList) loadStockLevels() StockLevelsList {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m
	}
	
	ctx := context.Background()
	inventory, err := m.appCtx.InventoryRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load stock levels: %v", err)
		return m
	}
	
	m.inventory = make([]models.Inventory, len(inventory))
	for i, inv := range inventory {
		m.inventory[i] = *inv
	}
	
	// Convert inventory to table rows
	rows := make([]components.Row, len(inventory))
	for i, inv := range inventory {
		productName := "Unknown"
		sku := "N/A"
		if inv.Product.Name != "" {
			productName = inv.Product.Name
			sku = inv.Product.SKU
		}
		
		locationName := "Unknown"
		if inv.Location.Name != "" {
			locationName = inv.Location.Name
		}
		
		available := inv.Quantity - inv.ReservedQuantity
		if available < 0 {
			available = 0
		}
		
		rows[i] = components.Row{
			productName,
			sku,
			locationName,
			fmt.Sprintf("%d", inv.Quantity),
			fmt.Sprintf("%d", inv.ReservedQuantity),
			fmt.Sprintf("%d", available),
			fmt.Sprintf("%d", inv.ReorderLevel),
		}
	}
	
	m.table.SetRows(rows)
	return m
}

func (m StockLevelsList) renderStockDetails() string {
	if m.selectedInventory == nil {
		return "No inventory selected"
	}
	
	inv := m.selectedInventory
	var content strings.Builder
	
	content.WriteString(lipgloss.NewStyle().Bold(true).Render("Stock Details"))
	content.WriteString("\n\n")
	
	productName := "Unknown Product"
	sku := "N/A"
	if inv.Product.Name != "" {
		productName = inv.Product.Name
		sku = inv.Product.SKU
	}
	
	locationName := "Unknown Location"
	if inv.Location.Name != "" {
		locationName = inv.Location.Name
	}
	
	available := inv.Quantity - inv.ReservedQuantity
	if available < 0 {
		available = 0
	}
	
	details := [][]string{
		{"Product:", productName},
		{"SKU:", sku},
		{"Location:", locationName},
		{"Current Quantity:", fmt.Sprintf("%d", inv.Quantity)},
		{"Reserved Quantity:", fmt.Sprintf("%d", inv.ReservedQuantity)},
		{"Available Quantity:", fmt.Sprintf("%d", available)},
		{"Reorder Level:", fmt.Sprintf("%d", inv.ReorderLevel)},
		{"Last Updated:", inv.LastUpdated.Format("2006-01-02 15:04:05")},
	}
	
	for _, detail := range details {
		line := lipgloss.NewStyle().Bold(true).Width(20).Render(detail[0])
		line += " " + detail[1]
		content.WriteString(line)
		content.WriteString("\n")
	}
	
	// Add low stock warning
	if inv.Quantity <= inv.ReorderLevel {
		content.WriteString("\n")
		warning := lipgloss.NewStyle().
			Foreground(lipgloss.Color("9")).
			Bold(true).
			Render("⚠️  LOW STOCK ALERT - Below reorder level!")
		content.WriteString(warning)
		content.WriteString("\n")
	}
	
	return content.String()
}
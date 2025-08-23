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

type StockMovementsList struct {
	table      components.Table
	appCtx     *app.Context
	movements  []models.StockMovement
	errorMsg   string
	successMsg string
}

func NewStockMovementsListWithContext(appCtx *app.Context) StockMovementsList {
	columns := []components.Column{
		{Header: "Date", Width: 16, Flex: false},
		{Header: "Product", Width: 25, Flex: true},
		{Header: "Type", Width: 12, Flex: false},
		{Header: "Quantity", Width: 10, Flex: false},
		{Header: "User", Width: 15, Flex: false},
		{Header: "Notes", Width: 30, Flex: true},
	}
	table := components.NewTable("Stock Movements", columns)
	
	sm := StockMovementsList{
		table:     table,
		appCtx:    appCtx,
		movements: []models.StockMovement{},
	}
	
	return sm
}

func (m StockMovementsList) Init() tea.Cmd {
	return tea.Sequence(
		tea.Cmd(func() tea.Msg { return m.loadStockMovements() }),
	)
}

func (m StockMovementsList) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			return NewInventoryMenuWithContext(m.appCtx), nil
		case "ctrl+c":
			return m, tea.Quit
		case "r":
			return m, tea.Cmd(func() tea.Msg { return m.loadStockMovements() })
		}
		
	case StockMovementsList:
		// Handle movement load result
		return msg, nil
	}
	
	// Update table
	var cmd tea.Cmd
	var model tea.Model
	model, cmd = m.table.Update(msg)
	m.table = model.(components.Table)
	return m, cmd
}

func (m StockMovementsList) View() string {
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
	
	content.WriteString(m.table.View())
	content.WriteString("\n\nPress 'r' to refresh, 'esc' to go back")
	
	return content.String()
}

func (m StockMovementsList) loadStockMovements() StockMovementsList {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m
	}
	
	ctx := context.Background()
	movements, err := m.appCtx.StockMovementRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load stock movements: %v", err)
		return m
	}
	
	m.movements = make([]models.StockMovement, len(movements))
	for i, movement := range movements {
		m.movements[i] = *movement
	}
	
	// Convert movements to table rows
	rows := make([]components.Row, len(movements))
	for i, movement := range movements {
		productName := "Unknown"
		if movement.Product.Name != "" {
			productName = movement.Product.Name
		}
		
		userName := "System"
		if movement.User.Username != "" {
			userName = movement.User.Username
		}
		
		// Format quantity with sign
		quantityStr := fmt.Sprintf("%d", movement.Quantity)
		if movement.MovementType == models.MovementOUT ||
		   movement.MovementType == models.MovementSALE ||
		   movement.MovementType == models.MovementDAMAGE ||
		   (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity < 0) {
			quantityStr = fmt.Sprintf("-%d", abs(movement.Quantity))
		} else if movement.MovementType == models.MovementIN ||
				 movement.MovementType == models.MovementRETURN ||
				 (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity > 0) {
			quantityStr = fmt.Sprintf("+%d", movement.Quantity)
		}
		
		rows[i] = components.Row{
			movement.CreatedAt.Format("2006-01-02 15:04"),
			productName,
			string(movement.MovementType),
			quantityStr,
			userName,
			movement.Notes,
		}
	}
	
	m.table.SetRows(rows)
	return m
}

// Helper function for absolute value
func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}
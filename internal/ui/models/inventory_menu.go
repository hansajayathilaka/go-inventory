package models

import (
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/ui/components"
)

type InventoryMenu struct {
	layout components.Layout
	menu   components.Menu
	appCtx *app.Context
}

func NewInventoryMenu() InventoryMenu {
	return NewInventoryMenuWithContext(nil)
}

func NewInventoryMenuWithContext(appCtx *app.Context) InventoryMenu {
	items := []components.MenuItem{
		{Label: "📈 View Stock Levels", Description: "Current inventory status and quantities", Action: "stock_levels"},
		{Label: "🔄 Stock Movements", Description: "View detailed movement history", Action: "movements"},
		{Label: "⚙️  Adjust Stock", Description: "Update stock quantities manually", Action: "adjust_stock"},
		{Label: "🚚 Transfer Stock", Description: "Move stock between locations", Action: "transfer"},
		{Label: "⚠️  Low Stock Alert", Description: "Items below reorder level", Action: "low_stock"},
		{Label: "🏢 Locations", Description: "Manage storage locations", Action: "locations"},
		{Label: "⬅️  Back to Main Menu", Description: "Return to main menu", Action: "back"},
	}
	
	menu := components.NewMenu("Inventory Management", items)
	menu.ShowHelp = true
	
	layout := components.NewLayout("Inventory Management", menu)
	layout = layout.WithBreadcrumbs([]string{"Home", "Inventory Management"})
	layout = layout.WithHelp("↑/↓: Navigate • Enter: Select • Esc: Back • q: Quit")
	
	return InventoryMenu{
		layout: layout,
		menu:   menu,
		appCtx: appCtx,
	}
}

func (m InventoryMenu) Init() tea.Cmd {
	return tea.Batch(m.layout.Init(), m.menu.Init())
}

func (m InventoryMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			return NewMainMenuWithContext(m.appCtx, nil), nil
		}
	case components.MenuMsg:
		switch msg.Action {
		case "back":
			return NewMainMenuWithContext(m.appCtx, nil), nil
		case "stock_levels":
			return NewStockLevelsListWithContext(m.appCtx), nil
		case "movements":
			return NewStockMovementsListWithContext(m.appCtx), nil
		case "adjust_stock":
			return NewStockAdjustmentFormWithContext(m.appCtx), nil
		case "transfer":
			return NewStockTransferFormWithContext(m.appCtx), nil
		case "low_stock":
			return NewLowStockListWithContext(m.appCtx), nil
		case "locations":
			return NewLocationMenuWithContext(m.appCtx), nil
		}
	}
	
	// Update both layout and menu
	var cmd tea.Cmd
	var layoutModel tea.Model
	layoutModel, cmd = m.layout.Update(msg)
	m.layout = layoutModel.(components.Layout)
	
	// Update the menu within the layout
	var menuModel tea.Model
	menuModel, _ = m.menu.Update(msg)
	m.menu = menuModel.(components.Menu)
	m.layout = m.layout.WithContent(m.menu)
	
	return m, cmd
}

func (m InventoryMenu) View() string {
	return m.layout.View()
}
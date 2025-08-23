package models

import (
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/ui/components"
)

type ProductMenu struct {
	layout components.Layout
	menu   components.Menu
	appCtx *app.Context
}

func NewProductMenu() ProductMenu {
	return NewProductMenuWithContext(nil)
}

func NewProductMenuWithContext(appCtx *app.Context) ProductMenu {
	items := []components.MenuItem{
		{Label: "📋 View Products", Description: "Browse and search all products", Action: "view_products"},
		{Label: "➕ Add Product", Description: "Create new product entry", Action: "add_product"},
		{Label: "🏷️  Manage Categories", Description: "Organize product categories", Action: "categories"},
		{Label: "🏭 Suppliers", Description: "Manage supplier relationships", Action: "suppliers"},
		{Label: "⬅️  Back to Main Menu", Description: "Return to main menu", Action: "back"},
	}
	
	menu := components.NewMenu("Product Management", items)
	menu.ShowHelp = true
	
	layout := components.NewLayout("Product Management", menu)
	layout = layout.WithBreadcrumbs([]string{"Home", "Product Management"})
	layout = layout.WithHelp("↑/↓: Navigate • Enter: Select • Esc: Back • q: Quit")
	
	return ProductMenu{
		layout: layout,
		menu:   menu,
		appCtx: appCtx,
	}
}

func (m ProductMenu) Init() tea.Cmd {
	return tea.Batch(m.layout.Init(), m.menu.Init())
}

func (m ProductMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
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
		case "view_products":
			return NewProductListWithContext(m.appCtx), nil
		case "add_product":
			return NewProductFormWithContext(m.appCtx), nil
		case "categories":
			return NewCategoryMenuWithContext(m.appCtx), nil
		case "suppliers":
			return NewSupplierMenuWithContext(m.appCtx), nil
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

func (m ProductMenu) View() string {
	return m.layout.View()
}
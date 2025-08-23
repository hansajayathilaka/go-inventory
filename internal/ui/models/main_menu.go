package models

import (
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/app"
	"tui-inventory/internal/ui/components"
)

type MainMenu struct {
	layout     components.Layout
	menu       components.Menu
	appCtx     *app.Context
	sessionMgr *app.SessionManager
}

func NewMainMenu() MainMenu {
	return NewMainMenuWithContext(nil, nil)
}

func NewMainMenuWithContext(appCtx *app.Context, sessionMgr *app.SessionManager) MainMenu {
	items := []components.MenuItem{
		{Label: "Product Management", Description: "Manage products, categories and suppliers", Action: "products"},
		{Label: "Inventory Management", Description: "Track stock levels and movements", Action: "inventory"},
		{Label: "User Management", Description: "Manage users, roles and permissions", Action: "users"},
		{Label: "Reports & Analytics", Description: "View detailed reports and insights", Action: "reports"},
		{Label: "System Settings", Description: "Configure system preferences", Action: "settings"},
		{Label: "Exit Application", Description: "Close the inventory system", Action: "exit"},
	}
	
	menu := components.NewMenu("Main Menu", items)
	menu.ShowHelp = true
	
	layout := components.NewLayout("Main Menu", menu)
	layout = layout.WithBreadcrumbs([]string{"Home", "Main Menu"})
	layout = layout.WithHelp("↑/↓: Navigate • Enter: Select • q: Quit • Ctrl+C: Exit")
	
	return MainMenu{
		layout:     layout,
		menu:       menu,
		appCtx:     appCtx,
		sessionMgr: sessionMgr,
	}
}

func (m MainMenu) Init() tea.Cmd {
	return tea.Batch(m.layout.Init(), m.menu.Init())
}

func (m MainMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	case components.MenuMsg:
		switch msg.Action {
		case "exit":
			return m, tea.Quit
		case "products":
			return NewProductMenuWithContext(m.appCtx), nil
		case "inventory":
			return NewInventoryMenuWithContext(m.appCtx), nil
		case "users":
			return NewUserManagementMenuWithContext(m.appCtx), nil
		case "reports":
			return NewReportMenu(), nil
		case "settings":
			return NewSettingsMenu(), nil
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

func (m MainMenu) View() string {
	return m.layout.View()
}
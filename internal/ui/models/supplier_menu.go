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

type SupplierMenuState int

const (
	SupplierMenuView SupplierMenuState = iota
	SupplierListView
	SupplierFormView
)

type SupplierMenu struct {
	state      SupplierMenuState
	menu       components.Menu
	table      components.Table
	form       components.Form
	appCtx     *app.Context
	suppliers  []models.Supplier
	selectedSupplier *models.Supplier
	errorMsg   string
	successMsg string
}

func NewSupplierMenuWithContext(appCtx *app.Context) SupplierMenu {
	items := []components.MenuItem{
		{Label: "List Suppliers", Description: "View all suppliers", Action: "list"},
		{Label: "Add Supplier", Description: "Create new supplier", Action: "add"},
		{Label: "Back", Description: "Return to product menu", Action: "back"},
	}
	
	menu := components.NewMenu("Supplier Management", items)
	
	// Initialize table for supplier list
	columns := []components.Column{
		{Header: "Code", Width: 12, Flex: false},
		{Header: "Name", Width: 25, Flex: true},
		{Header: "Contact", Width: 20, Flex: false},
		{Header: "Phone", Width: 15, Flex: false},
		{Header: "Email", Width: 25, Flex: true},
	}
	table := components.NewTable("Suppliers", columns)
	
	// Initialize form for supplier creation
	fields := []components.Field{
		{Label: "Name", Key: "name", Required: true, Type: components.TextInput},
		{Label: "Code", Key: "code", Required: true, Type: components.TextInput},
		{Label: "Contact Name", Key: "contact_name", Required: false, Type: components.TextInput},
		{Label: "Phone", Key: "phone", Required: false, Type: components.TextInput},
		{Label: "Email", Key: "email", Required: false, Type: components.TextInput},
		{Label: "Address", Key: "address", Required: false, Type: components.TextInput},
	}
	form := components.NewFormWithLayout("Supplier Details", fields, components.CompactLayout)
	
	return SupplierMenu{
		state:     SupplierMenuView,
		menu:      menu,
		table:     table,
		form:      form,
		appCtx:    appCtx,
		suppliers: []models.Supplier{},
	}
}

func (m SupplierMenu) Init() tea.Cmd {
	return nil
}

func (m SupplierMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			switch m.state {
			case SupplierMenuView:
				return NewProductMenuWithContext(m.appCtx), nil
			case SupplierListView, SupplierFormView:
				m.state = SupplierMenuView
				return m, nil
			}
		case "ctrl+c":
			return m, tea.Quit
		}
		
	case components.MenuMsg:
		if m.state == SupplierMenuView {
			switch msg.Action {
			case "back":
				return NewProductMenuWithContext(m.appCtx), nil
			case "list":
				return m.loadSuppliers()
			case "add":
				m.state = SupplierFormView
				return m, nil
			}
		}
		
	case components.TableMsg:
		if m.state == SupplierListView {
			if msg.Action == "select" && msg.Index >= 0 && msg.Index < len(m.suppliers) {
				m.selectedSupplier = &m.suppliers[msg.Index]
				m.errorMsg = fmt.Sprintf("Selected supplier: %s", m.selectedSupplier.Name)
			}
		}
		
	case components.FormMsg:
		if m.state == SupplierFormView && msg.Action == "submit" {
			return m.handleSupplierForm(msg.Values)
		}
	}
	
	// Update active component
	switch m.state {
	case SupplierMenuView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.menu.Update(msg)
		m.menu = model.(components.Menu)
		return m, cmd
		
	case SupplierListView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.table.Update(msg)
		m.table = model.(components.Table)
		return m, cmd
		
	case SupplierFormView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.form.Update(msg)
		m.form = model.(components.Form)
		return m, cmd
	}
	
	return m, nil
}

func (m SupplierMenu) View() string {
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
	case SupplierMenuView:
		content.WriteString(m.menu.View())
		
	case SupplierListView:
		content.WriteString(m.table.View())
		content.WriteString("\n\nPress 'enter' to select supplier, 'esc' to go back")
		
	case SupplierFormView:
		content.WriteString(m.form.View())
		content.WriteString("\n\nPress 'tab' to navigate, 'enter' to submit, 'esc' to cancel")
	}
	
	return content.String()
}

func (m SupplierMenu) loadSuppliers() (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	suppliers, err := m.appCtx.SupplierRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load suppliers: %v", err)
		return m, nil
	}
	
	m.suppliers = make([]models.Supplier, len(suppliers))
	for i, supplier := range suppliers {
		m.suppliers[i] = *supplier
	}
	m.state = SupplierListView
	
	// Convert suppliers to table rows
	rows := make([]components.Row, len(suppliers))
	for i, supplier := range suppliers {
		rows[i] = components.Row{
			supplier.Code,
			supplier.Name,
			supplier.ContactName,
			supplier.Phone,
			supplier.Email,
		}
	}
	
	m.table.SetRows(rows)
	return m, nil
}

func (m SupplierMenu) handleSupplierForm(values map[string]string) (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	
	name := strings.TrimSpace(values["name"])
	code := strings.TrimSpace(values["code"])
	contactName := strings.TrimSpace(values["contact_name"])
	phone := strings.TrimSpace(values["phone"])
	email := strings.TrimSpace(values["email"])
	address := strings.TrimSpace(values["address"])
	
	// Create supplier
	supplier := models.Supplier{
		Name:        name,
		Code:        code,
		ContactName: contactName,
		Phone:       phone,
		Email:       email,
		Address:     address,
	}
	
	// Save to database
	if err := m.appCtx.SupplierRepo.Create(ctx, &supplier); err != nil {
		m.errorMsg = fmt.Sprintf("Failed to create supplier: %v", err)
		return m, nil
	}
	
	m.successMsg = fmt.Sprintf("Supplier '%s' created successfully", name)
	m.state = SupplierMenuView
	return m, nil
}
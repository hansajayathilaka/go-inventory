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

type CategoryMenuState int

const (
	CategoryMenuView CategoryMenuState = iota
	CategoryListView
	CategoryFormView
)

type CategoryMenu struct {
	state      CategoryMenuState
	menu       components.Menu
	table      components.Table
	form       components.Form
	appCtx     *app.Context
	categories []models.Category
	selectedCategory *models.Category
	errorMsg   string
	successMsg string
}

func NewCategoryMenuWithContext(appCtx *app.Context) CategoryMenu {
	items := []components.MenuItem{
		{Label: "List Categories", Description: "View all categories", Action: "list"},
		{Label: "Add Category", Description: "Create new category", Action: "add"},
		{Label: "Back", Description: "Return to product menu", Action: "back"},
	}
	
	menu := components.NewMenu("Category Management", items)
	
	// Initialize table for category list
	columns := []components.Column{
		{Header: "Name", Width: 25, Flex: true},
		{Header: "Description", Width: 35, Flex: true},
		{Header: "Parent", Width: 20, Flex: false},
		{Header: "Level", Width: 8, Flex: false},
	}
	table := components.NewTable("Categories", columns)
	
	// Initialize form for category creation
	fields := []components.Field{
		{Label: "Name", Key: "name", Required: true, Type: components.TextInput},
		{Label: "Description", Key: "description", Required: false, Type: components.TextInput},
		{Label: "Parent Category", Key: "parent", Required: false, Type: components.SelectInput, Options: []string{""}},
	}
	form := components.NewFormWithLayout("Category Details", fields, components.CompactLayout)
	
	return CategoryMenu{
		state:      CategoryMenuView,
		menu:       menu,
		table:      table,
		form:       form,
		appCtx:     appCtx,
		categories: []models.Category{},
	}
}

func (m CategoryMenu) Init() tea.Cmd {
	return nil
}

func (m CategoryMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			switch m.state {
			case CategoryMenuView:
				return NewProductMenuWithContext(m.appCtx), nil
			case CategoryListView, CategoryFormView:
				m.state = CategoryMenuView
				return m, nil
			}
		case "ctrl+c":
			return m, tea.Quit
		}
		
	case components.MenuMsg:
		if m.state == CategoryMenuView {
			switch msg.Action {
			case "back":
				return NewProductMenuWithContext(m.appCtx), nil
			case "list":
				return m.loadCategories()
			case "add":
				return m.showCategoryForm()
			}
		}
		
	case components.TableMsg:
		if m.state == CategoryListView {
			if msg.Action == "select" && msg.Index >= 0 && msg.Index < len(m.categories) {
				m.selectedCategory = &m.categories[msg.Index]
				m.errorMsg = fmt.Sprintf("Selected category: %s", m.selectedCategory.Name)
			}
		}
		
	case components.FormMsg:
		if m.state == CategoryFormView && msg.Action == "submit" {
			return m.handleCategoryForm(msg.Values)
		}
	}
	
	// Update active component
	switch m.state {
	case CategoryMenuView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.menu.Update(msg)
		m.menu = model.(components.Menu)
		return m, cmd
		
	case CategoryListView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.table.Update(msg)
		m.table = model.(components.Table)
		return m, cmd
		
	case CategoryFormView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.form.Update(msg)
		m.form = model.(components.Form)
		return m, cmd
	}
	
	return m, nil
}

func (m CategoryMenu) View() string {
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
	case CategoryMenuView:
		content.WriteString(m.menu.View())
		
	case CategoryListView:
		content.WriteString(m.table.View())
		content.WriteString("\n\nPress 'enter' to select category, 'esc' to go back")
		
	case CategoryFormView:
		content.WriteString(m.form.View())
		content.WriteString("\n\nPress 'tab' to navigate, 'enter' to submit, 'esc' to cancel")
	}
	
	return content.String()
}

func (m CategoryMenu) loadCategories() (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	categories, err := m.appCtx.CategoryRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load categories: %v", err)
		return m, nil
	}
	
	m.categories = make([]models.Category, len(categories))
	for i, category := range categories {
		m.categories[i] = *category
	}
	m.state = CategoryListView
	
	// Convert categories to table rows
	rows := make([]components.Row, len(categories))
	for i, category := range categories {
		parentName := "Root"
		if category.ParentID != nil {
			// Find parent name
			for _, cat := range categories {
				if cat.ID == *category.ParentID {
					parentName = cat.Name
					break
				}
			}
		}
		
		rows[i] = components.Row{
			category.Name,
			category.Description,
			parentName,
			fmt.Sprintf("%d", category.Level),
		}
	}
	
	m.table.SetRows(rows)
	return m, nil
}

func (m CategoryMenu) showCategoryForm() (tea.Model, tea.Cmd) {
	m.state = CategoryFormView
	
	// Load categories for parent selection
	if m.appCtx != nil {
		ctx := context.Background()
		categories, _ := m.appCtx.CategoryRepo.List(ctx, 100, 0)
		
		parentOptions := []string{""}
		for _, cat := range categories {
			parentOptions = append(parentOptions, cat.Name)
		}
		
		// Update form with parent options
		fields := []components.Field{
			{Label: "Name", Key: "name", Required: true, Type: components.TextInput},
			{Label: "Description", Key: "description", Required: false, Type: components.TextInput},
			{Label: "Parent Category", Key: "parent", Required: false, Type: components.SelectInput, Options: parentOptions},
		}
		m.form = components.NewFormWithLayout("Category Details", fields, components.CompactLayout)
	}
	
	return m, nil
}

func (m CategoryMenu) handleCategoryForm(values map[string]string) (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	
	name := strings.TrimSpace(values["name"])
	description := strings.TrimSpace(values["description"])
	parentName := values["parent"]
	
	var parentID *models.Category
	if parentName != "" {
		// Find parent category
		categories, _ := m.appCtx.CategoryRepo.List(ctx, 100, 0)
		for _, cat := range categories {
			if cat.Name == parentName {
				parentID = cat
				break
			}
		}
	}
	
	// Use hierarchy service to create category
	var category *models.Category
	var err error
	if parentID != nil {
		category, err = m.appCtx.HierarchyService.CreateCategory(ctx, name, description, &parentID.ID)
	} else {
		category, err = m.appCtx.HierarchyService.CreateCategory(ctx, name, description, nil)
	}
	
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to create category: %v", err)
		return m, nil
	}
	
	m.successMsg = fmt.Sprintf("Category '%s' created successfully", category.Name)
	m.state = CategoryMenuView
	return m, nil
}
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

type UserManagementState int

const (
	UserMenuView UserManagementState = iota
	UserListView
	UserFormView
	UserDeleteConfirmView
)

type UserManagementMenu struct {
	state      UserManagementState
	menu       components.Menu
	table      components.Table
	form       components.Form
	appCtx     *app.Context
	users      []models.User
	selectedUser *models.User
	currentUser  *models.User
	errorMsg   string
	successMsg string
}

func NewUserManagementMenu() UserManagementMenu {
	return NewUserManagementMenuWithContext(nil)
}

func NewUserManagementMenuWithContext(appCtx *app.Context) UserManagementMenu {
	items := []components.MenuItem{
		{Label: "List Users", Description: "View all users", Action: "list"},
		{Label: "Add User", Description: "Create new user", Action: "add"},
		{Label: "Back", Description: "Return to main menu", Action: "back"},
	}
	
	menu := components.NewMenu("User Management", items)
	
	// Initialize table for user list
	columns := []components.Column{
		{Header: "ID", Width: 12, Flex: false},
		{Header: "Username", Width: 15, Flex: true},
		{Header: "Email", Width: 25, Flex: true},
		{Header: "Role", Width: 10, Flex: false},
		{Header: "Last Login", Width: 16, Flex: false},
	}
	table := components.NewTable("Users", columns)
	
	// Initialize form for user creation/editing
	fields := []components.Field{
		{Label: "Username", Key: "username", Required: true, Type: components.TextInput},
		{Label: "Email", Key: "email", Required: true, Type: components.TextInput},
		{Label: "Password", Key: "password", Required: true, Type: components.PasswordInput},
		{Label: "Role", Key: "role", Required: true, Type: components.SelectInput, Options: []string{"admin", "manager", "staff", "viewer"}},
	}
	form := components.NewFormWithLayout("User Details", fields, components.CompactLayout)
	
	return UserManagementMenu{
		state:   UserMenuView,
		menu:    menu,
		table:   table,
		form:    form,
		appCtx:  appCtx,
		users:   []models.User{},
	}
}

func (m UserManagementMenu) Init() tea.Cmd {
	return nil
}

func (m UserManagementMenu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	m.errorMsg = ""
	m.successMsg = ""
	
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			switch m.state {
			case UserMenuView:
				return NewMainMenu(), nil
			case UserListView, UserFormView, UserDeleteConfirmView:
				m.state = UserMenuView
				return m, nil
			}
		case "ctrl+c":
			return m, tea.Quit
		}
		
	case components.MenuMsg:
		if m.state == UserMenuView {
			switch msg.Action {
			case "back":
				return NewMainMenu(), nil
			case "list":
				return m.loadUsers()
			case "add":
				m.state = UserFormView
				m.selectedUser = nil
				// Recreate form with fresh fields
				fields := []components.Field{
					{Label: "Username", Key: "username", Required: true, Type: components.TextInput},
					{Label: "Email", Key: "email", Required: true, Type: components.TextInput},
					{Label: "Password", Key: "password", Required: true, Type: components.PasswordInput},
					{Label: "Role", Key: "role", Required: true, Type: components.SelectInput, Options: []string{"admin", "manager", "staff", "viewer"}},
				}
				m.form = components.NewFormWithLayout("User Details", fields, components.CompactLayout)
				return m, nil
			}
		}
		
	case components.TableMsg:
		if m.state == UserListView {
			if msg.Action == "select" && msg.Index >= 0 && msg.Index < len(m.users) {
				m.selectedUser = &m.users[msg.Index]
				return m.showUserActions()
			}
		}
		
	case components.FormMsg:
		if m.state == UserFormView && msg.Action == "submit" {
			return m.handleUserForm(msg.Values)
		}
	}
	
	// Update active component
	switch m.state {
	case UserMenuView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.menu.Update(msg)
		m.menu = model.(components.Menu)
		return m, cmd
		
	case UserListView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.table.Update(msg)
		m.table = model.(components.Table)
		return m, cmd
		
	case UserFormView:
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = m.form.Update(msg)
		m.form = model.(components.Form)
		return m, cmd
	}
	
	return m, nil
}

func (m UserManagementMenu) View() string {
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
	case UserMenuView:
		content.WriteString(m.menu.View())
		
	case UserListView:
		content.WriteString(m.table.View())
		content.WriteString("\n\nPress 'enter' to manage user, 'esc' to go back")
		
	case UserFormView:
		content.WriteString(m.form.View())
		content.WriteString("\n\nPress 'tab' to navigate, 'enter' to submit, 'esc' to cancel")
		
	case UserDeleteConfirmView:
		if m.selectedUser != nil {
			content.WriteString(fmt.Sprintf("Are you sure you want to delete user '%s'?\n", m.selectedUser.Username))
			content.WriteString("Press 'y' to confirm, any other key to cancel")
		}
	}
	
	return content.String()
}

func (m UserManagementMenu) loadUsers() (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	users, err := m.appCtx.UserRepo.List(ctx, 100, 0)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to load users: %v", err)
		return m, nil
	}
	
	m.users = make([]models.User, len(users))
	for i, user := range users {
		m.users[i] = *user
	}
	m.state = UserListView
	
	// Convert users to table rows
	rows := make([]components.Row, len(users))
	for i, user := range users {
		lastLogin := "Never"
		if user.LastLogin != nil {
			lastLogin = user.LastLogin.Format("2006-01-02 15:04")
		}
		
		rows[i] = components.Row{
			user.ID.String()[:8] + "...",
			user.Username,
			user.Email,
			string(user.Role),
			lastLogin,
		}
	}
	
	m.table.SetRows(rows)
	return m, nil
}

func (m UserManagementMenu) showUserActions() (tea.Model, tea.Cmd) {
	if m.selectedUser == nil {
		return m, nil
	}
	
	// For now, just show user details
	m.errorMsg = fmt.Sprintf("Selected user: %s (%s)", m.selectedUser.Username, m.selectedUser.Email)
	return m, nil
}

func (m UserManagementMenu) handleUserForm(data map[string]string) (tea.Model, tea.Cmd) {
	if m.appCtx == nil {
		m.errorMsg = "Application context not available"
		return m, nil
	}
	
	ctx := context.Background()
	
	// Get form data
	username := data["username"]
	email := data["email"]
	password := data["password"]
	roleStr := data["role"]
	
	// Convert role string to enum
	var role models.UserRole
	switch roleStr {
	case "admin":
		role = models.RoleAdmin
	case "manager":
		role = models.RoleManager
	case "staff":
		role = models.RoleStaff
	case "viewer":
		role = models.RoleViewer
	default:
		m.errorMsg = "Invalid role selected"
		return m, nil
	}
	
	// Create user
	user, err := m.appCtx.UserService.CreateUser(ctx, username, email, password, role)
	if err != nil {
		m.errorMsg = fmt.Sprintf("Failed to create user: %v", err)
		return m, nil
	}
	
	m.successMsg = fmt.Sprintf("User '%s' created successfully", user.Username)
	m.state = UserMenuView
	return m, nil
}
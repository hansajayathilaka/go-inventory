package models

import (
	"context"
	"fmt"
	"strings"
	"time"

	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

type DashboardState int

const (
	DashboardLoadingState DashboardState = iota
	DashboardReadyState
	DashboardErrorState
)

type Dashboard struct {
	state          DashboardState
	appCtx         *app.Context
	sessionMgr     *app.SessionManager
	currentUser    *models.User
	errorMsg       string
	
	// Dashboard data
	stockAlerts    []StockAlert
	systemHealth   SystemHealth
	quickActions   []QuickAction
	activityFeed   []ActivityItem
	
	// UI components
	selectedSection int
	sections        []string
	lastUpdated     time.Time
	refreshTimer    *time.Timer
	
	// Navigation
	menuItems      []DashboardMenuItem
	selectedMenu   int
}

type StockAlert struct {
	ProductName string
	SKU         string
	CurrentStock int
	ReorderLevel int
	LocationName string
	Severity     AlertSeverity
}

type AlertSeverity int

const (
	AlertCritical AlertSeverity = iota // Zero stock
	AlertWarning                       // Below reorder level
	AlertInfo                          // Low but above reorder level
)

type SystemHealth struct {
	DatabaseStatus   HealthStatus
	InventoryStatus  HealthStatus
	UserActivity     int
	ActiveSessions   int
	LastBackup       time.Time
	SystemUptime     time.Duration
}

type HealthStatus int

const (
	HealthGood HealthStatus = iota
	HealthWarning
	HealthCritical
)

type QuickAction struct {
	Label       string
	Description string
	Action      string
	Icon        string
	Enabled     bool
	RequiredRole models.UserRole
}

type ActivityItem struct {
	Timestamp   time.Time
	UserName    string
	Action      string
	Description string
	Icon        string
}

type DashboardMenuItem struct {
	Label       string
	Description string
	Action      string
	Icon        string
	Enabled     bool
	RequiredRole models.UserRole
}

type DashboardDataMsg struct {
	StockAlerts  []StockAlert
	SystemHealth SystemHealth
	ActivityFeed []ActivityItem
}

type DashboardErrorMsg struct {
	Error string
}

func NewDashboard(appCtx *app.Context, sessionMgr *app.SessionManager, user *models.User) Dashboard {
	sections := []string{"Overview", "Stock Alerts", "System Health", "Quick Actions", "Activity"}
	
	quickActions := []QuickAction{
		{"Add Product", "Create a new product", "add_product", "📦", true, models.RoleStaff},
		{"Stock Adjustment", "Adjust inventory levels", "stock_adjustment", "📊", true, models.RoleStaff},
		{"User Management", "Manage system users", "user_management", "👥", true, models.RoleAdmin},
		{"View Reports", "Generate system reports", "reports", "📈", true, models.RoleViewer},
		{"Backup System", "Create system backup", "backup", "💾", true, models.RoleAdmin},
		{"Settings", "Configure system settings", "settings", "⚙️", true, models.RoleManager},
	}
	
	menuItems := getRoleBasedMenuItems(user.Role)
	
	return Dashboard{
		state:         DashboardLoadingState,
		appCtx:        appCtx,
		sessionMgr:    sessionMgr,
		currentUser:   user,
		sections:      sections,
		quickActions:  quickActions,
		menuItems:     menuItems,
		selectedMenu:  0,
		stockAlerts:   []StockAlert{},
		activityFeed:  []ActivityItem{},
	}
}

func (d Dashboard) Init() tea.Cmd {
	return tea.Batch(
		d.loadDashboardData(),
		d.startPeriodicRefresh(),
	)
}

func (d Dashboard) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return d, tea.Quit
		case "r", "f5":
			// Manual refresh
			d.state = DashboardLoadingState
			return d, d.loadDashboardData()
		case "tab":
			// Switch between sections
			d.selectedSection = (d.selectedSection + 1) % len(d.sections)
			return d, nil
		case "shift+tab":
			// Switch sections backwards
			d.selectedSection = (d.selectedSection - 1 + len(d.sections)) % len(d.sections)
			return d, nil
		case "up", "k":
			if d.selectedMenu > 0 {
				d.selectedMenu--
			}
			return d, nil
		case "down", "j":
			if d.selectedMenu < len(d.menuItems)-1 {
				d.selectedMenu++
			}
			return d, nil
		case "enter", " ":
			return d.handleQuickAction()
		case "1":
			return NewProductFormWithContext(d.appCtx), nil
		case "2":
			return NewStockAdjustmentFormWithContext(d.appCtx), nil
		case "3":
			return NewUserManagementMenuWithContext(d.appCtx), nil
		case "4":
			return NewReportMenu(), nil
		case "m":
			// Return to main menu
			return NewMainMenuWithContext(d.appCtx, d.sessionMgr), nil
		}
	
	case DashboardDataMsg:
		d.stockAlerts = msg.StockAlerts
		d.systemHealth = msg.SystemHealth
		d.activityFeed = msg.ActivityFeed
		d.lastUpdated = time.Now()
		d.state = DashboardReadyState
		return d, nil
		
	case DashboardErrorMsg:
		d.errorMsg = msg.Error
		d.state = DashboardErrorState
		return d, nil
		
	case tea.WindowSizeMsg:
		// Handle window resize
		return d, nil
	}
	
	return d, nil
}

func (d Dashboard) View() string {
	var content strings.Builder
	
	// Header
	content.WriteString(d.renderHeader())
	content.WriteString("\n")
	
	switch d.state {
	case DashboardLoadingState:
		content.WriteString(d.renderLoading())
	case DashboardErrorState:
		content.WriteString(d.renderError())
	case DashboardReadyState:
		content.WriteString(d.renderDashboard())
	}
	
	// Footer
	content.WriteString("\n")
	content.WriteString(d.renderFooter())
	
	return content.String()
}

func (d Dashboard) renderHeader() string {
	var header strings.Builder
	
	// Application title
	title := styles.TitleStyle.
		Foreground(styles.Primary).
		Bold(true).
		Render("📊 TUI Inventory Management Dashboard")
	
	// User info
	userInfo := fmt.Sprintf("Welcome, %s (%s) • Last Updated: %s",
		d.currentUser.Username,
		string(d.currentUser.Role),
		d.lastUpdated.Format("15:04:05"))
	
	userInfoStyled := styles.HelpStyle.Render(userInfo)
	
	// Combine header elements
	header.WriteString(lipgloss.Place(120, 2, lipgloss.Left, lipgloss.Top, title))
	header.WriteString("\n")
	header.WriteString(lipgloss.Place(120, 1, lipgloss.Right, lipgloss.Top, userInfoStyled))
	
	return header.String()
}

func (d Dashboard) renderDashboard() string {
	var content strings.Builder
	
	// Section tabs
	content.WriteString(d.renderSectionTabs())
	content.WriteString("\n\n")
	
	// Main content area with navigation and dashboard content side by side
	leftPanel := d.renderNavigation()
	rightPanel := d.renderSelectedSection()
	
	// Create two-column layout
	leftColumn := lipgloss.NewStyle().
		Width(30).
		Height(25).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.Border).
		Padding(1).
		Render(leftPanel)
		
	rightColumn := lipgloss.NewStyle().
		Width(85).
		Height(25).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.Border).
		Padding(1).
		Render(rightPanel)
	
	dashboardContent := lipgloss.JoinHorizontal(lipgloss.Top, leftColumn, " ", rightColumn)
	content.WriteString(dashboardContent)
	
	return content.String()
}

func (d Dashboard) renderSectionTabs() string {
	var tabs []string
	
	for i, section := range d.sections {
		if i == d.selectedSection {
			tab := styles.ButtonSelectedStyle.Render(fmt.Sprintf(" %s ", section))
			tabs = append(tabs, tab)
		} else {
			tab := styles.ButtonStyle.Render(fmt.Sprintf(" %s ", section))
			tabs = append(tabs, tab)
		}
	}
	
	return lipgloss.JoinHorizontal(lipgloss.Top, tabs...)
}

func (d Dashboard) renderNavigation() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("🧭 Quick Navigation"))
	content.WriteString("\n\n")
	
	for i, item := range d.menuItems {
		if !item.Enabled || !d.hasPermission(item.RequiredRole) {
			continue
		}
		
		var itemStr string
		if i == d.selectedMenu {
			itemStr = styles.MenuItemSelectedStyle.Render(fmt.Sprintf("%s %s", item.Icon, item.Label))
		} else {
			itemStr = styles.MenuItemStyle.Render(fmt.Sprintf("%s %s", item.Icon, item.Label))
		}
		
		content.WriteString(itemStr)
		content.WriteString("\n")
		
		// Show description for selected item
		if i == d.selectedMenu {
			desc := styles.HelpStyle.Render("  " + item.Description)
			content.WriteString(desc)
			content.WriteString("\n")
		}
	}
	
	return content.String()
}

func (d Dashboard) renderSelectedSection() string {
	switch d.sections[d.selectedSection] {
	case "Overview":
		return d.renderOverview()
	case "Stock Alerts":
		return d.renderStockAlerts()
	case "System Health":
		return d.renderSystemHealth()
	case "Quick Actions":
		return d.renderQuickActions()
	case "Activity":
		return d.renderActivity()
	default:
		return "Section not implemented"
	}
}

func (d Dashboard) renderOverview() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("📈 System Overview"))
	content.WriteString("\n\n")
	
	// Key metrics in a grid
	metrics := [][]string{
		{"📦 Total Products", "1,234", "▲ 12 this week"},
		{"📊 Stock Items", "5,678", "▲ 45 this week"},
		{"🏢 Locations", "8", "No change"},
		{"👥 Active Users", fmt.Sprintf("%d", d.systemHealth.ActiveSessions), "▲ 2 online"},
		{"⚠️  Low Stock", fmt.Sprintf("%d", len(d.stockAlerts)), getSeverityIcon(AlertWarning)},
		{"🔴 Zero Stock", fmt.Sprintf("%d", countCriticalAlerts(d.stockAlerts)), getSeverityIcon(AlertCritical)},
	}
	
	var rows []string
	for i := 0; i < len(metrics); i += 2 {
		var row strings.Builder
		
		// First metric
		metric1 := d.renderMetricCard(metrics[i][0], metrics[i][1], metrics[i][2])
		row.WriteString(metric1)
		
		// Second metric (if exists)
		if i+1 < len(metrics) {
			row.WriteString("  ")
			metric2 := d.renderMetricCard(metrics[i+1][0], metrics[i+1][1], metrics[i+1][2])
			row.WriteString(metric2)
		}
		
		rows = append(rows, row.String())
	}
	
	content.WriteString(strings.Join(rows, "\n\n"))
	
	// Recent activity summary
	content.WriteString("\n\n")
	content.WriteString(styles.HeaderStyle.Render("🕒 Recent Activity Summary"))
	content.WriteString("\n")
	
	if len(d.activityFeed) > 0 {
		for i, activity := range d.activityFeed[:min(3, len(d.activityFeed))] {
			timeStr := activity.Timestamp.Format("15:04")
			activityStr := fmt.Sprintf("%s %s - %s (%s)", activity.Icon, timeStr, activity.Description, activity.UserName)
			
			if i < 3 {
				content.WriteString(styles.HelpStyle.Render(activityStr))
				content.WriteString("\n")
			}
		}
	} else {
		content.WriteString(styles.HelpStyle.Render("No recent activity"))
	}
	
	return content.String()
}

func (d Dashboard) renderStockAlerts() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("⚠️  Stock Alerts"))
	content.WriteString("\n\n")
	
	if len(d.stockAlerts) == 0 {
		content.WriteString(styles.SuccessStyle.Render("✅ No stock alerts - all inventory levels are healthy!"))
		return content.String()
	}
	
	// Group alerts by severity
	criticalAlerts := filterAlertsBySeverity(d.stockAlerts, AlertCritical)
	warningAlerts := filterAlertsBySeverity(d.stockAlerts, AlertWarning)
	
	if len(criticalAlerts) > 0 {
		content.WriteString(styles.ErrorStyle.Render("🔴 CRITICAL - Zero Stock"))
		content.WriteString("\n")
		for _, alert := range criticalAlerts {
			alertStr := fmt.Sprintf("  • %s (%s) at %s - Current: %d, Reorder: %d",
				alert.ProductName, alert.SKU, alert.LocationName, alert.CurrentStock, alert.ReorderLevel)
			content.WriteString(styles.ErrorStyle.Render(alertStr))
			content.WriteString("\n")
		}
		content.WriteString("\n")
	}
	
	if len(warningAlerts) > 0 {
		content.WriteString(styles.WarningStyle.Render("🟡 WARNING - Low Stock"))
		content.WriteString("\n")
		for _, alert := range warningAlerts {
			alertStr := fmt.Sprintf("  • %s (%s) at %s - Current: %d, Reorder: %d",
				alert.ProductName, alert.SKU, alert.LocationName, alert.CurrentStock, alert.ReorderLevel)
			content.WriteString(styles.WarningStyle.Render(alertStr))
			content.WriteString("\n")
		}
	}
	
	return content.String()
}

func (d Dashboard) renderSystemHealth() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("💚 System Health"))
	content.WriteString("\n\n")
	
	// Database status
	dbStatus := getHealthStatusText(d.systemHealth.DatabaseStatus)
	dbIcon := getHealthStatusIcon(d.systemHealth.DatabaseStatus)
	content.WriteString(fmt.Sprintf("%s Database: %s\n", dbIcon, dbStatus))
	
	// Inventory status
	invStatus := getHealthStatusText(d.systemHealth.InventoryStatus)
	invIcon := getHealthStatusIcon(d.systemHealth.InventoryStatus)
	content.WriteString(fmt.Sprintf("%s Inventory System: %s\n", invIcon, invStatus))
	
	content.WriteString("\n")
	
	// System metrics
	content.WriteString(fmt.Sprintf("👥 Active Sessions: %d\n", d.systemHealth.ActiveSessions))
	content.WriteString(fmt.Sprintf("📊 User Activity: %d actions today\n", d.systemHealth.UserActivity))
	content.WriteString(fmt.Sprintf("⏰ System Uptime: %s\n", formatDuration(d.systemHealth.SystemUptime)))
	content.WriteString(fmt.Sprintf("💾 Last Backup: %s\n", d.systemHealth.LastBackup.Format("2006-01-02 15:04")))
	
	return content.String()
}

func (d Dashboard) renderQuickActions() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("⚡ Quick Actions"))
	content.WriteString("\n\n")
	
	var actionRows []string
	for i := 0; i < len(d.quickActions); i += 2 {
		var row strings.Builder
		
		// First action
		action1 := d.quickActions[i]
		if d.hasPermission(action1.RequiredRole) && action1.Enabled {
			actionCard := d.renderActionCard(action1, fmt.Sprintf("%d", i+1))
			row.WriteString(actionCard)
		}
		
		// Second action (if exists)
		if i+1 < len(d.quickActions) {
			action2 := d.quickActions[i+1]
			if d.hasPermission(action2.RequiredRole) && action2.Enabled {
				row.WriteString("  ")
				actionCard := d.renderActionCard(action2, fmt.Sprintf("%d", i+2))
				row.WriteString(actionCard)
			}
		}
		
		actionRows = append(actionRows, row.String())
	}
	
	content.WriteString(strings.Join(actionRows, "\n\n"))
	
	return content.String()
}

func (d Dashboard) renderActivity() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("📋 Recent Activity"))
	content.WriteString("\n\n")
	
	if len(d.activityFeed) == 0 {
		content.WriteString(styles.HelpStyle.Render("No recent activity to display"))
		return content.String()
	}
	
	for _, activity := range d.activityFeed {
		timeStr := activity.Timestamp.Format("15:04:05")
		activityStr := fmt.Sprintf("%s %s | %s - %s",
			activity.Icon, timeStr, activity.UserName, activity.Description)
		
		content.WriteString(styles.BaseStyle.Render(activityStr))
		content.WriteString("\n")
	}
	
	return content.String()
}

func (d Dashboard) renderMetricCard(title, value, change string) string {
	card := fmt.Sprintf("%s\n%s\n%s", title, value, change)
	
	return lipgloss.NewStyle().
		Width(38).
		Height(3).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.Border).
		Padding(1).
		Render(card)
}

func (d Dashboard) renderActionCard(action QuickAction, hotkey string) string {
	card := fmt.Sprintf("%s %s\n%s\nPress [%s]", action.Icon, action.Label, action.Description, hotkey)
	
	style := lipgloss.NewStyle().
		Width(38).
		Height(3).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.Border).
		Padding(1)
	
	if action.Enabled && d.hasPermission(action.RequiredRole) {
		style = style.BorderForeground(styles.Primary)
	}
	
	return style.Render(card)
}

func (d Dashboard) renderLoading() string {
	spinner := "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	frame := int(time.Now().UnixNano()/100000000) % len(spinner)
	
	loadingText := fmt.Sprintf("%c Loading dashboard data...", rune(spinner[frame]))
	
	return lipgloss.Place(120, 20, lipgloss.Center, lipgloss.Center,
		styles.InfoStyle.Render(loadingText))
}

func (d Dashboard) renderError() string {
	errorText := fmt.Sprintf("❌ Error loading dashboard: %s\n\nPress [r] to retry", d.errorMsg)
	
	return lipgloss.Place(120, 20, lipgloss.Center, lipgloss.Center,
		styles.ErrorStyle.
			Border(lipgloss.RoundedBorder()).
			Padding(2).
			Render(errorText))
}

func (d Dashboard) renderFooter() string {
	var helpItems []string
	
	if d.state == DashboardReadyState {
		helpItems = []string{
			"↑↓: Navigate",
			"Tab: Switch sections",
			"1-6: Quick actions",
			"R: Refresh",
			"M: Main menu",
			"Q: Quit",
		}
	} else {
		helpItems = []string{"Loading... Please wait"}
	}
	
	help := strings.Join(helpItems, " • ")
	
	return styles.FooterStyle.
		Width(120).
		Align(lipgloss.Center).
		Render(help)
}

func (d Dashboard) loadDashboardData() tea.Cmd {
	if d.appCtx == nil {
		return func() tea.Msg {
			return DashboardErrorMsg{Error: "Application context not available"}
		}
	}
	
	return func() tea.Msg {
		ctx := context.Background()
		
		// Load stock alerts
		stockAlerts := d.loadStockAlerts(ctx)
		
		// Load system health
		systemHealth := d.loadSystemHealth(ctx)
		
		// Load activity feed
		activityFeed := d.loadActivityFeed(ctx)
		
		return DashboardDataMsg{
			StockAlerts:  stockAlerts,
			SystemHealth: systemHealth,
			ActivityFeed: activityFeed,
		}
	}
}

func (d Dashboard) loadStockAlerts(ctx context.Context) []StockAlert {
	var alerts []StockAlert
	
	// Get low stock items from inventory service
	if lowStockItems, err := d.appCtx.InventoryService.GetLowStock(ctx); err == nil {
		for _, item := range lowStockItems {
			alerts = append(alerts, StockAlert{
				ProductName:  item.Product.Name,
				SKU:          item.Product.SKU,
				CurrentStock: item.Quantity,
				ReorderLevel: item.ReorderLevel,
				LocationName: item.Location.Name,
				Severity:     AlertWarning,
			})
		}
	}
	
	// Get zero stock items
	if zeroStockItems, err := d.appCtx.InventoryService.GetZeroStock(ctx); err == nil {
		for _, item := range zeroStockItems {
			alerts = append(alerts, StockAlert{
				ProductName:  item.Product.Name,
				SKU:          item.Product.SKU,
				CurrentStock: item.Quantity,
				ReorderLevel: item.ReorderLevel,
				LocationName: item.Location.Name,
				Severity:     AlertCritical,
			})
		}
	}
	
	return alerts
}

func (d Dashboard) loadSystemHealth(ctx context.Context) SystemHealth {
	health := SystemHealth{
		DatabaseStatus:  HealthGood,
		InventoryStatus: HealthGood,
		UserActivity:    247, // Mock data
		ActiveSessions:  d.sessionMgr.GetActiveSessionCount(),
		LastBackup:      time.Now().Add(-2 * time.Hour),
		SystemUptime:    time.Since(time.Now().Add(-24 * time.Hour)), // Mock 24h uptime
	}
	
	// Check database connectivity
	if d.appCtx.Database != nil && d.appCtx.Database.DB != nil {
		if sqlDB, err := d.appCtx.Database.DB.DB(); err == nil {
			if err := sqlDB.Ping(); err != nil {
				health.DatabaseStatus = HealthCritical
			}
		}
	}
	
	return health
}

func (d Dashboard) loadActivityFeed(ctx context.Context) []ActivityItem {
	// Mock activity feed data
	activities := []ActivityItem{
		{
			Timestamp:   time.Now().Add(-5 * time.Minute),
			UserName:    "admin",
			Action:      "stock_adjustment",
			Description: "Adjusted stock for Product A",
			Icon:        "📊",
		},
		{
			Timestamp:   time.Now().Add(-15 * time.Minute),
			UserName:    "manager",
			Action:      "product_created",
			Description: "Created new product: Widget X",
			Icon:        "📦",
		},
		{
			Timestamp:   time.Now().Add(-30 * time.Minute),
			UserName:    "staff",
			Action:      "user_login",
			Description: "User logged into system",
			Icon:        "🔐",
		},
		{
			Timestamp:   time.Now().Add(-1 * time.Hour),
			UserName:    "admin",
			Action:      "backup_created",
			Description: "System backup completed",
			Icon:        "💾",
		},
	}
	
	return activities
}

func (d Dashboard) startPeriodicRefresh() tea.Cmd {
	return tea.Tick(30*time.Second, func(time.Time) tea.Msg {
		// Trigger data refresh every 30 seconds
		return DashboardDataMsg{}
	})
}

func (d Dashboard) hasPermission(requiredRole models.UserRole) bool {
	userLevel := getRoleLevel(d.currentUser.Role)
	requiredLevel := getRoleLevel(requiredRole)
	
	return userLevel >= requiredLevel
}

func (d Dashboard) handleQuickAction() (tea.Model, tea.Cmd) {
	if d.selectedMenu < len(d.menuItems) {
		action := d.menuItems[d.selectedMenu].Action
		
		switch action {
		case "add_product":
			return NewProductFormWithContext(d.appCtx), nil
		case "stock_adjustment":
			return NewStockAdjustmentFormWithContext(d.appCtx), nil
		case "user_management":
			return NewUserManagementMenuWithContext(d.appCtx), nil
		case "reports":
			return NewReportMenu(), nil
		case "main_menu":
			return NewMainMenuWithContext(d.appCtx, d.sessionMgr), nil
		}
	}
	
	return d, nil
}

// Helper functions

func getRoleBasedMenuItems(role models.UserRole) []DashboardMenuItem {
	allItems := []DashboardMenuItem{
		{"Main Menu", "Return to main navigation", "main_menu", "🏠", true, models.RoleViewer},
		{"Add Product", "Create new product", "add_product", "📦", true, models.RoleStaff},
		{"Stock Adjustment", "Adjust inventory", "stock_adjustment", "📊", true, models.RoleStaff},
		{"User Management", "Manage users", "user_management", "👥", true, models.RoleAdmin},
		{"Reports", "View reports", "reports", "📈", true, models.RoleViewer},
		{"Settings", "System settings", "settings", "⚙️", true, models.RoleManager},
	}
	
	var menuItems []DashboardMenuItem
	userLevel := getRoleLevel(role)
	
	for _, item := range allItems {
		requiredLevel := getRoleLevel(item.RequiredRole)
		if userLevel >= requiredLevel {
			menuItems = append(menuItems, item)
		}
	}
	
	return menuItems
}

func getRoleLevel(role models.UserRole) int {
	switch role {
	case models.RoleViewer:
		return 1
	case models.RoleStaff:
		return 2
	case models.RoleManager:
		return 3
	case models.RoleAdmin:
		return 4
	default:
		return 0
	}
}

func getSeverityIcon(severity AlertSeverity) string {
	switch severity {
	case AlertCritical:
		return "🔴"
	case AlertWarning:
		return "🟡"
	case AlertInfo:
		return "🔵"
	default:
		return "ℹ️"
	}
}

func getHealthStatusText(status HealthStatus) string {
	switch status {
	case HealthGood:
		return "Healthy"
	case HealthWarning:
		return "Warning"
	case HealthCritical:
		return "Critical"
	default:
		return "Unknown"
	}
}

func getHealthStatusIcon(status HealthStatus) string {
	switch status {
	case HealthGood:
		return "✅"
	case HealthWarning:
		return "⚠️"
	case HealthCritical:
		return "❌"
	default:
		return "❓"
	}
}

func filterAlertsBySeverity(alerts []StockAlert, severity AlertSeverity) []StockAlert {
	var filtered []StockAlert
	for _, alert := range alerts {
		if alert.Severity == severity {
			filtered = append(filtered, alert)
		}
	}
	return filtered
}

func countCriticalAlerts(alerts []StockAlert) int {
	count := 0
	for _, alert := range alerts {
		if alert.Severity == AlertCritical {
			count++
		}
	}
	return count
}

func formatDuration(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60
	
	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	} else if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else {
		return fmt.Sprintf("%dm", minutes)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
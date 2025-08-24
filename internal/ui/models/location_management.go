package models

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/v2/key"
	"github.com/charmbracelet/bubbles/v2/paginator"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"

	"tui-inventory/internal/app"
	"tui-inventory/internal/business/inventory"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"
)

// LocationManagementModel represents the location management interface
type LocationManagementModel struct {
	// Core state
	width           int
	height          int
	ready           bool
	loading         bool
	loadingMessage  string
	lastUpdated     time.Time

	// Context and services
	appCtx           *app.Context
	inventoryService inventory.Service

	// Data
	locations        []*models.Location
	filteredLocations []*models.Location
	locationStock    map[string]LocationStockSummary

	// UI state
	mode              string // "list", "bulk", "confirm"
	cursor            int
	selected          map[int]bool
	bulkOperation     string // "activate", "deactivate", "delete"
	confirmOperation  string
	confirmTarget     string

	// Filtering
	typeFilter       string // "all", "warehouse", "store", "online"
	statusFilter     string // "all", "active", "inactive"
	searchQuery      string

	// Pagination
	paginator      paginator.Model
	itemsPerPage   int
	totalItems     int

	// UI controls
	showHelp       bool
	showFilters    bool
	
	// Key bindings
	keyMap LocationManagementKeyMap
}

type LocationStockSummary struct {
	LocationID    uuid.UUID
	TotalProducts int
	TotalStock    int
	LowStockItems int
	ZeroStockItems int
	TotalValue    float64
}

type LocationManagementKeyMap struct {
	Up         key.Binding
	Down       key.Binding
	PageUp     key.Binding
	PageDown   key.Binding
	Enter      key.Binding
	Space      key.Binding
	Back       key.Binding
	Create     key.Binding
	Edit       key.Binding
	Delete     key.Binding
	Toggle     key.Binding
	Bulk       key.Binding
	Filter     key.Binding
	Refresh    key.Binding
	Help       key.Binding
	Quit       key.Binding
}

func DefaultLocationManagementKeys() LocationManagementKeyMap {
	return LocationManagementKeyMap{
		Up:       key.NewBinding(key.WithKeys("k", "up"), key.WithHelp("↑/k", "up")),
		Down:     key.NewBinding(key.WithKeys("j", "down"), key.WithHelp("↓/j", "down")),
		PageUp:   key.NewBinding(key.WithKeys("K", "pgup"), key.WithHelp("K/pgup", "page up")),
		PageDown: key.NewBinding(key.WithKeys("J", "pgdn"), key.WithHelp("J/pgdn", "page down")),
		Enter:    key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "view details")),
		Space:    key.NewBinding(key.WithKeys(" "), key.WithHelp("space", "select")),
		Back:     key.NewBinding(key.WithKeys("esc", "q"), key.WithHelp("esc/q", "back")),
		Create:   key.NewBinding(key.WithKeys("n"), key.WithHelp("n", "new location")),
		Edit:     key.NewBinding(key.WithKeys("e"), key.WithHelp("e", "edit")),
		Delete:   key.NewBinding(key.WithKeys("x"), key.WithHelp("x", "delete")),
		Toggle:   key.NewBinding(key.WithKeys("t"), key.WithHelp("t", "toggle active")),
		Bulk:     key.NewBinding(key.WithKeys("b"), key.WithHelp("b", "bulk operations")),
		Filter:   key.NewBinding(key.WithKeys("f"), key.WithHelp("f", "filters")),
		Refresh:  key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "refresh")),
		Help:     key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "help")),
		Quit:     key.NewBinding(key.WithKeys("ctrl+c"), key.WithHelp("ctrl+c", "quit")),
	}
}

// NewLocationManagementModel creates a new location management model
func NewLocationManagementModel(appCtx *app.Context) LocationManagementModel {
	// Initialize paginator
	p := paginator.New()
	p.Type = paginator.Arabic
	p.PerPage = 15

	return LocationManagementModel{
		appCtx:           appCtx,
		inventoryService: appCtx.InventoryService,
		mode:            "list",
		selected:        make(map[int]bool),
		typeFilter:      "all",
		statusFilter:    "all",
		paginator:       p,
		itemsPerPage:    15,
		keyMap:          DefaultLocationManagementKeys(),
		locationStock:   make(map[string]LocationStockSummary),
		loading:         true,
		loadingMessage:  "Loading locations...",
	}
}

func (m LocationManagementModel) Init() tea.Cmd {
	return tea.Cmd(func() tea.Msg { return m.loadData() })
}

func (m LocationManagementModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	// Handle loading completion
	if loadingMsg, ok := msg.(LocationManagementLoadedMsg); ok {
		m.locations = loadingMsg.locations
		m.locationStock = loadingMsg.stockSummaries
		m.loading = false
		m.applyFilters()
		return m, nil
	}

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true
		m.updatePagination()

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}

		switch m.mode {
		case "list":
			return m.updateList(msg)
		case "bulk":
			return m.updateBulk(msg)
		case "confirm":
			return m.updateConfirm(msg)
		}
	}

	// Update paginator
	m.paginator, _ = m.paginator.Update(msg)

	return m, tea.Batch(cmds...)
}

func (m LocationManagementModel) updateList(msg tea.KeyMsg) (LocationManagementModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Up):
		if m.cursor > 0 {
			m.cursor--
		}

	case key.Matches(msg, m.keyMap.Down):
		if m.cursor < len(m.filteredLocations)-1 {
			m.cursor++
		}

	case key.Matches(msg, m.keyMap.PageUp):
		m.cursor -= m.itemsPerPage
		if m.cursor < 0 {
			m.cursor = 0
		}

	case key.Matches(msg, m.keyMap.PageDown):
		m.cursor += m.itemsPerPage
		if m.cursor >= len(m.filteredLocations) {
			m.cursor = len(m.filteredLocations) - 1
		}

	case key.Matches(msg, m.keyMap.Space):
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			m.selected[m.cursor] = !m.selected[m.cursor]
		}

	case key.Matches(msg, m.keyMap.Enter):
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			// Navigate to location details/inventory view
			// TODO: Implement navigation to location detail view
		}

	case key.Matches(msg, m.keyMap.Create):
		// Navigate to location form for creation
		// TODO: Implement navigation to location form
		
	case key.Matches(msg, m.keyMap.Edit):
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			// Navigate to location form for editing
			// TODO: Implement navigation to location form with location data
		}

	case key.Matches(msg, m.keyMap.Delete):
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			location := m.filteredLocations[m.cursor]
			m.confirmOperation = "delete"
			m.confirmTarget = location.Name
			m.mode = "confirm"
		}

	case key.Matches(msg, m.keyMap.Toggle):
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			location := m.filteredLocations[m.cursor]
			newStatus := "activate"
			if location.IsActive {
				newStatus = "deactivate"
			}
			m.confirmOperation = newStatus
			m.confirmTarget = location.Name
			m.mode = "confirm"
		}

	case key.Matches(msg, m.keyMap.Bulk):
		if m.hasSelectedItems() {
			m.mode = "bulk"
			m.bulkOperation = "activate"
		}

	case key.Matches(msg, m.keyMap.Filter):
		m.showFilters = !m.showFilters

	case key.Matches(msg, m.keyMap.Refresh):
		m.loading = true
		m.loadingMessage = "Refreshing locations..."
		return m, tea.Cmd(func() tea.Msg { return m.loadData() })

	case key.Matches(msg, m.keyMap.Help):
		m.showHelp = !m.showHelp

	case key.Matches(msg, m.keyMap.Back), key.Matches(msg, m.keyMap.Quit):
		return m, tea.Quit
	}

	return m, nil
}

func (m LocationManagementModel) updateBulk(msg tea.KeyMsg) (LocationManagementModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Up):
		operations := []string{"activate", "deactivate", "delete"}
		for i, op := range operations {
			if op == m.bulkOperation {
				m.bulkOperation = operations[(i-1+len(operations))%len(operations)]
				break
			}
		}

	case key.Matches(msg, m.keyMap.Down):
		operations := []string{"activate", "deactivate", "delete"}
		for i, op := range operations {
			if op == m.bulkOperation {
				m.bulkOperation = operations[(i+1)%len(operations)]
				break
			}
		}

	case key.Matches(msg, m.keyMap.Enter):
		selectedCount := m.getSelectedCount()
		m.confirmOperation = fmt.Sprintf("bulk_%s", m.bulkOperation)
		m.confirmTarget = fmt.Sprintf("%d locations", selectedCount)
		m.mode = "confirm"

	case key.Matches(msg, m.keyMap.Back):
		m.mode = "list"
	}

	return m, nil
}

func (m LocationManagementModel) updateConfirm(msg tea.KeyMsg) (LocationManagementModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Enter):
		// Perform the confirmed operation
		m.performOperation()
		m.mode = "list"
		m.confirmOperation = ""
		m.confirmTarget = ""
		
		// Refresh data
		m.loading = true
		m.loadingMessage = "Updating locations..."
		return m, tea.Cmd(func() tea.Msg { return m.loadData() })

	case key.Matches(msg, m.keyMap.Back):
		m.mode = "list"
		m.confirmOperation = ""
		m.confirmTarget = ""
	}

	return m, nil
}

func (m LocationManagementModel) View() string {
	if !m.ready {
		return "Initializing location management..."
	}

	if m.loading {
		return m.loadingView()
	}

	switch m.mode {
	case "list":
		return m.listView()
	case "bulk":
		return m.bulkView()
	case "confirm":
		return m.confirmView()
	default:
		return "Unknown mode"
	}
}

func (m LocationManagementModel) loadingView() string {
	return styles.CardStyle.Render(
		lipgloss.JoinVertical(lipgloss.Left,
			styles.HeaderStyle.Render("Location Management"),
			"",
			styles.InfoStyle.Render("🔄 "+m.loadingMessage),
		),
	)
}

func (m LocationManagementModel) listView() string {
	var content strings.Builder

	// Header
	content.WriteString(styles.HeaderStyle.Render("Location Management"))
	content.WriteString("\n\n")

	// Status line with filters
	statusParts := []string{
		fmt.Sprintf("Showing %d of %d locations", len(m.filteredLocations), len(m.locations)),
	}
	if m.hasActiveFilters() {
		statusParts = append(statusParts, "filtered")
	}
	if m.hasSelectedItems() {
		statusParts = append(statusParts, fmt.Sprintf("%d selected", m.getSelectedCount()))
	}
	content.WriteString(styles.InfoStyle.Render(strings.Join(statusParts, " • ")))
	content.WriteString("\n")

	// Filters (if shown)
	if m.showFilters {
		content.WriteString("\n")
		content.WriteString(m.filtersView())
		content.WriteString("\n")
	}

	// Table header
	content.WriteString("\n")
	headerStyle := styles.TableHeaderStyle
	content.WriteString(headerStyle.Render(fmt.Sprintf("%-4s %-20s %-8s %-12s %-8s %-10s %-12s %-15s",
		"", "Name", "Code", "Type", "Status", "Products", "Stock", "Low Stock")))
	content.WriteString("\n")

	// Location rows
	if len(m.filteredLocations) == 0 {
		content.WriteString(styles.InfoStyle.Render("No locations found"))
	} else {
		start := m.paginator.Page * m.paginator.PerPage
		end := start + m.paginator.PerPage
		if end > len(m.filteredLocations) {
			end = len(m.filteredLocations)
		}

		for i := start; i < end; i++ {
			location := m.filteredLocations[i]
			rowStyle := styles.TableCellStyle

			if i == m.cursor {
				rowStyle = styles.TableSelectedRowStyle
			}

			// Selection indicator
			selectIndicator := "  "
			if m.selected[i] {
				selectIndicator = "✓ "
			}

			// Status indicator
			statusStr := "Active"
			statusStyle := styles.SuccessStyle
			if !location.IsActive {
				statusStr = "Inactive"
				statusStyle = styles.ErrorStyle
			}

			// Get stock summary
			stockSummary := m.locationStock[location.ID.String()]
			
			// Format stock counts
			productsStr := fmt.Sprintf("%d", stockSummary.TotalProducts)
			stockStr := fmt.Sprintf("%d", stockSummary.TotalStock)
			lowStockStr := fmt.Sprintf("%d", stockSummary.LowStockItems)
			
			if stockSummary.LowStockItems > 0 {
				lowStockStr = styles.WarningStyle.Render(lowStockStr)
			}
			if stockSummary.ZeroStockItems > 0 {
				lowStockStr += fmt.Sprintf(" (%d zero)", stockSummary.ZeroStockItems)
			}

			row := fmt.Sprintf("%-4s %-20s %-8s %-12s %-8s %-10s %-12s %-15s",
				selectIndicator,
				truncateString(location.Name, 20),
				location.Code,
				string(location.Type),
				statusStyle.Render(statusStr),
				productsStr,
				stockStr,
				lowStockStr,
			)

			content.WriteString(rowStyle.Render(row))
			content.WriteString("\n")
		}
	}

	// Pagination
	content.WriteString("\n")
	content.WriteString(m.paginator.View())

	// Help text
	if m.showHelp {
		content.WriteString("\n\n")
		content.WriteString(m.helpView())
	} else {
		content.WriteString("\n\n")
		content.WriteString(styles.HelpStyle.Render("Press ? for help • f for filters • b for bulk operations"))
	}

	return styles.CardStyle.Render(content.String())
}

func (m LocationManagementModel) bulkView() string {
	var content strings.Builder

	content.WriteString(styles.HeaderStyle.Render("Bulk Operations"))
	content.WriteString("\n\n")

	selectedCount := m.getSelectedCount()
	content.WriteString(fmt.Sprintf("Selected %d locations\n\n", selectedCount))

	// Operation options
	operations := []string{"activate", "deactivate", "delete"}
	for _, operation := range operations {
		if operation == m.bulkOperation {
			content.WriteString(styles.TableSelectedRowStyle.Render("▶ " + strings.Title(operation)) + "\n")
		} else {
			content.WriteString("  " + strings.Title(operation) + "\n")
		}
	}

	content.WriteString("\n" + styles.HelpStyle.Render("Use ↑/↓ to select operation, Enter to confirm, Esc to cancel"))

	return styles.CardStyle.Render(content.String())
}

func (m LocationManagementModel) confirmView() string {
	var content strings.Builder

	content.WriteString(styles.HeaderStyle.Render("Confirm Operation"))
	content.WriteString("\n\n")

	var message string
	switch m.confirmOperation {
	case "delete":
		message = fmt.Sprintf("Are you sure you want to delete location '%s'?\nThis action cannot be undone.", m.confirmTarget)
	case "activate":
		message = fmt.Sprintf("Activate location '%s'?", m.confirmTarget)
	case "deactivate":
		message = fmt.Sprintf("Deactivate location '%s'?", m.confirmTarget)
	case "bulk_activate":
		message = fmt.Sprintf("Activate %s?", m.confirmTarget)
	case "bulk_deactivate":
		message = fmt.Sprintf("Deactivate %s?", m.confirmTarget)
	case "bulk_delete":
		message = fmt.Sprintf("Delete %s?\nThis action cannot be undone.", m.confirmTarget)
	}

	content.WriteString(message)
	content.WriteString("\n\n")
	content.WriteString(styles.HelpStyle.Render("Press Enter to confirm, Esc to cancel"))

	return styles.CardStyle.Render(content.String())
}

func (m LocationManagementModel) filtersView() string {
	var content strings.Builder

	content.WriteString(styles.TitleStyle.Render("Filters:"))
	content.WriteString(" ")

	// Type filter
	typeText := "All Types"
	if m.typeFilter != "all" {
		typeText = strings.Title(m.typeFilter)
	}
	content.WriteString(fmt.Sprintf("Type: %s", styles.InfoStyle.Render(typeText)))
	content.WriteString("  ")

	// Status filter
	statusText := "All Status"
	if m.statusFilter != "all" {
		statusText = strings.Title(m.statusFilter)
	}
	content.WriteString(fmt.Sprintf("Status: %s", styles.InfoStyle.Render(statusText)))

	return content.String()
}

func (m LocationManagementModel) helpView() string {
	var content strings.Builder

	content.WriteString(styles.TitleStyle.Render("Key Bindings"))
	content.WriteString("\n\n")

	helpItems := [][]string{
		{"↑/k, ↓/j", "Navigate up/down"},
		{"K/pgup, J/pgdn", "Page up/down"},
		{"Space", "Select/deselect location"},
		{"Enter", "View location details"},
		{"n", "Create new location"},
		{"e", "Edit location"},
		{"t", "Toggle active status"},
		{"x", "Delete location"},
		{"b", "Bulk operations"},
		{"f", "Toggle filters"},
		{"r", "Refresh data"},
		{"?", "Toggle help"},
		{"Esc/q", "Go back"},
		{"Ctrl+c", "Quit"},
	}

	for _, item := range helpItems {
		content.WriteString(fmt.Sprintf("%-15s %s\n", styles.InfoStyle.Render(item[0]), item[1]))
	}

	return content.String()
}

// Helper methods

func (m *LocationManagementModel) applyFilters() {
	m.filteredLocations = []*models.Location{}

	for _, location := range m.locations {
		// Type filter
		if m.typeFilter != "all" && string(location.Type) != m.typeFilter {
			continue
		}

		// Status filter
		if m.statusFilter == "active" && !location.IsActive {
			continue
		}
		if m.statusFilter == "inactive" && location.IsActive {
			continue
		}

		// Search filter (if implemented)
		if m.searchQuery != "" {
			query := strings.ToLower(m.searchQuery)
			if !strings.Contains(strings.ToLower(location.Name), query) &&
			   !strings.Contains(strings.ToLower(location.Code), query) &&
			   !strings.Contains(strings.ToLower(location.Description), query) {
				continue
			}
		}

		m.filteredLocations = append(m.filteredLocations, location)
	}

	// Update pagination
	m.updatePagination()

	// Reset cursor if out of bounds
	if m.cursor >= len(m.filteredLocations) {
		m.cursor = len(m.filteredLocations) - 1
	}
	if m.cursor < 0 {
		m.cursor = 0
	}
}

func (m *LocationManagementModel) updatePagination() {
	m.totalItems = len(m.filteredLocations)
	m.paginator.SetTotalPages((m.totalItems + m.itemsPerPage - 1) / m.itemsPerPage)

	// Adjust current page if cursor is outside current page
	currentPage := m.cursor / m.itemsPerPage
	m.paginator.Page = currentPage
}

func (m LocationManagementModel) hasActiveFilters() bool {
	return m.typeFilter != "all" ||
		   m.statusFilter != "all" ||
		   m.searchQuery != ""
}

func (m LocationManagementModel) hasSelectedItems() bool {
	for _, selected := range m.selected {
		if selected {
			return true
		}
	}
	return false
}

func (m LocationManagementModel) getSelectedCount() int {
	count := 0
	for _, selected := range m.selected {
		if selected {
			count++
		}
	}
	return count
}

func (m *LocationManagementModel) performOperation() {
	ctx := context.Background()

	switch m.confirmOperation {
	case "delete":
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			location := m.filteredLocations[m.cursor]
			m.appCtx.LocationRepo.Delete(ctx, location.ID)
		}

	case "activate", "deactivate":
		if len(m.filteredLocations) > 0 && m.cursor < len(m.filteredLocations) {
			location := m.filteredLocations[m.cursor]
			location.IsActive = (m.confirmOperation == "activate")
			m.appCtx.LocationRepo.Update(ctx, location)
		}

	case "bulk_activate", "bulk_deactivate", "bulk_delete":
		isActive := m.confirmOperation == "bulk_activate"
		isDelete := m.confirmOperation == "bulk_delete"

		for i, selected := range m.selected {
			if selected && i < len(m.filteredLocations) {
				location := m.filteredLocations[i]
				if isDelete {
					m.appCtx.LocationRepo.Delete(ctx, location.ID)
				} else {
					location.IsActive = isActive
					m.appCtx.LocationRepo.Update(ctx, location)
				}
			}
		}

		// Clear selections
		m.selected = make(map[int]bool)
	}
}

func (m LocationManagementModel) loadData() LocationManagementLoadedMsg {
	ctx := context.Background()

	// Load locations
	locations, err := m.appCtx.LocationRepo.List(ctx, 1000, 0)
	if err != nil {
		locations = []*models.Location{}
	}

	// Load stock summaries for each location
	stockSummaries := make(map[string]LocationStockSummary)

	for _, location := range locations {
		// Load inventory for this location
		inventory, err := m.appCtx.InventoryRepo.GetByLocation(ctx, location.ID)
		if err != nil {
			continue
		}

		summary := LocationStockSummary{
			LocationID: location.ID,
		}

		for _, inv := range inventory {
			summary.TotalProducts++
			summary.TotalStock += inv.Quantity

			// Check if low stock (assuming reorder level exists)
			if inv.ReorderLevel > 0 && inv.Quantity <= inv.ReorderLevel {
				summary.LowStockItems++
			}

			// Check if zero stock
			if inv.Quantity == 0 {
				summary.ZeroStockItems++
			}

			// Calculate value (if product has cost price)
			if inv.Product.CostPrice > 0 {
				summary.TotalValue += float64(inv.Quantity) * inv.Product.CostPrice
			}
		}

		stockSummaries[location.ID.String()] = summary
	}

	return LocationManagementLoadedMsg{
		locations:       locations,
		stockSummaries: stockSummaries,
	}
}

// Helper functions
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

// Message types
type LocationManagementLoadedMsg struct {
	locations       []*models.Location
	stockSummaries  map[string]LocationStockSummary
}

// Public constructor for backward compatibility
func NewLocationManagementWithContext(appCtx *app.Context) LocationManagementModel {
	return NewLocationManagementModel(appCtx)
}
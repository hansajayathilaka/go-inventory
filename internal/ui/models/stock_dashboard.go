package models

import (
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/key"
	"github.com/charmbracelet/bubbles/paginator"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"

	"tui-inventory/internal/business/inventory"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"
)

type StockDashboardModel struct {
	// Core state
	width           int
	height          int
	ready           bool
	loading         bool
	loadingMessage  string
	lastUpdated     time.Time

	// Services
	inventoryService *inventory.Service

	// Data
	stockItems      []StockItem
	filteredItems   []StockItem
	locations       []models.Location
	categories      []models.Category

	// Filtering and display
	selectedLocation string // "all" or location ID
	selectedCategory string // "all" or category ID  
	stockFilter      string // "all", "low", "zero", "normal", "high"
	searchQuery      string
	viewMode         string // "table", "cards", "summary"

	// UI state
	cursor          int
	selected        map[int]bool
	showFilters     bool
	showExportMenu  bool
	confirmAction   string
	confirmTarget   string

	// Pagination
	paginator paginator.Model

	// Key bindings
	keys StockDashboardKeyMap

	// Messages
	message      string
	messageType  string
	messageTimer time.Time
}

type StockItem struct {
	ProductID    string
	SKU          string
	ProductName  string
	CategoryName string
	LocationName string
	CurrentStock int
	ReorderLevel int
	MaxStock     int
	StockStatus  string // "zero", "critical", "low", "normal", "high"
	LastMovement time.Time
	CostValue    float64
	RetailValue  float64
	NeedsReorder bool
}

type StockDashboardKeyMap struct {
	Up            key.Binding
	Down          key.Binding
	Left          key.Binding
	Right         key.Binding
	PageUp        key.Binding
	PageDown      key.Binding
	Select        key.Binding
	SelectAll     key.Binding
	ClearSelect   key.Binding
	Enter         key.Binding
	Tab           key.Binding
	Back          key.Binding
	Refresh       key.Binding
	Search        key.Binding
	Filter        key.Binding
	Export        key.Binding
	ViewMode      key.Binding
	Adjust        key.Binding
	Transfer      key.Binding
	History       key.Binding
	Help          key.Binding
	Quit          key.Binding
}

func DefaultStockDashboardKeys() StockDashboardKeyMap {
	return StockDashboardKeyMap{
		Up:          key.NewBinding(key.WithKeys("up", "k"), key.WithHelp("↑/k", "move up")),
		Down:        key.NewBinding(key.WithKeys("down", "j"), key.WithHelp("↓/j", "move down")),
		Left:        key.NewBinding(key.WithKeys("left", "h"), key.WithHelp("←/h", "move left")),
		Right:       key.NewBinding(key.WithKeys("right", "l"), key.WithHelp("→/l", "move right")),
		PageUp:      key.NewBinding(key.WithKeys("pgup", "b"), key.WithHelp("pgup/b", "page up")),
		PageDown:    key.NewBinding(key.WithKeys("pgdown", "f"), key.WithHelp("pgdn/f", "page down")),
		Select:      key.NewBinding(key.WithKeys(" "), key.WithHelp("space", "select")),
		SelectAll:   key.NewBinding(key.WithKeys("ctrl+a"), key.WithHelp("ctrl+a", "select all")),
		ClearSelect: key.NewBinding(key.WithKeys("ctrl+d"), key.WithHelp("ctrl+d", "clear selection")),
		Enter:       key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "view details")),
		Tab:         key.NewBinding(key.WithKeys("tab"), key.WithHelp("tab", "toggle view")),
		Back:        key.NewBinding(key.WithKeys("esc"), key.WithHelp("esc", "back")),
		Refresh:     key.NewBinding(key.WithKeys("r", "ctrl+r"), key.WithHelp("r", "refresh")),
		Search:      key.NewBinding(key.WithKeys("/"), key.WithHelp("/", "search")),
		Filter:      key.NewBinding(key.WithKeys("ctrl+f"), key.WithHelp("ctrl+f", "filters")),
		Export:      key.NewBinding(key.WithKeys("ctrl+e"), key.WithHelp("ctrl+e", "export")),
		ViewMode:    key.NewBinding(key.WithKeys("v"), key.WithHelp("v", "view mode")),
		Adjust:      key.NewBinding(key.WithKeys("a"), key.WithHelp("a", "adjust stock")),
		Transfer:    key.NewBinding(key.WithKeys("t"), key.WithHelp("t", "transfer")),
		History:     key.NewBinding(key.WithKeys("h"), key.WithHelp("h", "history")),
		Help:        key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "help")),
		Quit:        key.NewBinding(key.WithKeys("q", "ctrl+c"), key.WithHelp("q", "quit")),
	}
}

func NewStockDashboardModel(inventoryService *inventory.Service) *StockDashboardModel {
	p := paginator.New()
	p.Type = paginator.Dots
	p.PerPage = 20
	p.ActiveDot = lipgloss.NewStyle().Foreground(styles.Primary).Render("•")
	p.InactiveDot = lipgloss.NewStyle().Foreground(styles.Subtle).Render("•")

	return &StockDashboardModel{
		inventoryService: inventoryService,
		selectedLocation: "all",
		selectedCategory: "all",
		stockFilter:      "all",
		viewMode:         "table",
		selected:         make(map[int]bool),
		paginator:        p,
		keys:             DefaultStockDashboardKeys(),
	}
}

func (m *StockDashboardModel) Init() tea.Cmd {
	return tea.Batch(
		m.loadStockData(),
		m.loadLocations(),
		m.loadCategories(),
	)
}

func (m *StockDashboardModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.updatePagination()
		return m, nil

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}

		switch {
		case key.Matches(msg, m.keys.Quit):
			return m, tea.Quit

		case key.Matches(msg, m.keys.Back):
			// Navigate back to dashboard - this would be handled by parent controller
			return m, tea.Quit

		case key.Matches(msg, m.keys.Refresh):
			m.loading = true
			m.loadingMessage = "Refreshing stock data..."
			return m, tea.Batch(
				m.loadStockData(),
				m.loadLocations(),
				m.loadCategories(),
			)

		case key.Matches(msg, m.keys.Up):
			if m.cursor > 0 {
				m.cursor--
				if m.cursor < m.paginator.Page*m.paginator.PerPage {
					m.paginator.PrevPage()
				}
			}

		case key.Matches(msg, m.keys.Down):
			maxItems := len(m.filteredItems) - 1
			if m.cursor < maxItems {
				m.cursor++
				if m.cursor >= (m.paginator.Page+1)*m.paginator.PerPage {
					m.paginator.NextPage()
				}
			}

		case key.Matches(msg, m.keys.PageUp):
			m.paginator.PrevPage()
			m.cursor = m.paginator.Page * m.paginator.PerPage

		case key.Matches(msg, m.keys.PageDown):
			m.paginator.NextPage()
			m.cursor = m.paginator.Page * m.paginator.PerPage

		case key.Matches(msg, m.keys.Select):
			if len(m.filteredItems) > 0 {
				m.selected[m.cursor] = !m.selected[m.cursor]
			}

		case key.Matches(msg, m.keys.SelectAll):
			if len(m.selected) == len(m.filteredItems) {
				m.selected = make(map[int]bool)
			} else {
				for i := range m.filteredItems {
					m.selected[i] = true
				}
			}

		case key.Matches(msg, m.keys.ClearSelect):
			m.selected = make(map[int]bool)

		case key.Matches(msg, m.keys.Enter):
			if len(m.filteredItems) > 0 && m.cursor < len(m.filteredItems) {
				item := m.filteredItems[m.cursor]
				// Navigate to product detail - this would be handled by parent controller
				m.setMessage(fmt.Sprintf("Viewing product: %s", item.ProductName), "info")
				return m, nil
			}

		case key.Matches(msg, m.keys.Tab), key.Matches(msg, m.keys.ViewMode):
			m.toggleViewMode()

		case key.Matches(msg, m.keys.Filter):
			m.showFilters = !m.showFilters

		case key.Matches(msg, m.keys.Export):
			m.showExportMenu = !m.showExportMenu

		case key.Matches(msg, m.keys.Adjust):
			if len(m.filteredItems) > 0 && m.cursor < len(m.filteredItems) {
				item := m.filteredItems[m.cursor]
				// Navigate to stock adjustment - this would be handled by parent controller
				m.setMessage(fmt.Sprintf("Adjusting stock for: %s", item.ProductName), "info")
				return m, nil
			}

		case key.Matches(msg, m.keys.Transfer):
			if len(m.filteredItems) > 0 && m.cursor < len(m.filteredItems) {
				item := m.filteredItems[m.cursor]
				// Navigate to stock transfer - this would be handled by parent controller
				m.setMessage(fmt.Sprintf("Transferring stock for: %s", item.ProductName), "info")
				return m, nil
			}

		case key.Matches(msg, m.keys.History):
			if len(m.filteredItems) > 0 && m.cursor < len(m.filteredItems) {
				item := m.filteredItems[m.cursor]
				// Navigate to stock history - this would be handled by parent controller
				m.setMessage(fmt.Sprintf("Viewing history for: %s", item.ProductName), "info")
				return m, nil
			}

		// Filter shortcuts
		case key.Matches(msg, key.NewBinding(key.WithKeys("1"))):
			m.stockFilter = "zero"
			m.applyFilters()

		case key.Matches(msg, key.NewBinding(key.WithKeys("2"))):
			m.stockFilter = "low"
			m.applyFilters()

		case key.Matches(msg, key.NewBinding(key.WithKeys("3"))):
			m.stockFilter = "normal"
			m.applyFilters()

		case key.Matches(msg, key.NewBinding(key.WithKeys("4"))):
			m.stockFilter = "all"
			m.applyFilters()
		}

	case StockDataLoadedMsg:
		m.stockItems = msg.Items
		m.applyFilters()
		m.loading = false
		m.lastUpdated = time.Now()
		m.setMessage("Stock data loaded successfully", "success")

	case LocationsLoadedMsg:
		m.locations = msg.Locations

	case CategoriesLoadedMsg:
		if msg.Error != nil {
			m.setMessage(fmt.Sprintf("Error loading categories: %s", msg.Error), "error")
		} else {
			// Convert from slice of pointers to slice of values
			m.categories = make([]models.Category, len(msg.Categories))
			for i, cat := range msg.Categories {
				m.categories[i] = *cat
			}
		}

	case StockDataErrorMsg:
		m.loading = false
		m.setMessage(fmt.Sprintf("Error loading stock data: %s", msg.Error), "error")

	case MessageTimeoutMsg:
		if time.Since(m.messageTimer) >= 3*time.Second {
			m.message = ""
			m.messageType = ""
		}
	}

	return m, nil
}

func (m *StockDashboardModel) View() string {
	if !m.ready {
		return styles.InfoStyle.Render("Loading stock dashboard...")
	}

	var content strings.Builder

	// Header with title and stats
	content.WriteString(m.renderHeader())
	content.WriteString("\n\n")

	// Filters (if shown)
	if m.showFilters {
		content.WriteString(m.renderFilters())
		content.WriteString("\n")
	}

	// Export menu (if shown)
	if m.showExportMenu {
		content.WriteString(m.renderExportMenu())
		content.WriteString("\n")
	}

	// Loading indicator
	if m.loading {
		content.WriteString(styles.InfoStyle.Render(fmt.Sprintf("⏳ %s", m.loadingMessage)))
		content.WriteString("\n\n")
	}

	// Main content based on view mode
	switch m.viewMode {
	case "table":
		content.WriteString(m.renderTableView())
	case "cards":
		content.WriteString(m.renderCardView())
	case "summary":
		content.WriteString(m.renderSummaryView())
	}

	// Pagination
	if len(m.filteredItems) > m.paginator.PerPage {
		content.WriteString("\n")
		content.WriteString(m.paginator.View())
	}

	// Status message
	if m.message != "" {
		content.WriteString("\n")
		style := styles.InfoStyle
		if m.messageType == "error" {
			style = styles.ErrorStyle
		} else if m.messageType == "success" {
			style = styles.SuccessStyle
		}
		content.WriteString(style.Render(m.message))
	}

	// Help
	content.WriteString("\n")
	content.WriteString(m.renderHelp())

	return content.String()
}

func (m *StockDashboardModel) renderHeader() string {
	title := styles.TitleStyle.Render("📦 Stock Levels Dashboard")
	
	stats := m.calculateStats()
	statsText := fmt.Sprintf(
		"Total: %d | Zero: %d | Low: %d | Normal: %d | Reorders: %d",
		stats.Total, stats.Zero, stats.Low, stats.Normal, stats.NeedsReorder,
	)
	
	lastUpdated := ""
	if !m.lastUpdated.IsZero() {
		lastUpdated = fmt.Sprintf("Last updated: %s", m.lastUpdated.Format("15:04:05"))
	}

	viewModeText := fmt.Sprintf("View: %s", strings.Title(m.viewMode))
	
	headerInfo := lipgloss.JoinHorizontal(
		lipgloss.Left,
		styles.InfoStyle.Render(statsText),
		lipgloss.NewStyle().Foreground(styles.Subtle).Render("  •  "),
		lipgloss.NewStyle().Foreground(styles.Subtle).Render(lastUpdated),
		lipgloss.NewStyle().Foreground(styles.Subtle).Render("  •  "),
		lipgloss.NewStyle().Foreground(styles.Accent).Render(viewModeText),
	)

	return lipgloss.JoinVertical(lipgloss.Left, title, headerInfo)
}

func (m *StockDashboardModel) renderFilters() string {
	var filters []string

	// Location filter
	locationText := "All Locations"
	if m.selectedLocation != "all" {
		for _, loc := range m.locations {
			if loc.ID.String() == m.selectedLocation {
				locationText = loc.Name
				break
			}
		}
	}
	filters = append(filters, fmt.Sprintf("Location: %s", locationText))

	// Category filter  
	categoryText := "All Categories"
	if m.selectedCategory != "all" {
		for _, cat := range m.categories {
			if cat.ID.String() == m.selectedCategory {
				categoryText = cat.Name
				break
			}
		}
	}
	filters = append(filters, fmt.Sprintf("Category: %s", categoryText))

	// Stock filter
	stockText := map[string]string{
		"all":    "All Items",
		"zero":   "Out of Stock",
		"low":    "Low Stock",
		"normal": "Normal Stock",
		"high":   "High Stock",
	}[m.stockFilter]
	filters = append(filters, fmt.Sprintf("Stock: %s", stockText))

	filterText := strings.Join(filters, "  •  ")
	return lipgloss.NewStyle().Foreground(styles.Subtle).Render("🔍 Filters: " + filterText + " (1-4: Quick filters, Ctrl+F: Toggle)")
}

func (m *StockDashboardModel) renderExportMenu() string {
	menu := "📤 Export Options: [C]SV | [J]SON | [P]DF Report | [E]xcel | Esc to close"
	return styles.InfoStyle.Render(menu)
}

func (m *StockDashboardModel) renderTableView() string {
	if len(m.filteredItems) == 0 {
		return styles.ErrorStyle.Render("No stock items found matching current filters")
	}

	var table strings.Builder
	
	// Header
	headers := []string{"", "SKU", "Product", "Category", "Location", "Stock", "Status", "Value", "Last Movement"}
	headerWidths := []int{3, 12, 25, 15, 12, 8, 10, 12, 15}
	
	table.WriteString(styles.TableHeaderStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows
	start := m.paginator.Page * m.paginator.PerPage
	end := start + m.paginator.PerPage
	if end > len(m.filteredItems) {
		end = len(m.filteredItems)
	}

	for i := start; i < end; i++ {
		item := m.filteredItems[i]
		
		// Selection indicator
		selectIndicator := " "
		if m.selected[i] {
			selectIndicator = "✓"
		}
		
		// Cursor indicator
		if i == m.cursor {
			selectIndicator = "►"
		}

		// Format values
		stockText := fmt.Sprintf("%d", item.CurrentStock)
		if item.ReorderLevel > 0 {
			stockText += fmt.Sprintf("/%d", item.ReorderLevel)
		}

		valueText := fmt.Sprintf("$%.2f", item.RetailValue*float64(item.CurrentStock))
		
		lastMovementText := "Never"
		if !item.LastMovement.IsZero() {
			lastMovementText = item.LastMovement.Format("2006-01-02")
		}

		// Status with color
		statusText := m.formatStockStatus(item.StockStatus)

		row := []string{
			selectIndicator,
			item.SKU,
			item.ProductName,
			item.CategoryName,
			item.LocationName,
			stockText,
			statusText,
			valueText,
			lastMovementText,
		}

		rowStyle := styles.TableCellStyle
		if i == m.cursor {
			rowStyle = styles.TableSelectedRowStyle
		} else if item.StockStatus == "zero" {
			rowStyle = lipgloss.NewStyle().Foreground(styles.Danger)
		} else if item.StockStatus == "low" || item.StockStatus == "critical" {
			rowStyle = lipgloss.NewStyle().Foreground(styles.Warning)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockDashboardModel) renderCardView() string {
	if len(m.filteredItems) == 0 {
		return styles.ErrorStyle.Render("No stock items found matching current filters")
	}

	var cards strings.Builder
	
	start := m.paginator.Page * m.paginator.PerPage
	end := start + m.paginator.PerPage
	if end > len(m.filteredItems) {
		end = len(m.filteredItems)
	}

	cardsPerRow := 3
	if m.width < 120 {
		cardsPerRow = 2
	}
	if m.width < 80 {
		cardsPerRow = 1
	}

	cardWidth := (m.width - (cardsPerRow-1)*2) / cardsPerRow - 2

	for i := start; i < end; i += cardsPerRow {
		var rowCards []string
		
		for j := 0; j < cardsPerRow && i+j < end; j++ {
			item := m.filteredItems[i+j]
			card := m.renderStockCard(item, cardWidth, i+j == m.cursor, m.selected[i+j])
			rowCards = append(rowCards, card)
		}
		
		cards.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, rowCards...))
		if i+cardsPerRow < end {
			cards.WriteString("\n\n")
		}
	}

	return cards.String()
}

func (m *StockDashboardModel) renderStockCard(item StockItem, width int, isCursor, isSelected bool) string {
	cardStyle := styles.CardStyle
	if isCursor {
		cardStyle = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(styles.Primary).Padding(1)
	}
	
	// Card header
	header := item.ProductName
	if len(header) > width-4 {
		header = header[:width-7] + "..."
	}
	
	// Stock status indicator
	statusIndicator := m.getStockStatusIndicator(item.StockStatus)
	
	// Selection indicator
	selectIndicator := ""
	if isSelected {
		selectIndicator = "✓ "
	}

	// Build card content
	content := fmt.Sprintf(
		"%s%s%s\n"+
		"SKU: %s\n"+
		"Category: %s\n"+
		"Location: %s\n"+
		"Stock: %d / %d\n"+
		"Value: $%.2f\n"+
		"Status: %s",
		selectIndicator,
		statusIndicator,
		header,
		item.SKU,
		item.CategoryName,
		item.LocationName,
		item.CurrentStock,
		item.ReorderLevel,
		item.RetailValue*float64(item.CurrentStock),
		item.StockStatus,
	)

	if item.NeedsReorder {
		content += "\n⚠️  Reorder needed"
	}

	return cardStyle.Width(width).Render(content)
}

func (m *StockDashboardModel) renderSummaryView() string {
	stats := m.calculateStats()
	
	// Stock status breakdown
	statusBreakdown := fmt.Sprintf(
		"📊 Stock Status Breakdown:\n\n"+
		"🔴 Out of Stock: %d items\n"+
		"🟠 Critical Stock: %d items\n"+
		"🟡 Low Stock: %d items\n"+
		"🟢 Normal Stock: %d items\n"+
		"🔵 High Stock: %d items\n\n"+
		"💰 Total Inventory Value: $%.2f\n"+
		"⚠️  Items Needing Reorder: %d\n\n"+
		"📈 Most Recent Activity: %s",
		stats.Zero,
		stats.Critical,
		stats.Low,
		stats.Normal,
		stats.High,
		stats.TotalValue,
		stats.NeedsReorder,
		m.getRecentActivitySummary(),
	)

	// Top issues (if any)
	topIssues := m.getTopStockIssues()
	if len(topIssues) > 0 {
		statusBreakdown += "\n\n🚨 Urgent Items:\n"
		for i, issue := range topIssues {
			if i >= 5 {
				break
			}
			statusBreakdown += fmt.Sprintf("• %s (%s) - %d units\n", 
				issue.ProductName, issue.SKU, issue.CurrentStock)
		}
	}

	return lipgloss.NewStyle().Padding(1).Border(lipgloss.RoundedBorder()).BorderForeground(styles.Border).Render(statusBreakdown)
}

func (m *StockDashboardModel) renderHelp() string {
	if m.viewMode == "summary" {
		return styles.HelpStyle.Render(
			"Navigation: ↑/↓ Navigate • Tab/V View mode • R Refresh • Ctrl+F Filters • Ctrl+E Export • Esc Back • ? Help",
		)
	}

	return styles.HelpStyle.Render(
		"Navigation: ↑/↓/PgUp/PgDn Navigate • Space Select • Enter Details • A Adjust • T Transfer • H History\n" +
		"Quick Filters: 1 Zero • 2 Low • 3 Normal • 4 All • View: Tab/V Mode • Other: R Refresh • Esc Back",
	)
}

func (m *StockDashboardModel) formatTableRow(cells []string, widths []int) string {
	var row strings.Builder
	for i, cell := range cells {
		if i < len(widths) {
			width := widths[i]
			if len(cell) > width {
				cell = cell[:width-3] + "..."
			}
			row.WriteString(fmt.Sprintf("%-*s", width, cell))
			if i < len(cells)-1 {
				row.WriteString(" ")
			}
		}
	}
	return row.String()
}

func (m *StockDashboardModel) formatStockStatus(status string) string {
	switch status {
	case "zero":
		return styles.ErrorStyle.Render("OUT")
	case "critical":
		return styles.ErrorStyle.Render("CRIT")
	case "low":
		return styles.WarningStyle.Render("LOW")
	case "normal":
		return styles.SuccessStyle.Render("OK")
	case "high":
		return styles.InfoStyle.Render("HIGH")
	default:
		return status
	}
}

func (m *StockDashboardModel) getStockStatusIndicator(status string) string {
	switch status {
	case "zero":
		return "🔴"
	case "critical":
		return "🟠"
	case "low":
		return "🟡"
	case "normal":
		return "🟢"
	case "high":
		return "🔵"
	default:
		return "⚪"
	}
}

func (m *StockDashboardModel) toggleViewMode() {
	modes := []string{"table", "cards", "summary"}
	currentIndex := 0
	
	for i, mode := range modes {
		if mode == m.viewMode {
			currentIndex = i
			break
		}
	}
	
	nextIndex := (currentIndex + 1) % len(modes)
	m.viewMode = modes[nextIndex]
	
	// Reset cursor for summary view
	if m.viewMode == "summary" {
		m.cursor = 0
	}
	
	m.setMessage(fmt.Sprintf("Switched to %s view", m.viewMode), "info")
}

func (m *StockDashboardModel) applyFilters() {
	m.filteredItems = []StockItem{}
	
	for _, item := range m.stockItems {
		// Location filter
		if m.selectedLocation != "all" && item.LocationName != m.selectedLocation {
			continue
		}
		
		// Category filter
		if m.selectedCategory != "all" && item.CategoryName != m.selectedCategory {
			continue
		}
		
		// Stock filter
		if m.stockFilter != "all" && item.StockStatus != m.stockFilter {
			continue
		}
		
		// Search query
		if m.searchQuery != "" {
			searchLower := strings.ToLower(m.searchQuery)
			if !strings.Contains(strings.ToLower(item.ProductName), searchLower) &&
			   !strings.Contains(strings.ToLower(item.SKU), searchLower) {
				continue
			}
		}
		
		m.filteredItems = append(m.filteredItems, item)
	}
	
	// Reset cursor and selection
	m.cursor = 0
	m.selected = make(map[int]bool)
	
	// Update pagination
	m.updatePagination()
}

func (m *StockDashboardModel) updatePagination() {
	m.paginator.SetTotalPages(len(m.filteredItems))
	if m.paginator.Page >= m.paginator.TotalPages {
		m.paginator.Page = 0
	}
}

func (m *StockDashboardModel) setMessage(text, msgType string) {
	m.message = text
	m.messageType = msgType
	m.messageTimer = time.Now()
}

func (m *StockDashboardModel) calculateStats() StockStats {
	stats := StockStats{}
	
	for _, item := range m.filteredItems {
		stats.Total++
		stats.TotalValue += item.RetailValue * float64(item.CurrentStock)
		
		switch item.StockStatus {
		case "zero":
			stats.Zero++
		case "critical":
			stats.Critical++
		case "low":
			stats.Low++
		case "normal":
			stats.Normal++
		case "high":
			stats.High++
		}
		
		if item.NeedsReorder {
			stats.NeedsReorder++
		}
	}
	
	return stats
}

func (m *StockDashboardModel) getRecentActivitySummary() string {
	if len(m.filteredItems) == 0 {
		return "No recent activity"
	}
	
	// Find most recent movement
	var mostRecent time.Time
	recentCount := 0
	
	for _, item := range m.filteredItems {
		if !item.LastMovement.IsZero() {
			if item.LastMovement.After(mostRecent) {
				mostRecent = item.LastMovement
			}
			if item.LastMovement.After(time.Now().AddDate(0, 0, -7)) {
				recentCount++
			}
		}
	}
	
	if mostRecent.IsZero() {
		return "No recent movements"
	}
	
	return fmt.Sprintf("%d movements in last 7 days, most recent: %s", 
		recentCount, mostRecent.Format("2006-01-02"))
}

func (m *StockDashboardModel) getTopStockIssues() []StockItem {
	var issues []StockItem
	
	for _, item := range m.filteredItems {
		if item.StockStatus == "zero" || item.StockStatus == "critical" || item.NeedsReorder {
			issues = append(issues, item)
		}
	}
	
	// Sort by urgency (zero stock first, then by how far below reorder level)
	// This is a simplified sorting - in practice you might want more sophisticated logic
	
	return issues
}

// Message types
type StockDataLoadedMsg struct {
	Items []StockItem
}

type LocationsLoadedMsg struct {
	Locations []models.Location
}

type StockDataErrorMsg struct {
	Error string
}

type MessageTimeoutMsg struct{}

type StockStats struct {
	Total        int
	Zero         int
	Critical     int
	Low          int
	Normal       int
	High         int
	NeedsReorder int
	TotalValue   float64
}

// Commands
func (m *StockDashboardModel) loadStockData() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real inventory service
		// For now, we'll return sample data
		items := []StockItem{
			{
				ProductID:    "1",
				SKU:          "LAPTOP-001",
				ProductName:  "Gaming Laptop Pro",
				CategoryName: "Electronics",
				LocationName: "Main Warehouse", 
				CurrentStock: 0,
				ReorderLevel: 5,
				MaxStock:     50,
				StockStatus:  "zero",
				LastMovement: time.Now().AddDate(0, 0, -3),
				CostValue:    800.00,
				RetailValue:  1200.00,
				NeedsReorder: true,
			},
			{
				ProductID:    "2",
				SKU:          "MOUSE-001", 
				ProductName:  "Wireless Gaming Mouse",
				CategoryName: "Electronics",
				LocationName: "Main Warehouse",
				CurrentStock: 3,
				ReorderLevel: 10,
				MaxStock:     100,
				StockStatus:  "critical",
				LastMovement: time.Now().AddDate(0, 0, -1),
				CostValue:    25.00,
				RetailValue:  45.00,
				NeedsReorder: true,
			},
			{
				ProductID:    "3",
				SKU:          "DESK-001",
				ProductName:  "Standing Desk Adjustable",
				CategoryName: "Furniture",
				LocationName: "Showroom",
				CurrentStock: 15,
				ReorderLevel: 5,
				MaxStock:     25,
				StockStatus:  "normal",
				LastMovement: time.Now().AddDate(0, 0, -2),
				CostValue:    200.00,
				RetailValue:  350.00,
				NeedsReorder: false,
			},
		}
		
		return StockDataLoadedMsg{Items: items}
	}
}

func (m *StockDashboardModel) loadLocations() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service
		uuid1, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
		uuid2, _ := uuid.Parse("00000000-0000-0000-0000-000000000002")
		uuid3, _ := uuid.Parse("00000000-0000-0000-0000-000000000003")
		locations := []models.Location{
			{ID: uuid1, Name: "Main Warehouse"},
			{ID: uuid2, Name: "Showroom"},
			{ID: uuid3, Name: "Storage Area"},
		}
		
		return LocationsLoadedMsg{Locations: locations}
	}
}

func (m *StockDashboardModel) loadCategories() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service  
		uuid1, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
		uuid2, _ := uuid.Parse("00000000-0000-0000-0000-000000000002")
		uuid3, _ := uuid.Parse("00000000-0000-0000-0000-000000000003")
		categories := []*models.Category{
			{ID: uuid1, Name: "Electronics"},
			{ID: uuid2, Name: "Furniture"},
			{ID: uuid3, Name: "Office Supplies"},
		}
		
		return CategoriesLoadedMsg{Categories: categories, Error: nil}
	}
}
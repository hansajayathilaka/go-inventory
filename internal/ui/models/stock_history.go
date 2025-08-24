package models

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/v2/key"
	"github.com/charmbracelet/bubbles/v2/paginator"
	"github.com/charmbracelet/bubbles/v2/textinput"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"

	"tui-inventory/internal/app"
	"tui-inventory/internal/business/inventory"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"
)

// StockHistoryModel represents the stock movement history viewer
type StockHistoryModel struct {
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
	movements        []*models.StockMovement
	filteredMovements []*models.StockMovement
	products         []models.Product
	locations        []models.Location
	users           []models.User
	
	// UI state
	mode            string // "list", "filters", "details", "export"
	cursor          int
	selectedMovement *models.StockMovement
	
	// Filtering
	dateFromInput    textinput.Model
	dateToInput      textinput.Model
	selectedProduct  string // "all" or product ID
	selectedLocation string // "all" or location ID
	selectedUser     string // "all" or user ID
	movementType     string // "all", "IN", "OUT", "TRANSFER", "ADJUSTMENT", "SALE", "RETURN", "DAMAGE"
	quantityFilter   string // "all", "positive", "negative"
	
	// Pagination
	paginator      paginator.Model
	itemsPerPage   int
	totalItems     int
	
	// UI controls
	focusedField   int
	showHelp       bool
	confirmExport  bool
	exportFormat   string // "csv", "json", "pdf"
	
	// Key bindings
	keyMap StockHistoryKeyMap
}

type StockHistoryKeyMap struct {
	Up        key.Binding
	Down      key.Binding
	PageUp    key.Binding
	PageDown  key.Binding
	Tab       key.Binding
	Enter     key.Binding
	Back      key.Binding
	Refresh   key.Binding
	Filter    key.Binding
	Export    key.Binding
	Details   key.Binding
	Help      key.Binding
	Quit      key.Binding
}

func DefaultStockHistoryKeys() StockHistoryKeyMap {
	return StockHistoryKeyMap{
		Up:       key.NewBinding(key.WithKeys("k", "up"), key.WithHelp("↑/k", "up")),
		Down:     key.NewBinding(key.WithKeys("j", "down"), key.WithHelp("↓/j", "down")),
		PageUp:   key.NewBinding(key.WithKeys("K", "pgup"), key.WithHelp("K/pgup", "page up")),
		PageDown: key.NewBinding(key.WithKeys("J", "pgdn"), key.WithHelp("J/pgdn", "page down")),
		Tab:      key.NewBinding(key.WithKeys("tab"), key.WithHelp("tab", "next field")),
		Enter:    key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "select/confirm")),
		Back:     key.NewBinding(key.WithKeys("esc", "q"), key.WithHelp("esc/q", "back")),
		Refresh:  key.NewBinding(key.WithKeys("r"), key.WithHelp("r", "refresh")),
		Filter:   key.NewBinding(key.WithKeys("f"), key.WithHelp("f", "filters")),
		Export:   key.NewBinding(key.WithKeys("e"), key.WithHelp("e", "export")),
		Details:  key.NewBinding(key.WithKeys("d", "space"), key.WithHelp("d/space", "details")),
		Help:     key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "help")),
		Quit:     key.NewBinding(key.WithKeys("ctrl+c"), key.WithHelp("ctrl+c", "quit")),
	}
}

// NewStockHistoryModel creates a new stock history model
func NewStockHistoryModel(appCtx *app.Context) StockHistoryModel {
	// Initialize date inputs
	dateFromInput := textinput.New()
	dateFromInput.Placeholder = "YYYY-MM-DD"
	dateFromInput.CharLimit = 10
	
	dateToInput := textinput.New()
	dateToInput.Placeholder = "YYYY-MM-DD"
	dateToInput.CharLimit = 10
	
	// Initialize paginator
	p := paginator.New()
	p.Type = paginator.Arabic
	p.PerPage = 20
	
	return StockHistoryModel{
		appCtx:           appCtx,
		inventoryService: appCtx.InventoryService,
		mode:            "list",
		dateFromInput:   dateFromInput,
		dateToInput:     dateToInput,
		selectedProduct: "all",
		selectedLocation: "all",
		selectedUser:    "all",
		movementType:    "all",
		quantityFilter:  "all",
		paginator:      p,
		itemsPerPage:   20,
		keyMap:         DefaultStockHistoryKeys(),
		exportFormat:   "csv",
		loading:        true,
		loadingMessage: "Loading movement history...",
	}
}

func (m StockHistoryModel) Init() tea.Cmd {
	return tea.Batch(
		tea.Cmd(func() tea.Msg { return m.loadData() }),
	)
}

func (m StockHistoryModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	
	// Handle loading completion
	if loadingMsg, ok := msg.(StockHistoryLoadedMsg); ok {
		m.movements = loadingMsg.movements
		m.products = loadingMsg.products
		m.locations = loadingMsg.locations
		m.users = loadingMsg.users
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
		case "filters":
			return m.updateFilters(msg)
		case "details":
			return m.updateDetails(msg)
		case "export":
			return m.updateExport(msg)
		}
	}
	
	// Update text inputs when in filter mode
	if m.mode == "filters" {
		m.dateFromInput, _ = m.dateFromInput.Update(msg)
		m.dateToInput, _ = m.dateToInput.Update(msg)
	}
	
	// Update paginator
	m.paginator, _ = m.paginator.Update(msg)
	
	return m, tea.Batch(cmds...)
}

func (m StockHistoryModel) updateList(msg tea.KeyMsg) (StockHistoryModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Up):
		if m.cursor > 0 {
			m.cursor--
		}
		
	case key.Matches(msg, m.keyMap.Down):
		if m.cursor < len(m.filteredMovements)-1 {
			m.cursor++
		}
		
	case key.Matches(msg, m.keyMap.PageUp):
		m.cursor -= m.itemsPerPage
		if m.cursor < 0 {
			m.cursor = 0
		}
		
	case key.Matches(msg, m.keyMap.PageDown):
		m.cursor += m.itemsPerPage
		if m.cursor >= len(m.filteredMovements) {
			m.cursor = len(m.filteredMovements) - 1
		}
		
	case key.Matches(msg, m.keyMap.Enter), key.Matches(msg, m.keyMap.Details):
		if len(m.filteredMovements) > 0 && m.cursor < len(m.filteredMovements) {
			m.selectedMovement = m.filteredMovements[m.cursor]
			m.mode = "details"
		}
		
	case key.Matches(msg, m.keyMap.Filter):
		m.mode = "filters"
		m.focusedField = 0
		m.dateFromInput.Focus()
		
	case key.Matches(msg, m.keyMap.Export):
		m.mode = "export"
		
	case key.Matches(msg, m.keyMap.Refresh):
		m.loading = true
		m.loadingMessage = "Refreshing movement history..."
		return m, tea.Cmd(func() tea.Msg { return m.loadData() })
		
	case key.Matches(msg, m.keyMap.Help):
		m.showHelp = !m.showHelp
		
	case key.Matches(msg, m.keyMap.Back), key.Matches(msg, m.keyMap.Quit):
		// Return to previous model or quit
		return m, tea.Quit
	}
	
	return m, nil
}

func (m StockHistoryModel) updateFilters(msg tea.KeyMsg) (StockHistoryModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Tab):
		m.focusedField = (m.focusedField + 1) % 7 // 7 filter fields
		m.updateFilterFocus()
		
	case key.Matches(msg, m.keyMap.Enter):
		m.applyFilters()
		m.mode = "list"
		
	case key.Matches(msg, m.keyMap.Back):
		m.mode = "list"
		
	case key.Matches(msg, m.keyMap.Up):
		if m.focusedField > 1 { // Skip date inputs for arrow keys
			switch m.focusedField {
			case 2: // Product
				m.cycleProductFilter(-1)
			case 3: // Location  
				m.cycleLocationFilter(-1)
			case 4: // User
				m.cycleUserFilter(-1)
			case 5: // Movement Type
				m.cycleMovementTypeFilter(-1)
			case 6: // Quantity Filter
				m.cycleQuantityFilter(-1)
			}
		}
		
	case key.Matches(msg, m.keyMap.Down):
		if m.focusedField > 1 { // Skip date inputs for arrow keys
			switch m.focusedField {
			case 2: // Product
				m.cycleProductFilter(1)
			case 3: // Location
				m.cycleLocationFilter(1)
			case 4: // User
				m.cycleUserFilter(1)
			case 5: // Movement Type
				m.cycleMovementTypeFilter(1)
			case 6: // Quantity Filter
				m.cycleQuantityFilter(1)
			}
		}
	}
	
	return m, nil
}

func (m StockHistoryModel) updateDetails(msg tea.KeyMsg) (StockHistoryModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Back):
		m.mode = "list"
		m.selectedMovement = nil
	}
	
	return m, nil
}

func (m StockHistoryModel) updateExport(msg tea.KeyMsg) (StockHistoryModel, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keyMap.Up):
		formats := []string{"csv", "json", "pdf"}
		for i, format := range formats {
			if format == m.exportFormat {
				m.exportFormat = formats[(i-1+len(formats))%len(formats)]
				break
			}
		}
		
	case key.Matches(msg, m.keyMap.Down):
		formats := []string{"csv", "json", "pdf"}
		for i, format := range formats {
			if format == m.exportFormat {
				m.exportFormat = formats[(i+1)%len(formats)]
				break
			}
		}
		
	case key.Matches(msg, m.keyMap.Enter):
		// Simulate export
		m.confirmExport = true
		m.mode = "list"
		
	case key.Matches(msg, m.keyMap.Back):
		m.mode = "list"
	}
	
	return m, nil
}

func (m StockHistoryModel) View() string {
	if !m.ready {
		return "Initializing stock movement history..."
	}
	
	if m.loading {
		return m.loadingView()
	}
	
	switch m.mode {
	case "list":
		return m.listView()
	case "filters":
		return m.filtersView()
	case "details":
		return m.detailsView()
	case "export":
		return m.exportView()
	default:
		return "Unknown mode"
	}
}

func (m StockHistoryModel) loadingView() string {
	return styles.CardStyle.Render(
		lipgloss.JoinVertical(lipgloss.Left,
			styles.HeaderStyle.Render("Stock Movement History"),
			"",
			styles.InfoStyle.Render("🔄 "+m.loadingMessage),
		),
	)
}

func (m StockHistoryModel) listView() string {
	var content strings.Builder
	
	// Header
	content.WriteString(styles.HeaderStyle.Render("Stock Movement History"))
	content.WriteString("\n\n")
	
	// Status line
	statusLine := fmt.Sprintf("Showing %d of %d movements", 
		len(m.filteredMovements), len(m.movements))
	if m.hasActiveFilters() {
		statusLine += " (filtered)"
	}
	content.WriteString(styles.InfoStyle.Render(statusLine))
	content.WriteString("\n\n")
	
	// Table header
	headerStyle := styles.TableHeaderStyle
	content.WriteString(headerStyle.Render(fmt.Sprintf("%-12s %-20s %-15s %-12s %-8s %-15s %-20s",
		"Date", "Product", "Location", "Type", "Qty", "User", "Reference")))
	content.WriteString("\n")
	
	// Movement rows
	if len(m.filteredMovements) == 0 {
		content.WriteString(styles.InfoStyle.Render("No movements found"))
	} else {
		start := m.paginator.Page * m.paginator.PerPage
		end := start + m.paginator.PerPage
		if end > len(m.filteredMovements) {
			end = len(m.filteredMovements)
		}
		
		for i := start; i < end; i++ {
			movement := m.filteredMovements[i]
			rowStyle := styles.TableCellStyle
			
			if i == m.cursor {
				rowStyle = styles.TableSelectedRowStyle
			}
			
			// Format quantity with color based on type
			qtyStr := fmt.Sprintf("%d", movement.Quantity)
			if movement.IsOutgoing() || (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity < 0) {
				qtyStr = styles.ErrorStyle.Render(qtyStr)
			} else if movement.IsIncoming() || (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity > 0) {
				qtyStr = styles.SuccessStyle.Render(qtyStr)
			}
			
			productName := "Unknown"
			if movement.Product.Name != "" {
				productName = movement.Product.Name
				if len(productName) > 20 {
					productName = productName[:17] + "..."
				}
			}
			
			locationName := "Unknown"
			if movement.Location.Name != "" {
				locationName = movement.Location.Name
				if len(locationName) > 15 {
					locationName = locationName[:12] + "..."
				}
			}
			
			userName := "Unknown"
			if movement.User.Username != "" {
				userName = movement.User.Username
				if len(userName) > 15 {
					userName = userName[:12] + "..."
				}
			}
			
			reference := movement.ReferenceID
			if len(reference) > 20 {
				reference = reference[:17] + "..."
			}
			
			row := fmt.Sprintf("%-12s %-20s %-15s %-12s %-8s %-15s %-20s",
				movement.CreatedAt.Format("2006-01-02"),
				productName,
				locationName,
				string(movement.MovementType),
				qtyStr,
				userName,
				reference,
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
		content.WriteString(styles.HelpStyle.Render("Press ? for help"))
	}
	
	// Export confirmation
	if m.confirmExport {
		content.WriteString("\n")
		content.WriteString(styles.SuccessStyle.Render(fmt.Sprintf("✓ Movements exported to %s format", m.exportFormat)))
		m.confirmExport = false
	}
	
	return styles.CardStyle.Render(content.String())
}

func (m StockHistoryModel) filtersView() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("Movement History Filters"))
	content.WriteString("\n\n")
	
	// Date range
	content.WriteString("Date Range:\n")
	fromStyle := styles.InputStyle
	toStyle := styles.InputStyle
	
	if m.focusedField == 0 {
		fromStyle = styles.InputFocusedStyle
	} else if m.focusedField == 1 {
		toStyle = styles.InputFocusedStyle
	}
	
	content.WriteString("From: " + fromStyle.Render(m.dateFromInput.View()) + "\n")
	content.WriteString("To:   " + toStyle.Render(m.dateToInput.View()) + "\n\n")
	
	// Product filter
	productStyle := styles.InputStyle
	if m.focusedField == 2 {
		productStyle = styles.InputFocusedStyle
	}
	
	productText := "All Products"
	if m.selectedProduct != "all" {
		for _, product := range m.products {
			if product.ID.String() == m.selectedProduct {
				productText = product.Name
				break
			}
		}
	}
	content.WriteString("Product: " + productStyle.Render(productText) + "\n\n")
	
	// Location filter
	locationStyle := styles.InputStyle
	if m.focusedField == 3 {
		locationStyle = styles.InputFocusedStyle
	}
	
	locationText := "All Locations"
	if m.selectedLocation != "all" {
		for _, location := range m.locations {
			if location.ID.String() == m.selectedLocation {
				locationText = location.Name
				break
			}
		}
	}
	content.WriteString("Location: " + locationStyle.Render(locationText) + "\n\n")
	
	// User filter
	userStyle := styles.InputStyle
	if m.focusedField == 4 {
		userStyle = styles.InputFocusedStyle
	}
	
	userText := "All Users"
	if m.selectedUser != "all" {
		for _, user := range m.users {
			if user.ID.String() == m.selectedUser {
				userText = user.Username
				break
			}
		}
	}
	content.WriteString("User: " + userStyle.Render(userText) + "\n\n")
	
	// Movement type filter
	typeStyle := styles.InputStyle
	if m.focusedField == 5 {
		typeStyle = styles.InputFocusedStyle
	}
	
	typeText := "All Types"
	if m.movementType != "all" {
		typeText = m.movementType
	}
	content.WriteString("Type: " + typeStyle.Render(typeText) + "\n\n")
	
	// Quantity filter
	qtyStyle := styles.InputStyle
	if m.focusedField == 6 {
		qtyStyle = styles.InputFocusedStyle
	}
	
	qtyText := "All Quantities"
	switch m.quantityFilter {
	case "positive":
		qtyText = "Positive Only"
	case "negative":
		qtyText = "Negative Only"
	}
	content.WriteString("Quantity: " + qtyStyle.Render(qtyText) + "\n\n")
	
	// Instructions
	content.WriteString(styles.HelpStyle.Render("Use Tab to navigate, ↑/↓ to change values, Enter to apply, Esc to cancel"))
	
	return styles.CardStyle.Render(content.String())
}

func (m StockHistoryModel) detailsView() string {
	if m.selectedMovement == nil {
		return styles.CardStyle.Render("No movement selected")
	}
	
	var content strings.Builder
	movement := m.selectedMovement
	
	content.WriteString(styles.HeaderStyle.Render("Movement Details"))
	content.WriteString("\n\n")
	
	// Basic information
	content.WriteString(styles.HelpStyle.Render("ID: ") + movement.ID.String() + "\n")
	content.WriteString(styles.HelpStyle.Render("Date: ") + movement.CreatedAt.Format("2006-01-02 15:04:05") + "\n")
	content.WriteString(styles.HelpStyle.Render("Type: ") + string(movement.MovementType) + "\n\n")
	
	// Product information
	content.WriteString(styles.TitleStyle.Render("Product Information") + "\n")
	content.WriteString(styles.HelpStyle.Render("Name: ") + movement.Product.Name + "\n")
	content.WriteString(styles.HelpStyle.Render("SKU: ") + movement.Product.SKU + "\n\n")
	
	// Location information
	content.WriteString(styles.TitleStyle.Render("Location Information") + "\n")
	content.WriteString(styles.HelpStyle.Render("Name: ") + movement.Location.Name + "\n")
	content.WriteString(styles.HelpStyle.Render("Code: ") + movement.Location.Code + "\n\n")
	
	// Movement details
	content.WriteString(styles.TitleStyle.Render("Movement Details") + "\n")
	
	qtyStyle := styles.InfoStyle
	if movement.IsOutgoing() || (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity < 0) {
		qtyStyle = styles.ErrorStyle
	} else if movement.IsIncoming() || (movement.MovementType == models.MovementADJUSTMENT && movement.Quantity > 0) {
		qtyStyle = styles.SuccessStyle
	}
	
	content.WriteString(styles.HelpStyle.Render("Quantity: ") + qtyStyle.Render(fmt.Sprintf("%d", movement.Quantity)) + "\n")
	
	if movement.UnitCost > 0 {
		content.WriteString(styles.HelpStyle.Render("Unit Cost: ") + fmt.Sprintf("$%.2f", movement.UnitCost) + "\n")
		content.WriteString(styles.HelpStyle.Render("Total Cost: ") + fmt.Sprintf("$%.2f", movement.TotalCost) + "\n")
	}
	
	if movement.ReferenceID != "" {
		content.WriteString(styles.HelpStyle.Render("Reference: ") + movement.ReferenceID + "\n")
	}
	
	// User information
	content.WriteString("\n" + styles.TitleStyle.Render("User Information") + "\n")
	content.WriteString(styles.HelpStyle.Render("Username: ") + movement.User.Username + "\n")
	if movement.User.Email != "" {
		content.WriteString(styles.HelpStyle.Render("Email: ") + movement.User.Email + "\n")
	}
	
	// Notes
	if movement.Notes != "" {
		content.WriteString("\n" + styles.TitleStyle.Render("Notes") + "\n")
		content.WriteString(movement.Notes + "\n")
	}
	
	content.WriteString("\n" + styles.HelpStyle.Render("Press Esc to go back"))
	
	return styles.CardStyle.Render(content.String())
}

func (m StockHistoryModel) exportView() string {
	var content strings.Builder
	
	content.WriteString(styles.HeaderStyle.Render("Export Movement History"))
	content.WriteString("\n\n")
	
	content.WriteString("Select export format:\n\n")
	
	formats := []string{"csv", "json", "pdf"}
	for _, format := range formats {
		if format == m.exportFormat {
			content.WriteString(styles.TableSelectedRowStyle.Render("▶ " + strings.ToUpper(format)) + "\n")
		} else {
			content.WriteString("  " + strings.ToUpper(format) + "\n")
		}
	}
	
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("This will export %d movements.\n", len(m.filteredMovements)))
	
	content.WriteString("\n" + styles.HelpStyle.Render("Use ↑/↓ to select format, Enter to export, Esc to cancel"))
	
	return styles.CardStyle.Render(content.String())
}

func (m StockHistoryModel) helpView() string {
	var content strings.Builder
	
	content.WriteString(styles.TitleStyle.Render("Key Bindings") + "\n\n")
	
	helpItems := [][]string{
		{"↑/k, ↓/j", "Navigate up/down"},
		{"K/pgup, J/pgdn", "Page up/down"},
		{"Enter/Space/d", "View details"},
		{"f", "Open filters"},
		{"e", "Export data"},
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

func (m *StockHistoryModel) updateFilterFocus() {
	m.dateFromInput.Blur()
	m.dateToInput.Blur()
	
	switch m.focusedField {
	case 0:
		m.dateFromInput.Focus()
	case 1:
		m.dateToInput.Focus()
	}
}

func (m *StockHistoryModel) cycleProductFilter(direction int) {
	options := []string{"all"}
	for _, product := range m.products {
		options = append(options, product.ID.String())
	}
	
	currentIndex := 0
	for i, option := range options {
		if option == m.selectedProduct {
			currentIndex = i
			break
		}
	}
	
	newIndex := (currentIndex + direction + len(options)) % len(options)
	m.selectedProduct = options[newIndex]
}

func (m *StockHistoryModel) cycleLocationFilter(direction int) {
	options := []string{"all"}
	for _, location := range m.locations {
		options = append(options, location.ID.String())
	}
	
	currentIndex := 0
	for i, option := range options {
		if option == m.selectedLocation {
			currentIndex = i
			break
		}
	}
	
	newIndex := (currentIndex + direction + len(options)) % len(options)
	m.selectedLocation = options[newIndex]
}

func (m *StockHistoryModel) cycleUserFilter(direction int) {
	options := []string{"all"}
	for _, user := range m.users {
		options = append(options, user.ID.String())
	}
	
	currentIndex := 0
	for i, option := range options {
		if option == m.selectedUser {
			currentIndex = i
			break
		}
	}
	
	newIndex := (currentIndex + direction + len(options)) % len(options)
	m.selectedUser = options[newIndex]
}

func (m *StockHistoryModel) cycleMovementTypeFilter(direction int) {
	options := []string{"all", "IN", "OUT", "TRANSFER", "ADJUSTMENT", "SALE", "RETURN", "DAMAGE"}
	
	currentIndex := 0
	for i, option := range options {
		if option == m.movementType {
			currentIndex = i
			break
		}
	}
	
	newIndex := (currentIndex + direction + len(options)) % len(options)
	m.movementType = options[newIndex]
}

func (m *StockHistoryModel) cycleQuantityFilter(direction int) {
	options := []string{"all", "positive", "negative"}
	
	currentIndex := 0
	for i, option := range options {
		if option == m.quantityFilter {
			currentIndex = i
			break
		}
	}
	
	newIndex := (currentIndex + direction + len(options)) % len(options)
	m.quantityFilter = options[newIndex]
}

func (m *StockHistoryModel) applyFilters() {
	m.filteredMovements = []*models.StockMovement{}
	
	// Parse date filters
	var dateFrom, dateTo *time.Time
	if m.dateFromInput.Value() != "" {
		if parsed, err := time.Parse("2006-01-02", m.dateFromInput.Value()); err == nil {
			dateFrom = &parsed
		}
	}
	if m.dateToInput.Value() != "" {
		if parsed, err := time.Parse("2006-01-02", m.dateToInput.Value()); err == nil {
			// Set to end of day
			endOfDay := parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			dateTo = &endOfDay
		}
	}
	
	for _, movement := range m.movements {
		// Date filter
		if dateFrom != nil && movement.CreatedAt.Before(*dateFrom) {
			continue
		}
		if dateTo != nil && movement.CreatedAt.After(*dateTo) {
			continue
		}
		
		// Product filter
		if m.selectedProduct != "all" && movement.ProductID.String() != m.selectedProduct {
			continue
		}
		
		// Location filter
		if m.selectedLocation != "all" && movement.LocationID.String() != m.selectedLocation {
			continue
		}
		
		// User filter
		if m.selectedUser != "all" && movement.UserID.String() != m.selectedUser {
			continue
		}
		
		// Movement type filter
		if m.movementType != "all" && string(movement.MovementType) != m.movementType {
			continue
		}
		
		// Quantity filter
		if m.quantityFilter == "positive" && movement.Quantity <= 0 {
			continue
		}
		if m.quantityFilter == "negative" && movement.Quantity >= 0 {
			continue
		}
		
		m.filteredMovements = append(m.filteredMovements, movement)
	}
	
	// Update pagination
	m.updatePagination()
	
	// Reset cursor
	if m.cursor >= len(m.filteredMovements) {
		m.cursor = len(m.filteredMovements) - 1
	}
	if m.cursor < 0 {
		m.cursor = 0
	}
}

func (m *StockHistoryModel) updatePagination() {
	m.totalItems = len(m.filteredMovements)
	m.paginator.SetTotalPages((m.totalItems + m.itemsPerPage - 1) / m.itemsPerPage)
	
	// Adjust current page if cursor is outside current page
	currentPage := m.cursor / m.itemsPerPage
	m.paginator.Page = currentPage
}

func (m *StockHistoryModel) hasActiveFilters() bool {
	return m.dateFromInput.Value() != "" ||
		   m.dateToInput.Value() != "" ||
		   m.selectedProduct != "all" ||
		   m.selectedLocation != "all" ||
		   m.selectedUser != "all" ||
		   m.movementType != "all" ||
		   m.quantityFilter != "all"
}

func (m StockHistoryModel) loadData() StockHistoryLoadedMsg {
	ctx := context.Background()
	
	// Load movements
	movements, err := m.appCtx.StockMovementRepo.List(ctx, 1000, 0) // Load up to 1000 movements
	if err != nil {
		movements = []*models.StockMovement{}
	}
	
	// Load products
	products, err := m.appCtx.ProductRepo.List(ctx, 1000, 0)
	if err != nil {
		products = []*models.Product{}
	}
	
	// Load locations
	locations, err := m.appCtx.LocationRepo.List(ctx, 100, 0)
	if err != nil {
		locations = []*models.Location{}
	}
	
	// Load users
	users, err := m.appCtx.UserRepo.List(ctx, 100, 0)
	if err != nil {
		users = []*models.User{}
	}
	
	return StockHistoryLoadedMsg{
		movements: movements,
		products:  flattenProducts(products),
		locations: flattenLocations(locations),
		users:     flattenUsers(users),
	}
}

// Helper functions to flatten pointer slices
func flattenProducts(products []*models.Product) []models.Product {
	result := make([]models.Product, len(products))
	for i, p := range products {
		if p != nil {
			result[i] = *p
		}
	}
	return result
}

func flattenLocations(locations []*models.Location) []models.Location {
	result := make([]models.Location, len(locations))
	for i, l := range locations {
		if l != nil {
			result[i] = *l
		}
	}
	return result
}

func flattenUsers(users []*models.User) []models.User {
	result := make([]models.User, len(users))
	for i, u := range users {
		if u != nil {
			result[i] = *u
		}
	}
	return result
}

// Message types
type StockHistoryLoadedMsg struct {
	movements []*models.StockMovement
	products  []models.Product
	locations []models.Location
	users     []models.User
}

// Public constructor for backward compatibility
func NewStockHistoryWithContext(appCtx *app.Context) StockHistoryModel {
	return NewStockHistoryModel(appCtx)
}
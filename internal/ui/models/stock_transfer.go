package models

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/v2/key"
	"github.com/charmbracelet/bubbles/v2/textinput"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"

	"tui-inventory/internal/business/inventory"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"
)

type StockTransferModel struct {
	// Core state
	width           int
	height          int
	ready           bool
	loading         bool
	loadingMessage  string

	// Services
	inventoryService *inventory.Service

	// Data
	products        []models.Product
	locations       []models.Location
	currentStock    map[string]int // product_id:location_id -> quantity
	transferHistory []TransferRecord

	// Transfer state
	mode                 string // "single", "multi", "confirm", "history"
	focusedField         int
	selectedFromLocation *models.Location
	selectedToLocation   *models.Location
	transferItems        []TransferItem
	currentTransferItem  TransferItem

	// UI state
	productSearch        textinput.Model
	quantityInput        textinput.Model
	notesInput           textinput.Model
	showFromLocationList bool
	showToLocationList   bool
	showProductList      bool
	fromLocationCursor   int
	toLocationCursor     int
	productCursor        int
	filteredProducts     []models.Product
	searchQuery          string
	selectedItemIndex    int

	// Confirmation and preview
	showConfirmation     bool
	confirmationData     ConfirmationData
	confirmTransfer      bool

	// Key bindings
	keys StockTransferKeyMap

	// Messages
	message      string
	messageType  string
	messageTimer time.Time
}

type TransferItem struct {
	Product        models.Product
	FromLocation   models.Location
	ToLocation     models.Location
	Quantity       int
	AvailableStock int
	Notes          string
}

type TransferRecord struct {
	ID          string
	Items       []TransferItem
	TotalItems  int
	CreatedAt   time.Time
	CreatedBy   string
	Status      string // "pending", "completed", "cancelled"
	Notes       string
}

type ConfirmationData struct {
	Items             []TransferItem
	TotalItems        int
	TotalQuantity     int
	AffectedLocations map[string]bool
	Warnings          []string
}

type StockTransferKeyMap struct {
	Up            key.Binding
	Down          key.Binding
	Left          key.Binding
	Right         key.Binding
	Tab           key.Binding
	ShiftTab      key.Binding
	Enter         key.Binding
	Escape        key.Binding
	Search        key.Binding
	Add           key.Binding
	Remove        key.Binding
	Clear         key.Binding
	Confirm       key.Binding
	Execute       key.Binding
	MultiMode     key.Binding
	History       key.Binding
	Help          key.Binding
	Quit          key.Binding
}

func DefaultStockTransferKeys() StockTransferKeyMap {
	return StockTransferKeyMap{
		Up:        key.NewBinding(key.WithKeys("up", "k"), key.WithHelp("↑/k", "move up")),
		Down:      key.NewBinding(key.WithKeys("down", "j"), key.WithHelp("↓/j", "move down")),
		Left:      key.NewBinding(key.WithKeys("left", "h"), key.WithHelp("←/h", "move left")),
		Right:     key.NewBinding(key.WithKeys("right", "l"), key.WithHelp("→/l", "move right")),
		Tab:       key.NewBinding(key.WithKeys("tab"), key.WithHelp("tab", "next field")),
		ShiftTab:  key.NewBinding(key.WithKeys("shift+tab"), key.WithHelp("shift+tab", "prev field")),
		Enter:     key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "select/confirm")),
		Escape:    key.NewBinding(key.WithKeys("esc"), key.WithHelp("esc", "cancel/back")),
		Search:    key.NewBinding(key.WithKeys("/"), key.WithHelp("/", "search products")),
		Add:       key.NewBinding(key.WithKeys("ctrl+a"), key.WithHelp("ctrl+a", "add to transfer")),
		Remove:    key.NewBinding(key.WithKeys("ctrl+d"), key.WithHelp("ctrl+d", "remove item")),
		Clear:     key.NewBinding(key.WithKeys("ctrl+x"), key.WithHelp("ctrl+x", "clear all")),
		Confirm:   key.NewBinding(key.WithKeys("ctrl+c"), key.WithHelp("ctrl+c", "confirm transfer")),
		Execute:   key.NewBinding(key.WithKeys("ctrl+e"), key.WithHelp("ctrl+e", "execute transfer")),
		MultiMode: key.NewBinding(key.WithKeys("m"), key.WithHelp("m", "toggle multi mode")),
		History:   key.NewBinding(key.WithKeys("h"), key.WithHelp("h", "view history")),
		Help:      key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "help")),
		Quit:      key.NewBinding(key.WithKeys("q"), key.WithHelp("q", "quit")),
	}
}

func NewStockTransferModel(inventoryService *inventory.Service) *StockTransferModel {
	// Initialize text inputs
	productSearch := textinput.New()
	productSearch.Placeholder = "Search products by name or SKU..."
	productSearch.Focus()

	quantityInput := textinput.New()
	quantityInput.Placeholder = "Enter quantity to transfer..."

	notesInput := textinput.New()
	notesInput.Placeholder = "Transfer notes (optional)..."

	return &StockTransferModel{
		inventoryService: inventoryService,
		mode:            "single",
		productSearch:   productSearch,
		quantityInput:   quantityInput,
		notesInput:      notesInput,
		currentStock:    make(map[string]int),
		keys:            DefaultStockTransferKeys(),
	}
}

func (m *StockTransferModel) Init() tea.Cmd {
	return tea.Batch(
		m.loadProducts(),
		m.loadLocations(),
		m.loadCurrentStock(),
		m.loadTransferHistory(),
	)
}

func (m *StockTransferModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}

		// Handle different modes
		switch m.mode {
		case "confirm":
			return m.handleConfirmationKeys(msg)
		case "history":
			return m.handleHistoryKeys(msg)
		default:
			return m.handleTransferKeys(msg)
		}

	case ProductsLoadedMsg:
		if msg.Error != nil {
			m.setMessage(fmt.Sprintf("Error loading products: %s", msg.Error), "error")
		} else {
			m.products = msg.Products
			m.filterProducts()
			m.ready = true
		}
		m.loading = false

	case LocationsLoadedMsg:
		m.locations = msg.Locations

	case CurrentStockLoadedMsg:
		m.currentStock = msg.StockLevels

	case TransferHistoryLoadedMsg:
		m.transferHistory = msg.History

	case StockTransferCompletedMsg:
		m.loading = false
		m.setMessage(fmt.Sprintf("Transfer completed successfully: %s", msg.TransferID), "success")
		m.clearTransfer()
		// Reload current stock to reflect changes
		return m, m.loadCurrentStock()

	case StockTransferErrorMsg:
		m.loading = false
		m.setMessage(fmt.Sprintf("Transfer error: %s", msg.Error), "error")

	case MessageTimeoutMsg:
		if time.Since(m.messageTimer) >= 3*time.Second {
			m.message = ""
			m.messageType = ""
		}
	}

	// Update text inputs
	var cmd tea.Cmd
	m.productSearch, cmd = m.productSearch.Update(msg)
	cmds = append(cmds, cmd)

	m.quantityInput, cmd = m.quantityInput.Update(msg)
	cmds = append(cmds, cmd)

	m.notesInput, cmd = m.notesInput.Update(msg)
	cmds = append(cmds, cmd)

	// Filter products when search query changes
	if m.productSearch.Value() != m.searchQuery {
		m.searchQuery = m.productSearch.Value()
		m.filterProducts()
		m.productCursor = 0
	}

	return m, tea.Batch(cmds...)
}

func (m *StockTransferModel) handleTransferKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.keys.Escape):
		if m.showFromLocationList {
			m.showFromLocationList = false
		} else if m.showToLocationList {
			m.showToLocationList = false
		} else if m.showProductList {
			m.showProductList = false
		} else {
			// Navigate back to stock dashboard
			return m, tea.Quit
		}

	case key.Matches(msg, m.keys.Tab):
		m.nextField()

	case key.Matches(msg, m.keys.ShiftTab):
		m.previousField()

	case key.Matches(msg, m.keys.Enter):
		return m.handleEnter()

	case key.Matches(msg, m.keys.Up):
		if m.showFromLocationList {
			if m.fromLocationCursor > 0 {
				m.fromLocationCursor--
			}
		} else if m.showToLocationList {
			if m.toLocationCursor > 0 {
				m.toLocationCursor--
			}
		} else if m.showProductList {
			if m.productCursor > 0 {
				m.productCursor--
			}
		} else if m.mode == "multi" && len(m.transferItems) > 0 {
			if m.selectedItemIndex > 0 {
				m.selectedItemIndex--
			}
		}

	case key.Matches(msg, m.keys.Down):
		if m.showFromLocationList {
			if m.fromLocationCursor < len(m.locations)-1 {
				m.fromLocationCursor++
			}
		} else if m.showToLocationList {
			if m.toLocationCursor < len(m.locations)-1 {
				m.toLocationCursor++
			}
		} else if m.showProductList {
			if m.productCursor < len(m.filteredProducts)-1 {
				m.productCursor++
			}
		} else if m.mode == "multi" && len(m.transferItems) > 0 {
			if m.selectedItemIndex < len(m.transferItems)-1 {
				m.selectedItemIndex++
			}
		}

	case key.Matches(msg, m.keys.Search):
		m.focusedField = 2 // Product search field
		m.showProductList = true
		m.productSearch.Focus()

	case key.Matches(msg, m.keys.Add):
		if m.isCurrentItemValid() {
			m.addToTransfer()
			m.setMessage("Added to transfer list", "info")
		} else {
			m.setMessage("Please complete current transfer item", "error")
		}

	case key.Matches(msg, m.keys.Remove):
		if m.mode == "multi" && len(m.transferItems) > 0 {
			m.removeFromTransfer(m.selectedItemIndex)
			m.setMessage("Removed from transfer list", "info")
		}

	case key.Matches(msg, m.keys.Clear):
		m.clearTransfer()
		m.setMessage("Transfer cleared", "info")

	case key.Matches(msg, m.keys.Confirm):
		if m.hasValidTransfers() {
			m.generateConfirmation()
			m.mode = "confirm"
		} else {
			m.setMessage("Please add items to transfer", "error")
		}

	case key.Matches(msg, m.keys.MultiMode):
		m.toggleMultiMode()

	case key.Matches(msg, m.keys.History):
		m.mode = "history"
	}

	return m, nil
}

func (m *StockTransferModel) handleConfirmationKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.keys.Escape):
		m.mode = "single"
		m.showConfirmation = false

	case key.Matches(msg, m.keys.Execute):
		if m.confirmTransfer {
			return m.executeTransfer()
		} else {
			m.confirmTransfer = true
			m.setMessage("Press Execute again to confirm", "warning")
		}

	case key.Matches(msg, m.keys.Enter):
		return m.executeTransfer()
	}

	return m, nil
}

func (m *StockTransferModel) handleHistoryKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.keys.Escape):
		m.mode = "single"
	}

	return m, nil
}

func (m *StockTransferModel) handleEnter() (tea.Model, tea.Cmd) {
	if m.showFromLocationList && len(m.locations) > 0 {
		m.selectedFromLocation = &m.locations[m.fromLocationCursor]
		m.showFromLocationList = false
		m.focusedField = 1 // Move to destination field
		m.setMessage(fmt.Sprintf("From location: %s", m.selectedFromLocation.Name), "info")

	} else if m.showToLocationList && len(m.locations) > 0 {
		m.selectedToLocation = &m.locations[m.toLocationCursor]
		m.showToLocationList = false
		m.focusedField = 2 // Move to product field
		m.setMessage(fmt.Sprintf("To location: %s", m.selectedToLocation.Name), "info")

	} else if m.showProductList && len(m.filteredProducts) > 0 {
		product := &m.filteredProducts[m.productCursor]
		m.currentTransferItem.Product = *product
		
		// Load available stock for this product at from location
		if m.selectedFromLocation != nil {
			key := fmt.Sprintf("%s:%s", product.ID, m.selectedFromLocation.ID)
			m.currentTransferItem.AvailableStock = m.currentStock[key]
		}
		
		m.showProductList = false
		m.focusedField = 3 // Move to quantity field
		m.setMessage(fmt.Sprintf("Selected product: %s (Available: %d)", 
			product.Name, m.currentTransferItem.AvailableStock), "info")

	} else {
		// Handle field-specific enter actions
		switch m.focusedField {
		case 0: // From location
			m.showFromLocationList = !m.showFromLocationList
		case 1: // To location
			m.showToLocationList = !m.showToLocationList
		case 2: // Product search
			m.showProductList = !m.showProductList
		case 3: // Quantity input
			if qty, err := strconv.Atoi(m.quantityInput.Value()); err == nil && qty > 0 {
				m.currentTransferItem.Quantity = qty
				m.focusedField = 4 // Move to notes field
			} else {
				m.setMessage("Please enter a valid quantity", "error")
			}
		case 4: // Notes
			m.currentTransferItem.Notes = m.notesInput.Value()
			if m.isCurrentItemValid() {
				if m.mode == "single" {
					m.addToTransfer()
					m.generateConfirmation()
					m.mode = "confirm"
				} else {
					m.addToTransfer()
				}
			}
		}
	}

	return m, nil
}

func (m *StockTransferModel) View() string {
	if !m.ready {
		return styles.InfoStyle.Render("Loading stock transfer interface...")
	}

	var content strings.Builder

	// Header
	content.WriteString(m.renderHeader())
	content.WriteString("\n\n")

	// Main content based on mode
	switch m.mode {
	case "confirm":
		content.WriteString(m.renderConfirmation())
	case "history":
		content.WriteString(m.renderHistory())
	case "multi":
		content.WriteString(m.renderMultiMode())
	default:
		content.WriteString(m.renderSingleMode())
	}

	// Status message
	if m.message != "" {
		content.WriteString("\n")
		style := styles.InfoStyle
		if m.messageType == "error" {
			style = styles.ErrorStyle
		} else if m.messageType == "success" {
			style = styles.SuccessStyle
		} else if m.messageType == "warning" {
			style = styles.WarningStyle
		}
		content.WriteString(style.Render(m.message))
	}

	// Help
	content.WriteString("\n")
	content.WriteString(m.renderHelp())

	return content.String()
}

func (m *StockTransferModel) renderHeader() string {
	title := styles.TitleStyle.Render("🔄 Stock Transfer")
	
	modeText := strings.Title(m.mode) + " Mode"
	if len(m.transferItems) > 0 {
		modeText += fmt.Sprintf(" (%d items)", len(m.transferItems))
	}
	
	subtitleStyle := lipgloss.NewStyle().Foreground(styles.Subtle)
	headerInfo := lipgloss.JoinHorizontal(
		lipgloss.Left,
		styles.InfoStyle.Render(modeText),
		subtitleStyle.Render("  •  "),
		lipgloss.NewStyle().Foreground(styles.Accent).Render("Inventory Management"),
	)

	return lipgloss.JoinVertical(lipgloss.Left, title, headerInfo)
}

func (m *StockTransferModel) renderSingleMode() string {
	var form strings.Builder

	// From location selection
	form.WriteString(m.renderFromLocationField())
	form.WriteString("\n")

	// To location selection
	form.WriteString(m.renderToLocationField())
	form.WriteString("\n")

	// Product selection
	if m.selectedFromLocation != nil && m.selectedToLocation != nil {
		form.WriteString(m.renderProductField())
		form.WriteString("\n")
	}

	// Available stock display
	if m.currentTransferItem.Product.ID != uuid.Nil && m.selectedFromLocation != nil {
		form.WriteString(m.renderAvailableStock())
		form.WriteString("\n")
	}

	// Quantity input
	if m.currentTransferItem.Product.ID != uuid.Nil {
		form.WriteString(m.renderQuantityField())
		form.WriteString("\n")
	}

	// Notes input
	if m.currentTransferItem.Product.ID != uuid.Nil {
		form.WriteString(m.renderNotesField())
		form.WriteString("\n")
	}

	// Transfer validation
	if m.isCurrentItemValid() {
		form.WriteString(m.renderTransferValidation())
	}

	return form.String()
}

func (m *StockTransferModel) renderFromLocationField() string {
	label := "From Location:"
	if m.focusedField == 0 {
		label = "► " + label
	}

	locationText := "Select source location..."
	if m.selectedFromLocation != nil {
		locationText = m.selectedFromLocation.Name
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	inputStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(0, 1).
		Width(40)

	field := lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		inputStyle.Render(locationText),
	)

	if m.showFromLocationList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderLocationList("from"))
	}

	return field
}

func (m *StockTransferModel) renderToLocationField() string {
	label := "To Location:"
	if m.focusedField == 1 {
		label = "► " + label
	}

	locationText := "Select destination location..."
	if m.selectedToLocation != nil {
		locationText = m.selectedToLocation.Name
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	inputStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(0, 1).
		Width(40)

	field := lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		inputStyle.Render(locationText),
	)

	if m.showToLocationList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderLocationList("to"))
	}

	return field
}

func (m *StockTransferModel) renderProductField() string {
	label := "Product:"
	if m.focusedField == 2 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	field := lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.productSearch.View(),
	)

	if m.currentTransferItem.Product.ID != uuid.Nil {
		selected := fmt.Sprintf("Selected: %s (%s)", 
			m.currentTransferItem.Product.Name, 
			m.currentTransferItem.Product.SKU)
		field = lipgloss.JoinVertical(lipgloss.Left, field, styles.InfoStyle.Render(selected))
	}

	if m.showProductList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderProductList())
	}

	return field
}

func (m *StockTransferModel) renderAvailableStock() string {
	if m.currentTransferItem.Product.ID == uuid.Nil || m.selectedFromLocation == nil {
		return ""
	}

	key := fmt.Sprintf("%s:%s", m.currentTransferItem.Product.ID, m.selectedFromLocation.ID)
	availableQty := m.currentStock[key]
	m.currentTransferItem.AvailableStock = availableQty

	stockText := fmt.Sprintf("Available Stock at %s: %d units", 
		m.selectedFromLocation.Name, availableQty)
	
	style := styles.InfoStyle
	if availableQty == 0 {
		stockText += " (OUT OF STOCK)"
		style = styles.ErrorStyle
	} else if availableQty < 5 {
		stockText += " (LOW STOCK)"
		style = styles.WarningStyle
	}

	return style.Render(stockText)
}

func (m *StockTransferModel) renderQuantityField() string {
	label := "Quantity to Transfer:"
	if m.focusedField == 3 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	return lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.quantityInput.View(),
	)
}

func (m *StockTransferModel) renderNotesField() string {
	label := "Transfer Notes (Optional):"
	if m.focusedField == 4 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	return lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.notesInput.View(),
	)
}

func (m *StockTransferModel) renderTransferValidation() string {
	if m.currentTransferItem.Quantity > m.currentTransferItem.AvailableStock {
		warning := fmt.Sprintf("⚠️ Insufficient stock! Requested: %d, Available: %d",
			m.currentTransferItem.Quantity, m.currentTransferItem.AvailableStock)
		return styles.ErrorStyle.Render(warning)
	}

	if m.selectedFromLocation != nil && m.selectedToLocation != nil && 
	   m.selectedFromLocation.ID == m.selectedToLocation.ID {
		warning := "⚠️ Source and destination locations cannot be the same"
		return styles.ErrorStyle.Render(warning)
	}

	validation := fmt.Sprintf("✓ Transfer %d units from %s to %s",
		m.currentTransferItem.Quantity,
		m.selectedFromLocation.Name,
		m.selectedToLocation.Name)
	
	return styles.SuccessStyle.Render(validation)
}

func (m *StockTransferModel) renderLocationList(listType string) string {
	var list strings.Builder
	subtitleStyle := lipgloss.NewStyle().Foreground(styles.Subtle)
	
	if listType == "from" {
		list.WriteString(subtitleStyle.Render("Source Locations:"))
	} else {
		list.WriteString(subtitleStyle.Render("Destination Locations:"))
	}
	list.WriteString("\n")

	cursor := m.fromLocationCursor
	if listType == "to" {
		cursor = m.toLocationCursor
	}

	for i, location := range m.locations {
		// Skip current from location when showing to locations
		if listType == "to" && m.selectedFromLocation != nil && 
		   location.ID == m.selectedFromLocation.ID {
			continue
		}

		item := location.Name
		
		itemStyle := lipgloss.NewStyle().Padding(0, 1)
		if i == cursor {
			itemStyle = itemStyle.
				Background(styles.Primary).
				Foreground(lipgloss.Color("#ffffff"))
			item = "► " + item
		}
		
		list.WriteString(itemStyle.Render(item))
		list.WriteString("\n")
	}

	cardStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(1)
	return cardStyle.Render(list.String())
}

func (m *StockTransferModel) renderProductList() string {
	if len(m.filteredProducts) == 0 {
		return styles.ErrorStyle.Render("No products found")
	}

	var list strings.Builder
	subtitleStyle := lipgloss.NewStyle().Foreground(styles.Subtle)
	list.WriteString(subtitleStyle.Render("Products:"))
	list.WriteString("\n")

	start := 0
	end := len(m.filteredProducts)
	if end > 10 {
		end = 10
	}

	for i := start; i < end; i++ {
		product := m.filteredProducts[i]
		
		// Show available stock if from location is selected
		stockInfo := ""
		if m.selectedFromLocation != nil {
			key := fmt.Sprintf("%s:%s", product.ID, m.selectedFromLocation.ID)
			stock := m.currentStock[key]
			stockInfo = fmt.Sprintf(" [%d available]", stock)
		}
		
		item := fmt.Sprintf("%s (%s)%s", product.Name, product.SKU, stockInfo)
		
		itemStyle := lipgloss.NewStyle().Padding(0, 1)
		if i == m.productCursor {
			itemStyle = itemStyle.
				Background(styles.Primary).
				Foreground(lipgloss.Color("#ffffff"))
			item = "► " + item
		}
		
		list.WriteString(itemStyle.Render(item))
		list.WriteString("\n")
	}

	cardStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(1)
	return cardStyle.Render(list.String())
}

func (m *StockTransferModel) renderMultiMode() string {
	var content strings.Builder

	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	content.WriteString(headerStyle.Render("Multi-Product Transfer"))
	content.WriteString("\n\n")

	// Transfer items list
	if len(m.transferItems) == 0 {
		content.WriteString(styles.InfoStyle.Render("No transfer items. Use single mode to add items."))
	} else {
		content.WriteString(m.renderTransferItemsTable())
	}

	content.WriteString("\n\n")
	content.WriteString(m.renderSingleMode()) // Still show single form for adding

	return content.String()
}

func (m *StockTransferModel) renderTransferItemsTable() string {
	var table strings.Builder

	// Header
	headers := []string{"Product", "From", "To", "Available", "Transfer", "Notes"}
	headerWidths := []int{25, 15, 15, 9, 8, 20}
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Light).
		Foreground(styles.Dark).
		Padding(0, 1)
	table.WriteString(headerStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows
	for i, item := range m.transferItems {
		row := []string{
			item.Product.Name,
			item.FromLocation.Name,
			item.ToLocation.Name,
			fmt.Sprintf("%d", item.AvailableStock),
			fmt.Sprintf("%d", item.Quantity),
			item.Notes,
		}

		rowStyle := lipgloss.NewStyle().Padding(0, 1)
		if i == m.selectedItemIndex {
			rowStyle = rowStyle.Background(styles.Primary).Foreground(lipgloss.Color("#ffffff"))
		}
		
		if item.Quantity > item.AvailableStock {
			rowStyle = rowStyle.Foreground(styles.Danger)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockTransferModel) renderConfirmation() string {
	var confirmation strings.Builder

	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	confirmation.WriteString(headerStyle.Render("Confirm Stock Transfer"))
	confirmation.WriteString("\n\n")

	// Summary
	summary := fmt.Sprintf(
		"Transfer Summary:\n"+
		"• Total Items: %d\n"+
		"• Total Quantity: %d\n"+
		"• Affected Locations: %d",
		m.confirmationData.TotalItems,
		m.confirmationData.TotalQuantity,
		len(m.confirmationData.AffectedLocations),
	)
	confirmation.WriteString(styles.InfoStyle.Render(summary))
	confirmation.WriteString("\n\n")

	// Warnings if any
	if len(m.confirmationData.Warnings) > 0 {
		confirmation.WriteString(styles.WarningStyle.Render("⚠️ Warnings:"))
		confirmation.WriteString("\n")
		for _, warning := range m.confirmationData.Warnings {
			confirmation.WriteString(styles.WarningStyle.Render("• " + warning))
			confirmation.WriteString("\n")
		}
		confirmation.WriteString("\n")
	}

	// Transfer details table
	confirmation.WriteString(m.renderConfirmationTable())
	confirmation.WriteString("\n\n")

	// Confirmation instructions
	confirmText := "Press ENTER or Ctrl+E to execute transfer, ESC to cancel"
	if m.confirmTransfer {
		confirmText = "⚠️ Press Ctrl+E again to EXECUTE TRANSFER"
	}
	confirmation.WriteString(styles.WarningStyle.Render(confirmText))

	return confirmation.String()
}

func (m *StockTransferModel) renderConfirmationTable() string {
	var table strings.Builder

	// Header
	headers := []string{"Product", "From → To", "Quantity", "Impact", "Notes"}
	headerWidths := []int{25, 25, 8, 15, 20}
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Light).
		Foreground(styles.Dark).
		Padding(0, 1)
	table.WriteString(headerStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows
	for _, item := range m.confirmationData.Items {
		transferRoute := fmt.Sprintf("%s → %s", item.FromLocation.Name, item.ToLocation.Name)
		impact := fmt.Sprintf("%d → %d", item.AvailableStock, item.AvailableStock-item.Quantity)
		
		row := []string{
			item.Product.Name,
			transferRoute,
			fmt.Sprintf("%d", item.Quantity),
			impact,
			item.Notes,
		}

		rowStyle := lipgloss.NewStyle().Padding(0, 1)
		if item.Quantity > item.AvailableStock {
			rowStyle = rowStyle.Foreground(styles.Danger)
		} else {
			rowStyle = rowStyle.Foreground(styles.Success)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockTransferModel) renderHistory() string {
	var history strings.Builder

	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	history.WriteString(headerStyle.Render("Transfer History"))
	history.WriteString("\n\n")

	if len(m.transferHistory) == 0 {
		history.WriteString(styles.InfoStyle.Render("No transfer history available"))
		return history.String()
	}

	// History table
	history.WriteString(m.renderHistoryTable())

	return history.String()
}

func (m *StockTransferModel) renderHistoryTable() string {
	var table strings.Builder

	// Header
	headers := []string{"Transfer ID", "Items", "Date", "Status", "Created By"}
	headerWidths := []int{15, 5, 15, 10, 15}
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Light).
		Foreground(styles.Dark).
		Padding(0, 1)
	table.WriteString(headerStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows (show last 10)
	start := 0
	if len(m.transferHistory) > 10 {
		start = len(m.transferHistory) - 10
	}

	for i := start; i < len(m.transferHistory); i++ {
		record := m.transferHistory[i]
		
		row := []string{
			record.ID,
			fmt.Sprintf("%d", record.TotalItems),
			record.CreatedAt.Format("2006-01-02"),
			record.Status,
			record.CreatedBy,
		}

		rowStyle := lipgloss.NewStyle().Padding(0, 1)
		switch record.Status {
		case "completed":
			rowStyle = rowStyle.Foreground(styles.Success)
		case "cancelled":
			rowStyle = rowStyle.Foreground(styles.Danger)
		default:
			rowStyle = rowStyle.Foreground(styles.Warning)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockTransferModel) renderHelp() string {
	switch m.mode {
	case "confirm":
		return styles.HelpStyle.Render("Confirmation: Enter/Ctrl+E Execute • Esc Cancel")
	case "history":
		return styles.HelpStyle.Render("History: Esc Back")
	case "multi":
		return styles.HelpStyle.Render("Multi: Ctrl+A Add • Ctrl+D Remove • Ctrl+C Confirm • M Toggle Mode")
	default:
		return styles.HelpStyle.Render(
			"Navigation: Tab/Shift+Tab Fields • Enter Select • / Search • Ctrl+A Add • M Multi Mode\n"+
			"Actions: Ctrl+C Confirm • H History • Ctrl+X Clear • Esc Back",
		)
	}
}

// Helper methods
func (m *StockTransferModel) nextField() {
	m.focusedField = (m.focusedField + 1) % 5
	m.updateFocus()
}

func (m *StockTransferModel) previousField() {
	m.focusedField = (m.focusedField - 1 + 5) % 5
	m.updateFocus()
}

func (m *StockTransferModel) updateFocus() {
	m.productSearch.Blur()
	m.quantityInput.Blur()
	m.notesInput.Blur()

	switch m.focusedField {
	case 2:
		m.productSearch.Focus()
	case 3:
		m.quantityInput.Focus()
	case 4:
		m.notesInput.Focus()
	}
}

func (m *StockTransferModel) filterProducts() {
	if m.searchQuery == "" {
		m.filteredProducts = m.products
		return
	}

	query := strings.ToLower(m.searchQuery)
	m.filteredProducts = []models.Product{}

	for _, product := range m.products {
		if strings.Contains(strings.ToLower(product.Name), query) ||
		   strings.Contains(strings.ToLower(product.SKU), query) {
			m.filteredProducts = append(m.filteredProducts, product)
		}
	}
}

func (m *StockTransferModel) isCurrentItemValid() bool {
	return m.selectedFromLocation != nil &&
		   m.selectedToLocation != nil &&
		   m.selectedFromLocation.ID != m.selectedToLocation.ID &&
		   m.currentTransferItem.Product.ID != uuid.Nil &&
		   m.currentTransferItem.Quantity > 0 &&
		   m.currentTransferItem.Quantity <= m.currentTransferItem.AvailableStock
}

func (m *StockTransferModel) hasValidTransfers() bool {
	if m.mode == "single" {
		return m.isCurrentItemValid()
	}
	return len(m.transferItems) > 0
}

func (m *StockTransferModel) addToTransfer() {
	if !m.isCurrentItemValid() {
		return
	}

	// Update current item with selected locations
	m.currentTransferItem.FromLocation = *m.selectedFromLocation
	m.currentTransferItem.ToLocation = *m.selectedToLocation

	m.transferItems = append(m.transferItems, m.currentTransferItem)
	m.clearCurrentItem()
}

func (m *StockTransferModel) removeFromTransfer(index int) {
	if index >= 0 && index < len(m.transferItems) {
		m.transferItems = append(m.transferItems[:index], m.transferItems[index+1:]...)
		if m.selectedItemIndex >= len(m.transferItems) && len(m.transferItems) > 0 {
			m.selectedItemIndex = len(m.transferItems) - 1
		}
	}
}

func (m *StockTransferModel) clearCurrentItem() {
	m.currentTransferItem = TransferItem{}
	m.productSearch.SetValue("")
	m.quantityInput.SetValue("")
	m.notesInput.SetValue("")
	m.focusedField = 2 // Reset to product search
	m.productSearch.Focus()
}

func (m *StockTransferModel) clearTransfer() {
	m.transferItems = []TransferItem{}
	m.selectedItemIndex = 0
	m.clearCurrentItem()
	m.selectedFromLocation = nil
	m.selectedToLocation = nil
	m.mode = "single"
	m.showConfirmation = false
	m.confirmTransfer = false
}

func (m *StockTransferModel) toggleMultiMode() {
	if m.mode == "multi" {
		m.mode = "single"
		m.setMessage("Switched to single mode", "info")
	} else {
		m.mode = "multi"
		m.setMessage("Switched to multi mode", "info")
	}
}

func (m *StockTransferModel) generateConfirmation() {
	items := m.transferItems
	if m.mode == "single" && m.isCurrentItemValid() {
		// Create single transfer item
		item := m.currentTransferItem
		item.FromLocation = *m.selectedFromLocation
		item.ToLocation = *m.selectedToLocation
		items = []TransferItem{item}
	}

	totalItems := len(items)
	totalQuantity := 0
	locations := make(map[string]bool)
	var warnings []string

	for _, item := range items {
		totalQuantity += item.Quantity
		locations[item.FromLocation.ID.String()] = true
		locations[item.ToLocation.ID.String()] = true

		// Check for warnings
		if item.Quantity > item.AvailableStock {
			warnings = append(warnings, fmt.Sprintf("%s: Insufficient stock", item.Product.Name))
		}
		
		if item.AvailableStock-item.Quantity < 5 {
			warnings = append(warnings, fmt.Sprintf("%s: Will result in low stock at %s", 
				item.Product.Name, item.FromLocation.Name))
		}
	}

	m.confirmationData = ConfirmationData{
		Items:             items,
		TotalItems:        totalItems,
		TotalQuantity:     totalQuantity,
		AffectedLocations: locations,
		Warnings:          warnings,
	}
}

func (m *StockTransferModel) executeTransfer() (tea.Model, tea.Cmd) {
	if len(m.confirmationData.Items) == 0 {
		m.setMessage("No items to transfer", "error")
		return m, nil
	}

	// Check for blocking issues
	for _, item := range m.confirmationData.Items {
		if item.Quantity > item.AvailableStock {
			m.setMessage("Cannot transfer: insufficient stock", "error")
			return m, nil
		}
	}

	m.loading = true
	m.loadingMessage = "Executing stock transfer..."
	
	return m, m.performTransfer(m.confirmationData.Items)
}

func (m *StockTransferModel) formatTableRow(cells []string, widths []int) string {
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

func (m *StockTransferModel) setMessage(text, msgType string) {
	m.message = text
	m.messageType = msgType
	m.messageTimer = time.Now()
}

// Message types
type TransferHistoryLoadedMsg struct {
	History []TransferRecord
	Error   error
}

type StockTransferCompletedMsg struct {
	TransferID string
}

type StockTransferErrorMsg struct {
	Error string
}

// Commands
func (m *StockTransferModel) loadTransferHistory() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service
		// Mock transfer history
		history := []TransferRecord{
			{
				ID:         "TXN-001",
				TotalItems: 2,
				CreatedAt:  time.Now().AddDate(0, 0, -5),
				CreatedBy:  "admin",
				Status:     "completed",
				Notes:      "Regular restock",
			},
			{
				ID:         "TXN-002",
				TotalItems: 1,
				CreatedAt:  time.Now().AddDate(0, 0, -3),
				CreatedBy:  "manager",
				Status:     "completed",
				Notes:      "Emergency transfer",
			},
		}
		
		return TransferHistoryLoadedMsg{History: history, Error: nil}
	}
}

func (m *StockTransferModel) loadProducts() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service
		// For now, return sample data
		products := []models.Product{
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000001"), SKU: "LAPTOP-001", Name: "Gaming Laptop Pro"},
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000002"), SKU: "MOUSE-001", Name: "Wireless Gaming Mouse"},
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000003"), SKU: "DESK-001", Name: "Standing Desk Adjustable"},
		}
		
		return ProductsLoadedMsg{Products: products, Error: nil}
	}
}

func (m *StockTransferModel) loadLocations() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service
		locations := []models.Location{
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000001"), Name: "Main Warehouse"},
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000002"), Name: "Showroom"},
			{ID: uuid.MustParse("00000000-0000-0000-0000-000000000003"), Name: "Storage Area"},
		}
		
		return LocationsLoadedMsg{Locations: locations}
	}
}

func (m *StockTransferModel) loadCurrentStock() tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real service
		// Mock current stock levels
		stockLevels := map[string]int{
			"00000000-0000-0000-0000-000000000001:00000000-0000-0000-0000-000000000001": 5,  // Laptop at Main Warehouse
			"00000000-0000-0000-0000-000000000002:00000000-0000-0000-0000-000000000001": 25, // Mouse at Main Warehouse
			"00000000-0000-0000-0000-000000000003:00000000-0000-0000-0000-000000000002": 8,  // Desk at Showroom
		}
		
		return CurrentStockLoadedMsg{StockLevels: stockLevels}
	}
}

func (m *StockTransferModel) performTransfer(items []TransferItem) tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real inventory service
		// Simulate transfer processing
		time.Sleep(time.Millisecond * 1000)
		
		// Generate transfer ID
		transferID := fmt.Sprintf("TXN-%d", time.Now().Unix())
		
		return StockTransferCompletedMsg{TransferID: transferID}
	}
}
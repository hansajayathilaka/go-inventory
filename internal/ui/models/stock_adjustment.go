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

type StockAdjustmentModel struct {
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
	reasonCodes     []ReasonCode
	currentStock    map[string]int // product_id:location_id -> quantity

	// Form state
	mode             string // "single", "batch", "preview"
	focusedField     int
	selectedProduct  *models.Product
	selectedLocation *models.Location
	adjustmentType   string // "increase", "decrease", "set"
	quantity         int
	reason           string
	notes            string
	batchAdjustments []BatchAdjustment

	// UI state
	productSearch     textinput.Model
	quantityInput     textinput.Model
	notesInput        textinput.Model
	showProductList   bool
	showLocationList  bool
	showReasonList    bool
	productCursor     int
	locationCursor    int
	reasonCursor      int
	filteredProducts  []models.Product
	searchQuery       string

	// Preview and confirmation
	showPreview       bool
	previewData       PreviewData
	confirmSave       bool

	// Key bindings
	keys StockAdjustmentKeyMap

	// Messages
	message      string
	messageType  string
	messageTimer time.Time
}

type BatchAdjustment struct {
	Product     models.Product
	Location    models.Location
	Type        string // "increase", "decrease", "set"
	Quantity    int
	CurrentQty  int
	NewQty      int
	Reason      string
	Notes       string
}

type PreviewData struct {
	Adjustments    []BatchAdjustment
	TotalItems     int
	TotalQuantity  int
	AffectedStock  int
}

type ReasonCode struct {
	Code        string
	Description string
	Type        string // "increase", "decrease", "both"
}

type StockAdjustmentKeyMap struct {
	Up          key.Binding
	Down        key.Binding
	Left        key.Binding
	Right       key.Binding
	Tab         key.Binding
	ShiftTab    key.Binding
	Enter       key.Binding
	Escape      key.Binding
	Search      key.Binding
	Add         key.Binding
	Remove      key.Binding
	Clear       key.Binding
	Preview     key.Binding
	Save        key.Binding
	BatchMode   key.Binding
	Help        key.Binding
	Quit        key.Binding
}

func DefaultStockAdjustmentKeys() StockAdjustmentKeyMap {
	return StockAdjustmentKeyMap{
		Up:        key.NewBinding(key.WithKeys("up", "k"), key.WithHelp("↑/k", "move up")),
		Down:      key.NewBinding(key.WithKeys("down", "j"), key.WithHelp("↓/j", "move down")),
		Left:      key.NewBinding(key.WithKeys("left", "h"), key.WithHelp("←/h", "move left")),
		Right:     key.NewBinding(key.WithKeys("right", "l"), key.WithHelp("→/l", "move right")),
		Tab:       key.NewBinding(key.WithKeys("tab"), key.WithHelp("tab", "next field")),
		ShiftTab:  key.NewBinding(key.WithKeys("shift+tab"), key.WithHelp("shift+tab", "prev field")),
		Enter:     key.NewBinding(key.WithKeys("enter"), key.WithHelp("enter", "select/confirm")),
		Escape:    key.NewBinding(key.WithKeys("esc"), key.WithHelp("esc", "cancel/back")),
		Search:    key.NewBinding(key.WithKeys("/"), key.WithHelp("/", "search products")),
		Add:       key.NewBinding(key.WithKeys("ctrl+a"), key.WithHelp("ctrl+a", "add to batch")),
		Remove:    key.NewBinding(key.WithKeys("ctrl+d"), key.WithHelp("ctrl+d", "remove from batch")),
		Clear:     key.NewBinding(key.WithKeys("ctrl+x"), key.WithHelp("ctrl+x", "clear form")),
		Preview:   key.NewBinding(key.WithKeys("ctrl+p"), key.WithHelp("ctrl+p", "preview changes")),
		Save:      key.NewBinding(key.WithKeys("ctrl+s"), key.WithHelp("ctrl+s", "save adjustments")),
		BatchMode: key.NewBinding(key.WithKeys("b"), key.WithHelp("b", "toggle batch mode")),
		Help:      key.NewBinding(key.WithKeys("?"), key.WithHelp("?", "help")),
		Quit:      key.NewBinding(key.WithKeys("q", "ctrl+c"), key.WithHelp("q", "quit")),
	}
}

// Backward compatibility wrapper
func NewStockAdjustmentFormWithContext(appCtx interface{}) tea.Model {
	// For now, create a simple version that works with the existing interface
	return NewStockAdjustmentModel(nil)
}

func NewStockAdjustmentModel(inventoryService *inventory.Service) *StockAdjustmentModel {
	// Initialize text inputs
	productSearch := textinput.New()
	productSearch.Placeholder = "Search products by name or SKU..."
	productSearch.Focus()

	quantityInput := textinput.New()
	quantityInput.Placeholder = "Enter quantity..."

	notesInput := textinput.New()
	notesInput.Placeholder = "Optional notes..."

	return &StockAdjustmentModel{
		inventoryService: inventoryService,
		mode:            "single",
		adjustmentType:  "increase",
		productSearch:   productSearch,
		quantityInput:   quantityInput,
		notesInput:      notesInput,
		currentStock:    make(map[string]int),
		keys:            DefaultStockAdjustmentKeys(),
		reasonCodes:     getDefaultReasonCodes(),
	}
}

func (m *StockAdjustmentModel) Init() tea.Cmd {
	return tea.Batch(
		m.loadProducts(),
		m.loadLocations(),
		m.loadCurrentStock(),
	)
}

func (m *StockAdjustmentModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
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
		case "preview":
			return m.handlePreviewKeys(msg)
		default:
			return m.handleFormKeys(msg)
		}

	case ProductsLoadedMsg:
		m.products = msg.Products
		m.filterProducts()
		m.loading = false
		m.ready = true

	case LocationsLoadedMsg:
		m.locations = msg.Locations

	case CurrentStockLoadedMsg:
		m.currentStock = msg.StockLevels

	case StockAdjustmentSavedMsg:
		m.loading = false
		m.setMessage("Stock adjustment saved successfully", "success")
		m.clearForm()

	case StockAdjustmentErrorMsg:
		m.loading = false
		m.setMessage(fmt.Sprintf("Error: %s", msg.Error), "error")

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

func (m *StockAdjustmentModel) handleFormKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.keys.Escape):
		if m.showProductList {
			m.showProductList = false
		} else if m.showLocationList {
			m.showLocationList = false
		} else if m.showReasonList {
			m.showReasonList = false
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
		if m.showProductList {
			if m.productCursor > 0 {
				m.productCursor--
			}
		} else if m.showLocationList {
			if m.locationCursor > 0 {
				m.locationCursor--
			}
		} else if m.showReasonList {
			if m.reasonCursor > 0 {
				m.reasonCursor--
			}
		}

	case key.Matches(msg, m.keys.Down):
		if m.showProductList {
			if m.productCursor < len(m.filteredProducts)-1 {
				m.productCursor++
			}
		} else if m.showLocationList {
			if m.locationCursor < len(m.locations)-1 {
				m.locationCursor++
			}
		} else if m.showReasonList {
			if m.reasonCursor < len(m.reasonCodes)-1 {
				m.reasonCursor++
			}
		}

	case key.Matches(msg, m.keys.Search):
		m.focusedField = 0 // Product search field
		m.showProductList = true
		m.productSearch.Focus()

	case key.Matches(msg, m.keys.Add):
		if m.mode == "single" && m.isFormValid() {
			m.addToBatch()
			m.setMessage("Added to batch adjustments", "info")
		}

	case key.Matches(msg, m.keys.Remove):
		if m.mode == "batch" && len(m.batchAdjustments) > 0 {
			m.removeLastFromBatch()
			m.setMessage("Removed last adjustment from batch", "info")
		}

	case key.Matches(msg, m.keys.Clear):
		m.clearForm()
		m.setMessage("Form cleared", "info")

	case key.Matches(msg, m.keys.Preview):
		if m.isFormValid() || len(m.batchAdjustments) > 0 {
			m.generatePreview()
			m.mode = "preview"
		} else {
			m.setMessage("Please fill required fields or add batch adjustments", "error")
		}

	case key.Matches(msg, m.keys.Save):
		if m.isFormValid() || len(m.batchAdjustments) > 0 {
			return m.saveAdjustments()
		} else {
			m.setMessage("Please fill required fields", "error")
		}

	case key.Matches(msg, m.keys.BatchMode):
		m.toggleBatchMode()

	// Adjustment type shortcuts
	case key.Matches(msg, key.NewBinding(key.WithKeys("1"))):
		m.adjustmentType = "increase"
		m.setMessage("Set to increase stock", "info")

	case key.Matches(msg, key.NewBinding(key.WithKeys("2"))):
		m.adjustmentType = "decrease"
		m.setMessage("Set to decrease stock", "info")

	case key.Matches(msg, key.NewBinding(key.WithKeys("3"))):
		m.adjustmentType = "set"
		m.setMessage("Set to absolute stock level", "info")
	}

	return m, nil
}

func (m *StockAdjustmentModel) handlePreviewKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch {
	case key.Matches(msg, m.keys.Quit):
		return m, tea.Quit

	case key.Matches(msg, m.keys.Escape):
		m.mode = "single"
		m.showPreview = false

	case key.Matches(msg, m.keys.Save):
		if m.confirmSave {
			return m.saveAdjustments()
		} else {
			m.confirmSave = true
			m.setMessage("Press Save again to confirm", "warning")
		}

	case key.Matches(msg, m.keys.Enter):
		return m.saveAdjustments()
	}

	return m, nil
}

func (m *StockAdjustmentModel) handleEnter() (tea.Model, tea.Cmd) {
	if m.showProductList && len(m.filteredProducts) > 0 {
		m.selectedProduct = &m.filteredProducts[m.productCursor]
		m.showProductList = false
		m.focusedField = 1 // Move to location field
		m.setMessage(fmt.Sprintf("Selected product: %s", m.selectedProduct.Name), "info")

	} else if m.showLocationList && len(m.locations) > 0 {
		m.selectedLocation = &m.locations[m.locationCursor]
		m.showLocationList = false
		m.focusedField = 2 // Move to adjustment type field
		m.setMessage(fmt.Sprintf("Selected location: %s", m.selectedLocation.Name), "info")

	} else if m.showReasonList && len(m.reasonCodes) > 0 {
		m.reason = m.reasonCodes[m.reasonCursor].Code
		m.showReasonList = false
		m.focusedField = 5 // Move to notes field
		m.setMessage(fmt.Sprintf("Selected reason: %s", m.reasonCodes[m.reasonCursor].Description), "info")

	} else {
		// Handle field-specific enter actions
		switch m.focusedField {
		case 0: // Product search
			m.showProductList = !m.showProductList
		case 1: // Location
			m.showLocationList = !m.showLocationList
		case 3: // Quantity input
			if qty, err := strconv.Atoi(m.quantityInput.Value()); err == nil && qty > 0 {
				m.quantity = qty
				m.focusedField = 4 // Move to reason field
			} else {
				m.setMessage("Please enter a valid quantity", "error")
			}
		case 4: // Reason
			m.showReasonList = !m.showReasonList
		case 5: // Notes
			m.notes = m.notesInput.Value()
			if m.isFormValid() {
				return m.saveAdjustments()
			}
		}
	}

	return m, nil
}

func (m *StockAdjustmentModel) View() string {
	if !m.ready {
		return styles.InfoStyle.Render("Loading stock adjustment interface...")
	}

	var content strings.Builder

	// Header
	content.WriteString(m.renderHeader())
	content.WriteString("\n\n")

	// Main content based on mode
	switch m.mode {
	case "preview":
		content.WriteString(m.renderPreview())
	case "batch":
		content.WriteString(m.renderBatchMode())
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

func (m *StockAdjustmentModel) renderHeader() string {
	title := styles.TitleStyle.Render("📊 Stock Adjustment")
	
	modeText := strings.Title(m.mode) + " Mode"
	if len(m.batchAdjustments) > 0 {
		modeText += fmt.Sprintf(" (%d queued)", len(m.batchAdjustments))
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

func (m *StockAdjustmentModel) renderSingleMode() string {
	var form strings.Builder

	// Product selection
	form.WriteString(m.renderProductField())
	form.WriteString("\n")

	// Location selection
	if m.selectedProduct != nil {
		form.WriteString(m.renderLocationField())
		form.WriteString("\n")
	}

	// Current stock display
	if m.selectedProduct != nil && m.selectedLocation != nil {
		form.WriteString(m.renderCurrentStock())
		form.WriteString("\n")
	}

	// Adjustment type
	if m.selectedProduct != nil && m.selectedLocation != nil {
		form.WriteString(m.renderAdjustmentType())
		form.WriteString("\n")
	}

	// Quantity input
	if m.selectedProduct != nil && m.selectedLocation != nil {
		form.WriteString(m.renderQuantityField())
		form.WriteString("\n")
	}

	// Reason selection
	if m.selectedProduct != nil && m.selectedLocation != nil {
		form.WriteString(m.renderReasonField())
		form.WriteString("\n")
	}

	// Notes input
	if m.selectedProduct != nil && m.selectedLocation != nil {
		form.WriteString(m.renderNotesField())
		form.WriteString("\n")
	}

	// Preview calculation
	if m.isFormValid() {
		form.WriteString(m.renderCalculation())
	}

	return form.String()
}

func (m *StockAdjustmentModel) renderProductField() string {
	label := "Product:"
	if m.focusedField == 0 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	field := lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.productSearch.View(),
	)

	if m.selectedProduct != nil {
		selected := fmt.Sprintf("Selected: %s (%s)", m.selectedProduct.Name, m.selectedProduct.SKU)
		field = lipgloss.JoinVertical(lipgloss.Left, field, styles.InfoStyle.Render(selected))
	}

	if m.showProductList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderProductList())
	}

	return field
}

func (m *StockAdjustmentModel) renderLocationField() string {
	label := "Location:"
	if m.focusedField == 1 {
		label = "► " + label
	}

	locationText := "Select location..."
	if m.selectedLocation != nil {
		locationText = m.selectedLocation.Name
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

	if m.showLocationList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderLocationList())
	}

	return field
}

func (m *StockAdjustmentModel) renderCurrentStock() string {
	if m.selectedProduct == nil || m.selectedLocation == nil {
		return ""
	}

	key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
	currentQty := m.currentStock[key]

	stockText := fmt.Sprintf("Current Stock: %d units", currentQty)
	style := styles.InfoStyle
	
	// Add stock level indication
	if currentQty == 0 {
		stockText += " (OUT OF STOCK)"
		style = styles.ErrorStyle
	} else if currentQty < 10 { // This could be configurable
		stockText += " (LOW STOCK)"
		style = styles.WarningStyle
	}

	return style.Render(stockText)
}

func (m *StockAdjustmentModel) renderAdjustmentType() string {
	label := "Adjustment Type:"
	if m.focusedField == 2 {
		label = "► " + label
	}

	types := []string{"1. Increase", "2. Decrease", "3. Set Absolute"}
	typeButtons := make([]string, len(types))
	
	for i, t := range types {
		buttonStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			Padding(0, 1).
			Margin(0, 1, 0, 0)

		if (i == 0 && m.adjustmentType == "increase") ||
		   (i == 1 && m.adjustmentType == "decrease") ||
		   (i == 2 && m.adjustmentType == "set") {
			buttonStyle = buttonStyle.
				Background(styles.Primary).
				Foreground(lipgloss.Color("#ffffff"))
		}
		typeButtons[i] = buttonStyle.Render(t)
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	return lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		lipgloss.JoinHorizontal(lipgloss.Left, typeButtons...),
	)
}

func (m *StockAdjustmentModel) renderQuantityField() string {
	label := "Quantity:"
	if m.focusedField == 3 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	return lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.quantityInput.View(),
	)
}

func (m *StockAdjustmentModel) renderReasonField() string {
	label := "Reason:"
	if m.focusedField == 4 {
		label = "► " + label
	}

	reasonText := "Select reason..."
	if m.reason != "" {
		for _, rc := range m.reasonCodes {
			if rc.Code == m.reason {
				reasonText = rc.Description
				break
			}
		}
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	inputStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		Padding(0, 1).
		Width(40)

	field := lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		inputStyle.Render(reasonText),
	)

	if m.showReasonList {
		field = lipgloss.JoinVertical(lipgloss.Left, field, m.renderReasonList())
	}

	return field
}

func (m *StockAdjustmentModel) renderNotesField() string {
	label := "Notes (Optional):"
	if m.focusedField == 5 {
		label = "► " + label
	}

	labelStyle := lipgloss.NewStyle().Bold(true)
	return lipgloss.JoinVertical(lipgloss.Left,
		labelStyle.Render(label),
		m.notesInput.View(),
	)
}

func (m *StockAdjustmentModel) renderCalculation() string {
	if m.selectedProduct == nil || m.selectedLocation == nil {
		return ""
	}

	key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
	currentQty := m.currentStock[key]
	newQty := m.calculateNewQuantity(currentQty, m.adjustmentType, m.quantity)
	
	calculation := fmt.Sprintf("Preview: %d → %d (Change: %+d)",
		currentQty, newQty, newQty-currentQty)
	
	style := styles.InfoStyle
	if newQty < 0 {
		style = styles.ErrorStyle
		calculation += " ⚠️ Negative stock!"
	} else if newQty < currentQty {
		style = styles.WarningStyle
	} else {
		style = styles.SuccessStyle
	}

	return style.Render(calculation)
}

func (m *StockAdjustmentModel) renderProductList() string {
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
		item := fmt.Sprintf("%s (%s)", product.Name, product.SKU)
		
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

func (m *StockAdjustmentModel) renderLocationList() string {
	var list strings.Builder
	subtitleStyle := lipgloss.NewStyle().Foreground(styles.Subtle)
	list.WriteString(subtitleStyle.Render("Locations:"))
	list.WriteString("\n")

	for i, location := range m.locations {
		item := location.Name
		
		itemStyle := lipgloss.NewStyle().Padding(0, 1)
		if i == m.locationCursor {
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

func (m *StockAdjustmentModel) renderReasonList() string {
	var list strings.Builder
	subtitleStyle := lipgloss.NewStyle().Foreground(styles.Subtle)
	list.WriteString(subtitleStyle.Render("Reasons:"))
	list.WriteString("\n")

	for i, reason := range m.reasonCodes {
		if reason.Type != "both" && reason.Type != m.adjustmentType {
			continue
		}
		
		item := fmt.Sprintf("%s - %s", reason.Code, reason.Description)
		
		itemStyle := lipgloss.NewStyle().Padding(0, 1)
		if i == m.reasonCursor {
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

func (m *StockAdjustmentModel) renderBatchMode() string {
	var content strings.Builder
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	content.WriteString(headerStyle.Render("Batch Adjustments"))
	content.WriteString("\n\n")

	if len(m.batchAdjustments) == 0 {
		content.WriteString(styles.InfoStyle.Render("No adjustments in batch. Use single mode to add items."))
	} else {
		// Render batch table
		content.WriteString(m.renderBatchTable())
	}

	content.WriteString("\n\n")
	content.WriteString(m.renderSingleMode()) // Still show single form for adding

	return content.String()
}

func (m *StockAdjustmentModel) renderBatchTable() string {
	var table strings.Builder

	// Header
	headers := []string{"Product", "Location", "Current", "Type", "Quantity", "New", "Reason"}
	headerWidths := []int{20, 15, 8, 10, 8, 8, 15}
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Light).
		Foreground(styles.Dark).
		Padding(0, 1)
	table.WriteString(headerStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows
	for _, adj := range m.batchAdjustments {
		typeText := strings.ToUpper(string(adj.Type[0])) + adj.Type[1:] // Capitalize
		
		row := []string{
			adj.Product.Name,
			adj.Location.Name,
			fmt.Sprintf("%d", adj.CurrentQty),
			typeText,
			fmt.Sprintf("%d", adj.Quantity),
			fmt.Sprintf("%d", adj.NewQty),
			adj.Reason,
		}

		rowStyle := lipgloss.NewStyle().Padding(0, 1)
		if adj.NewQty < 0 {
			rowStyle = rowStyle.Foreground(styles.Danger)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockAdjustmentModel) renderPreview() string {
	var preview strings.Builder

	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	preview.WriteString(headerStyle.Render("Preview Stock Adjustments"))
	preview.WriteString("\n\n")

	// Summary
	summary := fmt.Sprintf(
		"Total Adjustments: %d\n"+
		"Items Affected: %d\n"+
		"Net Quantity Change: %+d",
		len(m.previewData.Adjustments),
		m.previewData.TotalItems,
		m.previewData.TotalQuantity,
	)
	preview.WriteString(styles.InfoStyle.Render(summary))
	preview.WriteString("\n\n")

	// Adjustments table
	preview.WriteString(m.renderPreviewTable())
	preview.WriteString("\n\n")

	// Confirmation
	confirmText := "Press ENTER or Ctrl+S to save, ESC to cancel"
	if m.confirmSave {
		confirmText = "⚠️  Press Ctrl+S again to CONFIRM SAVE"
	}
	preview.WriteString(styles.WarningStyle.Render(confirmText))

	return preview.String()
}

func (m *StockAdjustmentModel) renderPreviewTable() string {
	adjustments := m.previewData.Adjustments
	if len(m.batchAdjustments) > 0 {
		adjustments = m.batchAdjustments
	} else if m.isFormValid() {
		// Create single adjustment from current form
		key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
		currentQty := m.currentStock[key]
		newQty := m.calculateNewQuantity(currentQty, m.adjustmentType, m.quantity)
		
		adjustments = []BatchAdjustment{{
			Product:    *m.selectedProduct,
			Location:   *m.selectedLocation,
			Type:       m.adjustmentType,
			Quantity:   m.quantity,
			CurrentQty: currentQty,
			NewQty:     newQty,
			Reason:     m.reason,
			Notes:      m.notes,
		}}
	}

	var table strings.Builder

	// Header
	headers := []string{"Product", "Location", "Current", "Adjustment", "New", "Change", "Reason"}
	headerWidths := []int{20, 15, 8, 12, 8, 8, 15}
	
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Background(styles.Light).
		Foreground(styles.Dark).
		Padding(0, 1)
	table.WriteString(headerStyle.Render(m.formatTableRow(headers, headerWidths)))
	table.WriteString("\n")

	// Rows
	for _, adj := range adjustments {
		adjustmentText := fmt.Sprintf("%s %d", strings.ToUpper(adj.Type), adj.Quantity)
		changeText := fmt.Sprintf("%+d", adj.NewQty-adj.CurrentQty)
		
		row := []string{
			adj.Product.Name,
			adj.Location.Name,
			fmt.Sprintf("%d", adj.CurrentQty),
			adjustmentText,
			fmt.Sprintf("%d", adj.NewQty),
			changeText,
			adj.Reason,
		}

		rowStyle := lipgloss.NewStyle().Padding(0, 1)
		if adj.NewQty < 0 {
			rowStyle = rowStyle.Foreground(styles.Danger)
		} else if adj.NewQty < adj.CurrentQty {
			rowStyle = rowStyle.Foreground(styles.Warning)
		} else {
			rowStyle = rowStyle.Foreground(styles.Success)
		}

		table.WriteString(rowStyle.Render(m.formatTableRow(row, headerWidths)))
		table.WriteString("\n")
	}

	return table.String()
}

func (m *StockAdjustmentModel) renderHelp() string {
	switch m.mode {
	case "preview":
		return styles.HelpStyle.Render("Navigation: Enter/Ctrl+S Save • Esc Cancel • ? Help")
	case "batch":
		return styles.HelpStyle.Render("Batch: Ctrl+A Add • Ctrl+D Remove • Ctrl+P Preview • Ctrl+S Save • B Toggle Mode")
	default:
		return styles.HelpStyle.Render(
			"Navigation: Tab/Shift+Tab Fields • Enter Select • 1/2/3 Adj Type • / Search • Ctrl+P Preview • Ctrl+S Save\n"+
			"Batch: Ctrl+A Add • B Toggle • Actions: Ctrl+X Clear • Esc Back • ? Help",
		)
	}
}

// Helper methods
func (m *StockAdjustmentModel) nextField() {
	m.focusedField = (m.focusedField + 1) % 6
	m.updateFocus()
}

func (m *StockAdjustmentModel) previousField() {
	m.focusedField = (m.focusedField - 1 + 6) % 6
	m.updateFocus()
}

func (m *StockAdjustmentModel) updateFocus() {
	m.productSearch.Blur()
	m.quantityInput.Blur()
	m.notesInput.Blur()

	switch m.focusedField {
	case 0:
		m.productSearch.Focus()
	case 3:
		m.quantityInput.Focus()
	case 5:
		m.notesInput.Focus()
	}
}

func (m *StockAdjustmentModel) filterProducts() {
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

func (m *StockAdjustmentModel) isFormValid() bool {
	return m.selectedProduct != nil &&
		   m.selectedLocation != nil &&
		   m.quantity > 0 &&
		   m.reason != ""
}

func (m *StockAdjustmentModel) addToBatch() {
	if !m.isFormValid() {
		return
	}

	key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
	currentQty := m.currentStock[key]
	newQty := m.calculateNewQuantity(currentQty, m.adjustmentType, m.quantity)

	adjustment := BatchAdjustment{
		Product:    *m.selectedProduct,
		Location:   *m.selectedLocation,
		Type:       m.adjustmentType,
		Quantity:   m.quantity,
		CurrentQty: currentQty,
		NewQty:     newQty,
		Reason:     m.reason,
		Notes:      m.notes,
	}

	m.batchAdjustments = append(m.batchAdjustments, adjustment)
	m.clearFormFields()
}

func (m *StockAdjustmentModel) removeLastFromBatch() {
	if len(m.batchAdjustments) > 0 {
		m.batchAdjustments = m.batchAdjustments[:len(m.batchAdjustments)-1]
	}
}

func (m *StockAdjustmentModel) toggleBatchMode() {
	if m.mode == "batch" {
		m.mode = "single"
		m.setMessage("Switched to single mode", "info")
	} else {
		m.mode = "batch"
		m.setMessage("Switched to batch mode", "info")
	}
}

func (m *StockAdjustmentModel) generatePreview() {
	adjustments := m.batchAdjustments
	if len(adjustments) == 0 && m.isFormValid() {
		// Generate preview for single adjustment
		key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
		currentQty := m.currentStock[key]
		newQty := m.calculateNewQuantity(currentQty, m.adjustmentType, m.quantity)
		
		adjustments = []BatchAdjustment{{
			Product:    *m.selectedProduct,
			Location:   *m.selectedLocation,
			Type:       m.adjustmentType,
			Quantity:   m.quantity,
			CurrentQty: currentQty,
			NewQty:     newQty,
			Reason:     m.reason,
			Notes:      m.notes,
		}}
	}

	totalItems := len(adjustments)
	totalQuantity := 0
	affectedStock := 0

	for _, adj := range adjustments {
		totalQuantity += adj.NewQty - adj.CurrentQty
		affectedStock += adj.CurrentQty
	}

	m.previewData = PreviewData{
		Adjustments:   adjustments,
		TotalItems:    totalItems,
		TotalQuantity: totalQuantity,
		AffectedStock: affectedStock,
	}
}

func (m *StockAdjustmentModel) calculateNewQuantity(current int, adjType string, quantity int) int {
	switch adjType {
	case "increase":
		return current + quantity
	case "decrease":
		return current - quantity
	case "set":
		return quantity
	default:
		return current
	}
}

func (m *StockAdjustmentModel) saveAdjustments() (tea.Model, tea.Cmd) {
	adjustments := m.batchAdjustments
	if len(adjustments) == 0 && m.isFormValid() {
		// Save single adjustment
		key := fmt.Sprintf("%s:%s", m.selectedProduct.ID, m.selectedLocation.ID)
		currentQty := m.currentStock[key]
		newQty := m.calculateNewQuantity(currentQty, m.adjustmentType, m.quantity)
		
		adjustments = []BatchAdjustment{{
			Product:    *m.selectedProduct,
			Location:   *m.selectedLocation,
			Type:       m.adjustmentType,
			Quantity:   m.quantity,
			CurrentQty: currentQty,
			NewQty:     newQty,
			Reason:     m.reason,
			Notes:      m.notes,
		}}
	}

	if len(adjustments) == 0 {
		m.setMessage("No adjustments to save", "error")
		return m, nil
	}

	m.loading = true
	m.loadingMessage = "Saving stock adjustments..."
	
	return m, m.performStockAdjustments(adjustments)
}

func (m *StockAdjustmentModel) clearForm() {
	m.selectedProduct = nil
	m.selectedLocation = nil
	m.adjustmentType = "increase"
	m.quantity = 0
	m.reason = ""
	m.notes = ""
	m.batchAdjustments = []BatchAdjustment{}
	m.mode = "single"
	m.showPreview = false
	m.confirmSave = false
	m.clearFormFields()
}

func (m *StockAdjustmentModel) clearFormFields() {
	m.productSearch.SetValue("")
	m.quantityInput.SetValue("")
	m.notesInput.SetValue("")
	m.focusedField = 0
	m.productSearch.Focus()
}

func (m *StockAdjustmentModel) formatTableRow(cells []string, widths []int) string {
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

func (m *StockAdjustmentModel) setMessage(text, msgType string) {
	m.message = text
	m.messageType = msgType
	m.messageTimer = time.Now()
}

func getDefaultReasonCodes() []ReasonCode {
	return []ReasonCode{
		{Code: "PURCHASE", Description: "Stock received from purchase", Type: "increase"},
		{Code: "RETURN", Description: "Customer return", Type: "increase"},
		{Code: "CORRECTION", Description: "Inventory correction", Type: "both"},
		{Code: "DAMAGE", Description: "Damaged goods", Type: "decrease"},
		{Code: "THEFT", Description: "Theft or loss", Type: "decrease"},
		{Code: "SALE", Description: "Stock sold", Type: "decrease"},
		{Code: "TRANSFER_IN", Description: "Transfer from another location", Type: "increase"},
		{Code: "TRANSFER_OUT", Description: "Transfer to another location", Type: "decrease"},
		{Code: "EXPIRED", Description: "Expired products", Type: "decrease"},
		{Code: "PROMOTION", Description: "Promotional giveaway", Type: "decrease"},
		{Code: "RECOUNT", Description: "Physical recount adjustment", Type: "both"},
		{Code: "WRITE_OFF", Description: "Stock write-off", Type: "decrease"},
	}
}

// Message types
type ProductsLoadedMsg struct {
	Products []models.Product
	Error    error
}

type CurrentStockLoadedMsg struct {
	StockLevels map[string]int // product_id:location_id -> quantity
}

type StockAdjustmentSavedMsg struct {
	AdjustmentIDs []string
}

type StockAdjustmentErrorMsg struct {
	Error string
}

// Commands
func (m *StockAdjustmentModel) loadProducts() tea.Cmd {
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

func (m *StockAdjustmentModel) loadLocations() tea.Cmd {
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

func (m *StockAdjustmentModel) loadCurrentStock() tea.Cmd {
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

func (m *StockAdjustmentModel) performStockAdjustments(adjustments []BatchAdjustment) tea.Cmd {
	return func() tea.Msg {
		// This would integrate with the real inventory service
		// For now, simulate success after a delay
		time.Sleep(time.Millisecond * 500)
		
		adjustmentIDs := make([]string, len(adjustments))
		for i := range adjustments {
			adjustmentIDs[i] = fmt.Sprintf("ADJ-%d-%d", time.Now().Unix(), i+1)
		}
		
		return StockAdjustmentSavedMsg{AdjustmentIDs: adjustmentIDs}
	}
}
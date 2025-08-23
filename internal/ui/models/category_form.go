package models

import (
	"context"
	"fmt"
	"strings"

	"tui-inventory/internal/app"
	"tui-inventory/internal/business/hierarchy"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"
)

type CategoryFormState int

const (
	CategoryFormLoadingState CategoryFormState = iota
	CategoryFormEditingState
	CategoryFormParentSelectState
	CategoryFormSavingState
	CategoryFormErrorState
	CategoryFormSuccessState
)

type CategoryFormMode int

const (
	CategoryCreateMode CategoryFormMode = iota
	CategoryEditMode
)

type CategoryFormField int

const (
	CategoryNameField CategoryFormField = iota
	CategoryDescriptionField
	CategoryParentField
	CategoryActiveField
	CategoryFormFieldCount
)

type CategoryForm struct {
	state         CategoryFormState
	mode          CategoryFormMode
	appCtx        *app.Context
	sessionMgr    *app.SessionManager
	hierarchySvc  hierarchy.Service

	// Data
	category         *models.Category
	originalCategory *models.Category
	categories       []*models.Category
	parentCategories []*models.Category

	// Form fields
	name            string
	description     string
	parentID        *uuid.UUID
	parentName      string
	active          bool
	
	// Validation
	nameError        string
	descriptionError string
	parentError      string
	generalError     string

	// UI State
	currentField     CategoryFormField
	parentSelectIdx  int
	parentScroll     int
	maxParentVisible int

	// Path preview
	previewPath      string

	// Status
	loading          bool
	saving           bool
	errorMessage     string
	successMessage   string

	// Help
	showHelp         bool
	helpExpanded     bool
}

type CategoryFormMsg struct{}
type CategoriesForParentLoadedMsg struct {
	Categories []*models.Category
	Error      error
}
type CategorySaveMsg struct {
	Category *models.Category
	Error    error
}
type PathPreviewMsg struct {
	Path  string
	Error error
}

func NewCategoryForm(appCtx *app.Context, sessionMgr *app.SessionManager, hierarchySvc hierarchy.Service, mode CategoryFormMode, category *models.Category) *CategoryForm {
	form := &CategoryForm{
		state:            CategoryFormLoadingState,
		mode:             mode,
		appCtx:           appCtx,
		sessionMgr:       sessionMgr,
		hierarchySvc:     hierarchySvc,
		currentField:     CategoryNameField,
		maxParentVisible: 10,
		active:           true,
		showHelp:         false,
		helpExpanded:     false,
	}

	if mode == CategoryEditMode && category != nil {
		form.category = category
		form.originalCategory = &models.Category{
			ID:          category.ID,
			Name:        category.Name,
			Description: category.Description,
			ParentID:    category.ParentID,
			Level:       category.Level,
			Path:        category.Path,
		}
		form.name = category.Name
		form.description = category.Description
		form.parentID = category.ParentID
		form.active = true // Would need to get this from the model if it has an active field
	} else {
		form.category = &models.Category{
			ID: uuid.New(),
		}
	}

	return form
}

func (m *CategoryForm) Init() tea.Cmd {
	return tea.Sequence(
		m.loadParentCategories(),
		m.updatePathPreview(),
	)
}

func (m *CategoryForm) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		if m.state == CategoryFormLoadingState || m.saving {
			return m, nil
		}

		switch m.state {
		case CategoryFormParentSelectState:
			return m.handleParentSelection(msg)
		case CategoryFormErrorState, CategoryFormSuccessState:
			return m.handleStatusInput(msg)
		default:
			return m.handleFormInput(msg)
		}

	case CategoriesForParentLoadedMsg:
		m.loading = false
		if msg.Error != nil {
			m.state = CategoryFormErrorState
			m.errorMessage = fmt.Sprintf("Failed to load categories: %v", msg.Error)
		} else {
			m.categories = msg.Categories
			m.filterParentCategories()
			if m.state == CategoryFormLoadingState {
				m.state = CategoryFormEditingState
			}
		}
		return m, nil

	case PathPreviewMsg:
		if msg.Error == nil {
			m.previewPath = msg.Path
		}
		return m, nil

	case CategorySaveMsg:
		m.saving = false
		if msg.Error != nil {
			m.state = CategoryFormErrorState
			m.errorMessage = fmt.Sprintf("Failed to save category: %v", msg.Error)
		} else {
			m.state = CategoryFormSuccessState
			if m.mode == CategoryCreateMode {
				m.successMessage = fmt.Sprintf("Category '%s' created successfully!", msg.Category.Name)
			} else {
				m.successMessage = fmt.Sprintf("Category '%s' updated successfully!", msg.Category.Name)
			}
			m.category = msg.Category
		}
		return m, nil
	}

	return m, tea.Batch(cmds...)
}

func (m *CategoryForm) handleFormInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg.String() {
	case "q", "esc":
		return m, tea.Quit

	case "h", "?":
		m.showHelp = !m.showHelp
		if m.showHelp {
			m.helpExpanded = false
		}

	case "H":
		if m.showHelp {
			m.helpExpanded = !m.helpExpanded
		}

	case "tab", "down":
		m.currentField = (m.currentField + 1) % CategoryFormFieldCount

	case "shift+tab", "up":
		m.currentField = (m.currentField - 1 + CategoryFormFieldCount) % CategoryFormFieldCount

	case "enter":
		switch m.currentField {
		case CategoryParentField:
			m.state = CategoryFormParentSelectState
			m.parentSelectIdx = 0
			m.parentScroll = 0
		case CategoryActiveField:
			m.active = !m.active
		default:
			// Save the form
			if m.validateForm() {
				m.saving = true
				m.state = CategoryFormSavingState
				return m, m.saveCategory()
			}
		}

	case "ctrl+s":
		if m.validateForm() {
			m.saving = true
			m.state = CategoryFormSavingState
			return m, m.saveCategory()
		}

	case "backspace":
		switch m.currentField {
		case CategoryNameField:
			if len(m.name) > 0 {
				m.name = m.name[:len(m.name)-1]
				m.clearFieldError(CategoryNameField)
				cmds = append(cmds, m.updatePathPreview())
			}
		case CategoryDescriptionField:
			if len(m.description) > 0 {
				m.description = m.description[:len(m.description)-1]
				m.clearFieldError(CategoryDescriptionField)
			}
		}

	default:
		// Handle character input
		if len(msg.String()) == 1 {
			switch m.currentField {
			case CategoryNameField:
				if len(m.name) < 100 {
					m.name += msg.String()
					m.clearFieldError(CategoryNameField)
					cmds = append(cmds, m.updatePathPreview())
				}
			case CategoryDescriptionField:
				if len(m.description) < 500 {
					m.description += msg.String()
					m.clearFieldError(CategoryDescriptionField)
				}
			}
		}
	}

	return m, tea.Batch(cmds...)
}

func (m *CategoryForm) handleParentSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg.String() {
	case "esc":
		m.state = CategoryFormEditingState
		return m, nil

	case "enter":
		if len(m.parentCategories) > 0 && m.parentSelectIdx < len(m.parentCategories) {
			selected := m.parentCategories[m.parentSelectIdx]
			m.parentID = &selected.ID
			m.parentName = selected.Name
			m.clearFieldError(CategoryParentField)
			cmds = append(cmds, m.updatePathPreview())
		} else if m.parentSelectIdx == 0 {
			// "No parent" option
			m.parentID = nil
			m.parentName = ""
			m.clearFieldError(CategoryParentField)
			cmds = append(cmds, m.updatePathPreview())
		}
		m.state = CategoryFormEditingState
		return m, tea.Batch(cmds...)

	case "j", "down":
		maxIdx := len(m.parentCategories)
		if maxIdx > 0 {
			m.parentSelectIdx = (m.parentSelectIdx + 1) % (maxIdx + 1) // +1 for "No parent" option
			m.adjustParentScroll()
		}

	case "k", "up":
		maxIdx := len(m.parentCategories)
		if maxIdx > 0 {
			m.parentSelectIdx = (m.parentSelectIdx - 1 + maxIdx + 1) % (maxIdx + 1)
			m.adjustParentScroll()
		}

	case "g":
		m.parentSelectIdx = 0
		m.parentScroll = 0

	case "G":
		if len(m.parentCategories) > 0 {
			m.parentSelectIdx = len(m.parentCategories)
			m.adjustParentScroll()
		}
	}

	return m, nil
}

func (m *CategoryForm) handleStatusInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "q", "esc", "enter":
		if m.state == CategoryFormSuccessState {
			return m, tea.Quit
		} else {
			m.state = CategoryFormEditingState
			m.errorMessage = ""
		}
	}
	return m, nil
}

func (m *CategoryForm) View() string {
	if !m.hasPermission("categories.create") && m.mode == CategoryCreateMode {
		return styles.ErrorStyle.Render("Access denied: You don't have permission to create categories")
	}
	if !m.hasPermission("categories.update") && m.mode == CategoryEditMode {
		return styles.ErrorStyle.Render("Access denied: You don't have permission to edit categories")
	}

	var sections []string

	// Header
	sections = append(sections, m.renderHeader())

	// State-specific content
	switch m.state {
	case CategoryFormLoadingState:
		sections = append(sections, styles.InfoStyle.Render("Loading category data..."))
	case CategoryFormSavingState:
		sections = append(sections, styles.InfoStyle.Render("Saving category..."))
	case CategoryFormErrorState:
		sections = append(sections, m.renderError())
	case CategoryFormSuccessState:
		sections = append(sections, m.renderSuccess())
	case CategoryFormParentSelectState:
		sections = append(sections, m.renderParentSelector())
	default:
		sections = append(sections, m.renderForm())
	}

	// Help
	if m.showHelp {
		sections = append(sections, m.renderHelp())
	}

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

func (m *CategoryForm) renderHeader() string {
	title := "Create Category"
	if m.mode == CategoryEditMode {
		title = "Edit Category"
	}

	var info []string
	if m.category != nil && m.mode == CategoryEditMode {
		info = append(info, fmt.Sprintf("ID: %s", m.category.ID.String()[:8]))
	}
	if m.previewPath != "" {
		info = append(info, fmt.Sprintf("Path: %s", m.previewPath))
	}

	if len(info) > 0 {
		headerInfo := fmt.Sprintf("(%s)", strings.Join(info, " | "))
		return styles.TitleStyle.Render(title) + " " + styles.HelpStyle.Render(headerInfo)
	}

	return styles.TitleStyle.Render(title)
}

func (m *CategoryForm) renderForm() string {
	var sections []string

	// Form fields
	sections = append(sections, m.renderFormFields())

	// Path preview
	if m.previewPath != "" {
		sections = append(sections, "")
		sections = append(sections, styles.InfoStyle.Render(fmt.Sprintf("Preview Path: %s", m.previewPath)))
	}

	// Validation errors
	if m.hasAnyErrors() {
		sections = append(sections, "")
		sections = append(sections, m.renderValidationErrors())
	}

	// Instructions
	sections = append(sections, "")
	sections = append(sections, m.renderInstructions())

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

func (m *CategoryForm) renderFormFields() string {
	var fields []string

	// Name field
	nameStyle := styles.InputStyle
	if m.currentField == CategoryNameField {
		nameStyle = styles.InputFocusedStyle
	}
	nameLabel := "Name:"
	if m.nameError != "" {
		nameLabel = styles.ErrorStyle.Render("Name: " + m.nameError)
	}
	nameValue := m.name
	if m.currentField == CategoryNameField {
		nameValue += "│" // Cursor
	}
	fields = append(fields, nameLabel)
	fields = append(fields, nameStyle.Render(nameValue))
	fields = append(fields, "")

	// Description field
	descStyle := styles.InputStyle
	if m.currentField == CategoryDescriptionField {
		descStyle = styles.InputFocusedStyle
	}
	descLabel := "Description:"
	if m.descriptionError != "" {
		descLabel = styles.ErrorStyle.Render("Description: " + m.descriptionError)
	}
	descValue := m.description
	if m.currentField == CategoryDescriptionField {
		descValue += "│" // Cursor
	}
	if descValue == "" {
		descValue = "(optional)"
	}
	fields = append(fields, descLabel)
	fields = append(fields, descStyle.Render(descValue))
	fields = append(fields, "")

	// Parent field
	parentStyle := styles.InputStyle
	if m.currentField == CategoryParentField {
		parentStyle = styles.InputFocusedStyle
	}
	parentLabel := "Parent Category:"
	if m.parentError != "" {
		parentLabel = styles.ErrorStyle.Render("Parent Category: " + m.parentError)
	}
	parentValue := m.parentName
	if parentValue == "" {
		parentValue = "(none - root category)"
	}
	if m.currentField == CategoryParentField {
		parentValue += " [Press Enter to select]"
	}
	fields = append(fields, parentLabel)
	fields = append(fields, parentStyle.Render(parentValue))
	fields = append(fields, "")

	// Active field
	activeStyle := styles.InputStyle
	if m.currentField == CategoryActiveField {
		activeStyle = styles.InputFocusedStyle
	}
	activeLabel := "Active:"
	activeValue := "No"
	if m.active {
		activeValue = "Yes"
	}
	if m.currentField == CategoryActiveField {
		activeValue += " [Press Enter to toggle]"
	}
	fields = append(fields, activeLabel)
	fields = append(fields, activeStyle.Render(activeValue))

	return lipgloss.JoinVertical(lipgloss.Left, fields...)
}

func (m *CategoryForm) renderParentSelector() string {
	var lines []string

	lines = append(lines, styles.TitleStyle.Render("Select Parent Category"))
	lines = append(lines, "")

	// "No parent" option
	noParentStyle := styles.InputStyle
	if m.parentSelectIdx == 0 {
		noParentStyle = styles.TableSelectedRowStyle
	}
	lines = append(lines, noParentStyle.Render("(none - root category)"))

	// Parent categories
	visibleStart := m.parentScroll
	visibleEnd := m.parentScroll + m.maxParentVisible
	if visibleEnd > len(m.parentCategories) {
		visibleEnd = len(m.parentCategories)
	}

	for i := visibleStart; i < visibleEnd; i++ {
		category := m.parentCategories[i]
		
		// Check if this would create a circular reference
		isInvalid := m.wouldCreateCircularReference(category.ID)
		
		categoryStyle := styles.InputStyle
		if i+1 == m.parentSelectIdx { // +1 because index 0 is "no parent"
			categoryStyle = styles.TableSelectedRowStyle
		}
		if isInvalid {
			categoryStyle = styles.ErrorStyle
		}

		levelIndent := strings.Repeat("  ", category.Level)
		categoryText := fmt.Sprintf("%s%s", levelIndent, category.Name)
		if isInvalid {
			categoryText += " (would create circular reference)"
		}

		lines = append(lines, categoryStyle.Render(categoryText))
	}

	// Scroll indicators
	if m.parentScroll > 0 {
		lines = append(lines, styles.HelpStyle.Render("↑ More categories above"))
	}
	if visibleEnd < len(m.parentCategories) {
		lines = append(lines, styles.HelpStyle.Render("↓ More categories below"))
	}

	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("↑↓/jk: navigate, Enter: select, Esc: cancel"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryForm) renderValidationErrors() string {
	var errors []string

	if m.nameError != "" {
		errors = append(errors, "• "+m.nameError)
	}
	if m.descriptionError != "" {
		errors = append(errors, "• "+m.descriptionError)
	}
	if m.parentError != "" {
		errors = append(errors, "• "+m.parentError)
	}
	if m.generalError != "" {
		errors = append(errors, "• "+m.generalError)
	}

	if len(errors) > 0 {
		return styles.ErrorStyle.Render("Validation Errors:\n" + strings.Join(errors, "\n"))
	}

	return ""
}

func (m *CategoryForm) renderInstructions() string {
	var instructions []string

	if m.state == CategoryFormEditingState {
		instructions = append(instructions, "Tab/Shift+Tab: navigate fields")
		instructions = append(instructions, "Enter: select parent or save form")
		instructions = append(instructions, "Ctrl+S: save")
		instructions = append(instructions, "h/?: toggle help")
		instructions = append(instructions, "q/Esc: quit")
	}

	return styles.HelpStyle.Render(strings.Join(instructions, " | "))
}

func (m *CategoryForm) renderError() string {
	var lines []string

	lines = append(lines, styles.ErrorStyle.Render("Error"))
	lines = append(lines, "")
	lines = append(lines, m.errorMessage)
	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("Press any key to continue editing"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryForm) renderSuccess() string {
	var lines []string

	lines = append(lines, styles.SuccessStyle.Render("Success"))
	lines = append(lines, "")
	lines = append(lines, m.successMessage)
	
	if m.category != nil {
		lines = append(lines, "")
		lines = append(lines, fmt.Sprintf("Category ID: %s", m.category.ID))
		lines = append(lines, fmt.Sprintf("Path: %s", m.category.Path))
		lines = append(lines, fmt.Sprintf("Level: %d", m.category.Level))
	}

	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("Press any key to close"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryForm) renderHelp() string {
	basicHelp := []string{
		"Navigation: Tab/Shift+Tab: next/previous field",
		"Input: Type to enter text, Backspace to delete",
		"Parent: Enter to open selector, select with ↑↓/jk",
		"Save: Enter (on any field) or Ctrl+S",
		"Other: h/?: toggle help, H: expand help, q/Esc: quit",
	}

	var lines []string
	lines = append(lines, styles.TitleStyle.Render("Help"))

	if m.helpExpanded {
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Category Form Features:"))
		lines = append(lines, "• Create new categories or edit existing ones")
		lines = append(lines, "• Select parent category from hierarchy")
		lines = append(lines, "• Real-time path preview as you type")
		lines = append(lines, "• Circular reference prevention")
		lines = append(lines, "• Input validation with error messages")
		lines = append(lines, "• Level validation (max depth enforcement)")
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Validation Rules:"))
		lines = append(lines, "• Name: Required, 1-100 characters, unique within parent")
		lines = append(lines, "• Description: Optional, max 500 characters")
		lines = append(lines, "• Parent: Optional, cannot create circular references")
		lines = append(lines, "• Level: Maximum depth of 5 levels")
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Keyboard Shortcuts:"))
		for _, help := range basicHelp {
			lines = append(lines, "• "+help)
		}
	} else {
		for _, help := range basicHelp {
			lines = append(lines, help)
		}
		lines = append(lines, styles.HelpStyle.Render("Press H for expanded help"))
	}

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

// Helper methods

func (m *CategoryForm) loadParentCategories() tea.Cmd {
	return func() tea.Msg {
		categories, err := m.hierarchySvc.ListCategories(context.Background(), 1000, 0)
		return CategoriesForParentLoadedMsg{Categories: categories, Error: err}
	}
}

func (m *CategoryForm) saveCategory() tea.Cmd {
	return func() tea.Msg {
		var savedCategory *models.Category
		var err error

		if m.mode == CategoryCreateMode {
			savedCategory, err = m.hierarchySvc.CreateCategory(
				context.Background(),
				m.name,
				m.description,
				m.parentID,
			)
		} else {
			// Update existing category
			m.category.Name = m.name
			m.category.Description = m.description
			m.category.ParentID = m.parentID
			
			err = m.hierarchySvc.UpdateCategory(context.Background(), m.category)
			if err == nil {
				savedCategory = m.category
			}
		}

		return CategorySaveMsg{Category: savedCategory, Error: err}
	}
}

func (m *CategoryForm) updatePathPreview() tea.Cmd {
	return func() tea.Msg {
		if m.name == "" {
			return PathPreviewMsg{Path: "", Error: nil}
		}

		var path string
		if m.parentID != nil {
			// Find parent category and build path
			for _, category := range m.categories {
				if category.ID == *m.parentID {
					path = category.Path + "/" + m.name
					break
				}
			}
		} else {
			path = m.name
		}

		return PathPreviewMsg{Path: path, Error: nil}
	}
}

func (m *CategoryForm) validateForm() bool {
	m.clearAllErrors()
	valid := true

	// Name validation
	if strings.TrimSpace(m.name) == "" {
		m.nameError = "Name is required"
		valid = false
	} else if len(m.name) > 100 {
		m.nameError = "Name must be 100 characters or less"
		valid = false
	}

	// Description validation
	if len(m.description) > 500 {
		m.descriptionError = "Description must be 500 characters or less"
		valid = false
	}

	// Parent validation
	if m.parentID != nil {
		if m.wouldCreateCircularReference(*m.parentID) {
			m.parentError = "Selected parent would create a circular reference"
			valid = false
		}
		
		// Check level depth
		parentLevel := m.getParentLevel(*m.parentID)
		if parentLevel >= 4 { // Max depth is 5, so parent can be at most level 4
			m.parentError = "Maximum category depth exceeded"
			valid = false
		}
	}

	// Check for duplicate names within the same parent
	if m.isDuplicateName() {
		m.nameError = "A category with this name already exists in the selected parent"
		valid = false
	}

	return valid
}

func (m *CategoryForm) filterParentCategories() {
	m.parentCategories = nil

	for _, category := range m.categories {
		// Exclude self when editing
		if m.mode == CategoryEditMode && m.category != nil && category.ID == m.category.ID {
			continue
		}
		
		// Exclude descendants when editing (to prevent circular references)
		if m.mode == CategoryEditMode && m.category != nil {
			if strings.HasPrefix(category.Path, m.category.Path+"/") {
				continue
			}
		}

		m.parentCategories = append(m.parentCategories, category)
	}
}

func (m *CategoryForm) wouldCreateCircularReference(parentID uuid.UUID) bool {
	if m.mode != CategoryEditMode || m.category == nil {
		return false
	}

	// Check if the selected parent is a descendant of the current category
	for _, category := range m.categories {
		if category.ID == parentID {
			return strings.HasPrefix(category.Path, m.category.Path+"/") || category.Path == m.category.Path
		}
	}

	return false
}

func (m *CategoryForm) getParentLevel(parentID uuid.UUID) int {
	for _, category := range m.categories {
		if category.ID == parentID {
			return category.Level
		}
	}
	return 0
}

func (m *CategoryForm) isDuplicateName() bool {
	trimmedName := strings.TrimSpace(m.name)
	if trimmedName == "" {
		return false
	}

	for _, category := range m.categories {
		// Skip self when editing
		if m.mode == CategoryEditMode && m.category != nil && category.ID == m.category.ID {
			continue
		}

		// Check if same name and same parent
		if strings.EqualFold(category.Name, trimmedName) {
			// Both have no parent (root level)
			if m.parentID == nil && category.ParentID == nil {
				return true
			}
			// Both have the same parent
			if m.parentID != nil && category.ParentID != nil && *m.parentID == *category.ParentID {
				return true
			}
		}
	}

	return false
}

func (m *CategoryForm) adjustParentScroll() {
	if m.parentSelectIdx < m.parentScroll {
		m.parentScroll = m.parentSelectIdx
	} else if m.parentSelectIdx >= m.parentScroll+m.maxParentVisible {
		m.parentScroll = m.parentSelectIdx - m.maxParentVisible + 1
	}

	// Ensure scroll is within bounds
	maxScroll := len(m.parentCategories) + 1 - m.maxParentVisible // +1 for "no parent" option
	if maxScroll < 0 {
		maxScroll = 0
	}
	if m.parentScroll > maxScroll {
		m.parentScroll = maxScroll
	}
	if m.parentScroll < 0 {
		m.parentScroll = 0
	}
}

func (m *CategoryForm) hasAnyErrors() bool {
	return m.nameError != "" || m.descriptionError != "" || m.parentError != "" || m.generalError != ""
}

func (m *CategoryForm) clearFieldError(field CategoryFormField) {
	switch field {
	case CategoryNameField:
		m.nameError = ""
	case CategoryDescriptionField:
		m.descriptionError = ""
	case CategoryParentField:
		m.parentError = ""
	}
}

func (m *CategoryForm) clearAllErrors() {
	m.nameError = ""
	m.descriptionError = ""
	m.parentError = ""
	m.generalError = ""
}

func (m *CategoryForm) hasPermission(permission string) bool {
	// For now, return true - would need to implement permission checking
	// in the session manager or get user role from session
	return true
}
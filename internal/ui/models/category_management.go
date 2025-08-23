package models

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"tui-inventory/internal/app"
	"tui-inventory/internal/business/hierarchy"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"github.com/google/uuid"
)

type CategoryManagementState int

const (
	CategoryManagementLoadingState CategoryManagementState = iota
	CategoryManagementReadyState
	CategoryManagementFilterState
	CategoryManagementBulkState
	CategoryManagementConfirmDeleteState
	CategoryManagementErrorState
)

type CategoryDisplayMode int

const (
	CategoryTableMode CategoryDisplayMode = iota
	CategoryHierarchyMode
)

type CategoryFilter struct {
	Level      int    // -1 for all levels
	ParentID   *uuid.UUID
	HasProducts bool
	SearchTerm string
}

type CategoryBulkOperation int

const (
	BulkActivate CategoryBulkOperation = iota
	BulkDeactivate
	BulkMove
	BulkDelete
)

type CategoryManagement struct {
	state         CategoryManagementState
	appCtx        *app.Context
	sessionMgr    *app.SessionManager
	hierarchySvc  hierarchy.Service

	// Data
	categories          []*models.Category
	filteredCategories  []*models.Category
	selectedCategory    *models.Category
	categoryHierarchy   *hierarchy.CategoryNode
	productCounts       map[uuid.UUID]int

	// UI State
	displayMode         CategoryDisplayMode
	currentPage         int
	itemsPerPage        int
	totalItems          int
	totalPages          int
	selectedIndex       int
	scrollOffset        int
	
	// Filter state
	filter              CategoryFilter
	tempFilter          CategoryFilter
	filterCursor        int

	// Bulk operations
	selectedCategories  map[uuid.UUID]bool
	bulkOperation      CategoryBulkOperation
	bulkConfirmed      bool

	// Confirmation state
	confirmingDelete   bool
	categoryToDelete   *models.Category

	// Error handling
	errorMessage       string
	loading            bool
	lastError          error

	// Help
	showHelp           bool
	helpExpanded       bool
}

type CategoryManagementMsg struct{}
type CategoriesLoadedMsg struct {
	Categories []*models.Category
	Error      error
}
type CategoryHierarchyLoadedMsg struct {
	Hierarchy *hierarchy.CategoryNode
	Error     error
}
type ProductCountsLoadedMsg struct {
	Counts map[uuid.UUID]int
	Error  error
}
type CategoryDeletedMsg struct {
	ID    uuid.UUID
	Error error
}
type CategoryUpdatedMsg struct {
	Category *models.Category
	Error    error
}
type BulkOperationCompletedMsg struct {
	Operation CategoryBulkOperation
	Affected  int
	Error     error
}

func NewCategoryManagement(appCtx *app.Context, sessionMgr *app.SessionManager, hierarchySvc hierarchy.Service) *CategoryManagement {
	return &CategoryManagement{
		state:              CategoryManagementLoadingState,
		appCtx:             appCtx,
		sessionMgr:         sessionMgr,
		hierarchySvc:       hierarchySvc,
		displayMode:        CategoryTableMode,
		itemsPerPage:       15,
		currentPage:        1,
		selectedIndex:      0,
		scrollOffset:       0,
		filter:             CategoryFilter{Level: -1},
		selectedCategories: make(map[uuid.UUID]bool),
		productCounts:      make(map[uuid.UUID]int),
		showHelp:           false,
		helpExpanded:       false,
	}
}

func (m *CategoryManagement) Init() tea.Cmd {
	return tea.Sequence(
		m.loadCategories(),
		m.loadCategoryHierarchy(),
		m.loadProductCounts(),
	)
}

func (m *CategoryManagement) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		if m.state == CategoryManagementLoadingState {
			return m, nil
		}
		
		switch m.state {
		case CategoryManagementFilterState:
			return m.handleFilterInput(msg)
		case CategoryManagementBulkState:
			return m.handleBulkOperationInput(msg)
		case CategoryManagementConfirmDeleteState:
			return m.handleDeleteConfirmation(msg)
		default:
			return m.handleMainInput(msg)
		}

	case CategoriesLoadedMsg:
		m.loading = false
		if msg.Error != nil {
			m.state = CategoryManagementErrorState
			m.errorMessage = fmt.Sprintf("Failed to load categories: %v", msg.Error)
		} else {
			m.categories = msg.Categories
			m.applyFilter()
			if m.state == CategoryManagementLoadingState {
				m.state = CategoryManagementReadyState
			}
		}
		return m, nil

	case CategoryHierarchyLoadedMsg:
		if msg.Error != nil {
			m.lastError = msg.Error
		} else {
			m.categoryHierarchy = msg.Hierarchy
		}
		return m, nil

	case ProductCountsLoadedMsg:
		if msg.Error != nil {
			m.lastError = msg.Error
		} else {
			m.productCounts = msg.Counts
		}
		return m, nil

	case CategoryDeletedMsg:
		m.loading = false
		if msg.Error != nil {
			m.errorMessage = fmt.Sprintf("Failed to delete category: %v", msg.Error)
		} else {
			// Remove category from list
			for i, cat := range m.categories {
				if cat.ID == msg.ID {
					m.categories = append(m.categories[:i], m.categories[i+1:]...)
					break
				}
			}
			m.applyFilter()
			m.adjustSelection()
		}
		m.state = CategoryManagementReadyState
		m.confirmingDelete = false
		m.categoryToDelete = nil
		return m, nil

	case CategoryUpdatedMsg:
		m.loading = false
		if msg.Error != nil {
			m.errorMessage = fmt.Sprintf("Failed to update category: %v", msg.Error)
		} else {
			// Update category in list
			for i, cat := range m.categories {
				if cat.ID == msg.Category.ID {
					m.categories[i] = msg.Category
					break
				}
			}
			m.applyFilter()
		}
		return m, nil

	case BulkOperationCompletedMsg:
		m.loading = false
		if msg.Error != nil {
			m.errorMessage = fmt.Sprintf("Bulk operation failed: %v", msg.Error)
		} else {
			m.selectedCategories = make(map[uuid.UUID]bool)
			cmds = append(cmds, m.loadCategories())
		}
		m.state = CategoryManagementReadyState
		return m, tea.Batch(cmds...)
	}

	return m, tea.Batch(cmds...)
}

func (m *CategoryManagement) handleMainInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
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

	case "r":
		m.loading = true
		cmds = append(cmds, m.loadCategories(), m.loadCategoryHierarchy(), m.loadProductCounts())

	case "f":
		m.state = CategoryManagementFilterState
		m.tempFilter = m.filter
		m.filterCursor = 0

	case "t":
		if m.displayMode == CategoryTableMode {
			m.displayMode = CategoryHierarchyMode
		} else {
			m.displayMode = CategoryTableMode
		}

	case "b":
		if len(m.selectedCategories) > 0 {
			m.state = CategoryManagementBulkState
			m.bulkOperation = BulkActivate
		}

	case " ":
		if len(m.filteredCategories) > 0 && m.selectedIndex < len(m.filteredCategories) {
			category := m.filteredCategories[m.selectedIndex]
			if m.selectedCategories[category.ID] {
				delete(m.selectedCategories, category.ID)
			} else {
				m.selectedCategories[category.ID] = true
			}
		}

	case "a":
		// Select all visible categories
		for _, category := range m.filteredCategories {
			m.selectedCategories[category.ID] = true
		}

	case "A":
		// Deselect all
		m.selectedCategories = make(map[uuid.UUID]bool)

	case "enter":
		if len(m.filteredCategories) > 0 && m.selectedIndex < len(m.filteredCategories) {
			m.selectedCategory = m.filteredCategories[m.selectedIndex]
			// Could navigate to category form or detail view
		}

	case "d":
		if len(m.filteredCategories) > 0 && m.selectedIndex < len(m.filteredCategories) {
			category := m.filteredCategories[m.selectedIndex]
			if m.canDeleteCategory(category) {
				m.categoryToDelete = category
				m.state = CategoryManagementConfirmDeleteState
				m.confirmingDelete = true
			} else {
				m.errorMessage = "Cannot delete category: has products or subcategories"
			}
		}

	case "j", "down":
		if len(m.filteredCategories) > 0 {
			m.selectedIndex = (m.selectedIndex + 1) % len(m.filteredCategories)
			m.adjustScrollOffset()
		}

	case "k", "up":
		if len(m.filteredCategories) > 0 {
			m.selectedIndex = (m.selectedIndex - 1 + len(m.filteredCategories)) % len(m.filteredCategories)
			m.adjustScrollOffset()
		}

	case "g":
		if len(m.filteredCategories) > 0 {
			m.selectedIndex = 0
			m.scrollOffset = 0
		}

	case "G":
		if len(m.filteredCategories) > 0 {
			m.selectedIndex = len(m.filteredCategories) - 1
			m.adjustScrollOffset()
		}

	case "n":
		if m.currentPage < m.totalPages {
			m.currentPage++
			m.selectedIndex = 0
			m.scrollOffset = 0
		}

	case "p":
		if m.currentPage > 1 {
			m.currentPage--
			m.selectedIndex = 0
			m.scrollOffset = 0
		}
	}

	return m, tea.Batch(cmds...)
}

func (m *CategoryManagement) handleFilterInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.state = CategoryManagementReadyState
		return m, nil

	case "enter":
		m.filter = m.tempFilter
		m.applyFilter()
		m.state = CategoryManagementReadyState
		return m, nil

	case "tab", "down":
		m.filterCursor = (m.filterCursor + 1) % 4

	case "shift+tab", "up":
		m.filterCursor = (m.filterCursor - 1 + 4) % 4

	default:
		switch m.filterCursor {
		case 0: // Level filter
			switch msg.String() {
			case "backspace":
				m.tempFilter.Level = -1
			default:
				if level, err := strconv.Atoi(msg.String()); err == nil && level >= -1 && level <= 5 {
					m.tempFilter.Level = level
				}
			}
		case 2: // Search term
			switch msg.String() {
			case "backspace":
				if len(m.tempFilter.SearchTerm) > 0 {
					m.tempFilter.SearchTerm = m.tempFilter.SearchTerm[:len(m.tempFilter.SearchTerm)-1]
				}
			default:
				if len(msg.String()) == 1 {
					m.tempFilter.SearchTerm += msg.String()
				}
			}
		}
	}

	return m, nil
}

func (m *CategoryManagement) handleBulkOperationInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.state = CategoryManagementReadyState
		return m, nil

	case "enter":
		m.loading = true
		return m, m.performBulkOperation()

	case "j", "down":
		m.bulkOperation = (m.bulkOperation + 1) % 4

	case "k", "up":
		m.bulkOperation = (m.bulkOperation - 1 + 4) % 4
	}

	return m, nil
}

func (m *CategoryManagement) handleDeleteConfirmation(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "y", "Y":
		if m.categoryToDelete != nil {
			m.loading = true
			return m, m.deleteCategory(m.categoryToDelete.ID)
		}
		fallthrough
	case "n", "N", "esc":
		m.state = CategoryManagementReadyState
		m.confirmingDelete = false
		m.categoryToDelete = nil
	}

	return m, nil
}

func (m *CategoryManagement) View() string {
	if !m.hasPermission("categories.view") {
		return styles.ErrorStyle.Render("Access denied: You don't have permission to view categories")
	}

	var sections []string

	// Header
	sections = append(sections, m.renderHeader())

	if m.state == CategoryManagementLoadingState || m.loading {
		sections = append(sections, styles.InfoStyle.Render("Loading categories..."))
		return lipgloss.JoinVertical(lipgloss.Left, sections...)
	}

	if m.state == CategoryManagementErrorState {
		sections = append(sections, styles.ErrorStyle.Render(m.errorMessage))
		return lipgloss.JoinVertical(lipgloss.Left, sections...)
	}

	// Filters bar
	sections = append(sections, m.renderFiltersBar())

	// State-specific content
	switch m.state {
	case CategoryManagementFilterState:
		sections = append(sections, m.renderFilterDialog())
	case CategoryManagementBulkState:
		sections = append(sections, m.renderBulkOperationDialog())
	case CategoryManagementConfirmDeleteState:
		sections = append(sections, m.renderDeleteConfirmation())
	default:
		// Category list
		if m.displayMode == CategoryTableMode {
			sections = append(sections, m.renderCategoryTable())
		} else {
			sections = append(sections, m.renderCategoryHierarchy())
		}

		// Pagination
		if m.totalPages > 1 {
			sections = append(sections, m.renderPagination())
		}

		// Selected categories info
		if len(m.selectedCategories) > 0 {
			sections = append(sections, m.renderSelectedCategoriesInfo())
		}
	}

	// Error message
	if m.errorMessage != "" && m.state != CategoryManagementErrorState {
		sections = append(sections, styles.ErrorStyle.Render("Error: "+m.errorMessage))
	}

	// Help
	if m.showHelp {
		sections = append(sections, m.renderHelp())
	}

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

func (m *CategoryManagement) renderHeader() string {
	title := "Category Management"
	
	var info []string
	info = append(info, fmt.Sprintf("Total: %d", m.totalItems))
	if len(m.selectedCategories) > 0 {
		info = append(info, fmt.Sprintf("Selected: %d", len(m.selectedCategories)))
	}
	info = append(info, fmt.Sprintf("Mode: %s", m.getDisplayModeName()))

	headerInfo := fmt.Sprintf("(%s)", strings.Join(info, " | "))
	
	return styles.TitleStyle.Render(title) + " " + styles.HelpStyle.Render(headerInfo)
}

func (m *CategoryManagement) renderFiltersBar() string {
	var filters []string

	if m.filter.Level >= 0 {
		filters = append(filters, fmt.Sprintf("Level: %d", m.filter.Level))
	}
	if m.filter.SearchTerm != "" {
		filters = append(filters, fmt.Sprintf("Search: %s", m.filter.SearchTerm))
	}
	if m.filter.HasProducts {
		filters = append(filters, "Has Products")
	}

	if len(filters) == 0 {
		filters = append(filters, "No filters")
	}

	filterText := "Filters: " + strings.Join(filters, ", ")
	return styles.InfoStyle.Render(filterText) + " " + styles.HelpStyle.Render("(f to modify)")
}

func (m *CategoryManagement) renderCategoryTable() string {
	if len(m.filteredCategories) == 0 {
		return styles.InfoStyle.Render("No categories found")
	}

	var rows []string

	// Header
	header := fmt.Sprintf("%-3s %-30s %-10s %-20s %-8s %-12s", 
		"Sel", "Name", "Level", "Path", "Products", "Status")
	rows = append(rows, styles.TableHeaderStyle.Render(header))

	// Calculate visible range
	startIdx := m.scrollOffset
	endIdx := startIdx + m.itemsPerPage
	if endIdx > len(m.filteredCategories) {
		endIdx = len(m.filteredCategories)
	}

	for i := startIdx; i < endIdx; i++ {
		category := m.filteredCategories[i]
		
		// Selection indicator
		sel := " "
		if m.selectedCategories[category.ID] {
			sel = "✓"
		}

		// Cursor indicator
		cursor := " "
		if i == m.selectedIndex {
			cursor = ">"
		}

		// Product count
		productCount := m.productCounts[category.ID]
		
		// Status
		status := "Active"
		// Add status logic based on your models.Category structure

		row := fmt.Sprintf("%s%-2s %-30s %-10d %-20s %-8d %-12s",
			cursor, sel,
			m.truncate(category.Name, 30),
			category.Level,
			m.truncate(category.Path, 20),
			productCount,
			status)

		style := styles.TableCellStyle
		if i == m.selectedIndex {
			style = styles.TableSelectedRowStyle
		}
		if m.selectedCategories[category.ID] {
			style = style.Background(lipgloss.Color("#2a2a3a"))
		}

		rows = append(rows, style.Render(row))
	}

	return lipgloss.JoinVertical(lipgloss.Left, rows...)
}

func (m *CategoryManagement) renderCategoryHierarchy() string {
	if m.categoryHierarchy == nil {
		return styles.InfoStyle.Render("Loading hierarchy...")
	}

	return m.renderHierarchyNode(m.categoryHierarchy, 0, "")
}

func (m *CategoryManagement) renderHierarchyNode(node *hierarchy.CategoryNode, level int, prefix string) string {
	if node == nil || node.Category == nil {
		return ""
	}

	var result strings.Builder
	
	// Current node
	indent := strings.Repeat("  ", level)
	icon := "├── "
	if level == 0 {
		icon = ""
	}

	// Selection indicator
	sel := " "
	if m.selectedCategories[node.Category.ID] {
		sel = "✓"
	}

	productCount := m.productCounts[node.Category.ID]
	line := fmt.Sprintf("%s%s[%s] %s (%d products)",
		indent, icon, sel, node.Category.Name, productCount)

	// Check if this is the selected item
	isSelected := m.selectedIndex < len(m.filteredCategories) && 
		m.filteredCategories[m.selectedIndex].ID == node.Category.ID

	if isSelected {
		line = styles.TableSelectedRowStyle.Render(line)
	} else {
		line = styles.TableCellStyle.Render(line)
	}

	result.WriteString(line + "\n")

	// Children
	for _, child := range node.Children {
		result.WriteString(m.renderHierarchyNode(child, level+1, prefix+"  "))
	}

	return result.String()
}

func (m *CategoryManagement) renderPagination() string {
	return fmt.Sprintf("Page %d of %d (n: next, p: previous)", m.currentPage, m.totalPages)
}

func (m *CategoryManagement) renderSelectedCategoriesInfo() string {
	count := len(m.selectedCategories)
	text := fmt.Sprintf("%d categories selected (b: bulk operations, A: deselect all)", count)
	return styles.InfoStyle.Render(text)
}

func (m *CategoryManagement) renderFilterDialog() string {
	var lines []string
	lines = append(lines, styles.TitleStyle.Render("Filter Categories"))
	lines = append(lines, "")

	// Level filter
	levelStyle := styles.InputStyle
	if m.filterCursor == 0 {
		levelStyle = styles.InputFocusedStyle
	}
	levelText := "All levels"
	if m.tempFilter.Level >= 0 {
		levelText = fmt.Sprintf("Level %d", m.tempFilter.Level)
	}
	lines = append(lines, levelStyle.Render(fmt.Sprintf("Level: %s", levelText)))

	// Parent filter (simplified for now)
	parentStyle := styles.InputStyle
	if m.filterCursor == 1 {
		parentStyle = styles.InputFocusedStyle
	}
	lines = append(lines, parentStyle.Render("Parent: All categories"))

	// Search term
	searchStyle := styles.InputStyle
	if m.filterCursor == 2 {
		searchStyle = styles.InputFocusedStyle
	}
	searchText := m.tempFilter.SearchTerm
	if searchText == "" {
		searchText = "(empty)"
	}
	lines = append(lines, searchStyle.Render(fmt.Sprintf("Search: %s", searchText)))

	// Has products filter
	productsStyle := styles.InputStyle
	if m.filterCursor == 3 {
		productsStyle = styles.InputFocusedStyle
	}
	productsText := "No"
	if m.tempFilter.HasProducts {
		productsText = "Yes"
	}
	lines = append(lines, productsStyle.Render(fmt.Sprintf("Has Products: %s", productsText)))

	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("Tab/Shift+Tab: navigate, Enter: apply, Esc: cancel"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryManagement) renderBulkOperationDialog() string {
	var lines []string
	lines = append(lines, styles.TitleStyle.Render("Bulk Operations"))
	lines = append(lines, fmt.Sprintf("%d categories selected", len(m.selectedCategories)))
	lines = append(lines, "")

	operations := []string{"Activate", "Deactivate", "Move", "Delete"}
	for i, op := range operations {
		style := styles.InputStyle
		if CategoryBulkOperation(i) == m.bulkOperation {
			style = styles.InputFocusedStyle
		}
		lines = append(lines, style.Render(op))
	}

	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("↑↓: select, Enter: confirm, Esc: cancel"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryManagement) renderDeleteConfirmation() string {
	if m.categoryToDelete == nil {
		return ""
	}

	var lines []string
	lines = append(lines, styles.WarningStyle.Render("Delete Category"))
	lines = append(lines, "")
	lines = append(lines, fmt.Sprintf("Are you sure you want to delete category:"))
	lines = append(lines, styles.InfoStyle.Render(m.categoryToDelete.Name))
	lines = append(lines, fmt.Sprintf("Path: %s", m.categoryToDelete.Path))
	
	productCount := m.productCounts[m.categoryToDelete.ID]
	if productCount > 0 {
		lines = append(lines, styles.ErrorStyle.Render(fmt.Sprintf("Warning: This category has %d products!", productCount)))
	}

	lines = append(lines, "")
	lines = append(lines, styles.HelpStyle.Render("y: confirm, n/Esc: cancel"))

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

func (m *CategoryManagement) renderHelp() string {
	basicHelp := []string{
		"Navigation: ↑↓/jk: move cursor, g/G: first/last, n/p: next/prev page",
		"Actions: Enter: select, d: delete, Space: toggle selection",
		"Filter: f: filter dialog, t: toggle table/hierarchy view",
		"Bulk: a: select all, A: deselect all, b: bulk operations",
		"Other: r: refresh, h/?: toggle help, H: expand help, q/Esc: quit",
	}

	var lines []string
	lines = append(lines, styles.TitleStyle.Render("Help"))
	
	if m.helpExpanded {
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Category Management Features:"))
		lines = append(lines, "• View categories in table or hierarchy mode")
		lines = append(lines, "• Filter by level, parent, search term, or product count")
		lines = append(lines, "• Multi-select categories for bulk operations")
		lines = append(lines, "• Create, edit, and delete categories (with permissions)")
		lines = append(lines, "• View category hierarchy with product counts")
		lines = append(lines, "• Move categories between parents")
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Keyboard Shortcuts:"))
		for _, help := range basicHelp {
			lines = append(lines, "• "+help)
		}
		lines = append(lines, "")
		lines = append(lines, styles.TitleStyle.Render("Bulk Operations:"))
		lines = append(lines, "• Activate/Deactivate multiple categories")
		lines = append(lines, "• Move categories to a new parent")
		lines = append(lines, "• Delete multiple categories (with confirmation)")
	} else {
		for _, help := range basicHelp {
			lines = append(lines, help)
		}
		lines = append(lines, styles.HelpStyle.Render("Press H for expanded help"))
	}

	return styles.CardStyle.Render(lipgloss.JoinVertical(lipgloss.Left, lines...))
}

// Helper methods

func (m *CategoryManagement) loadCategories() tea.Cmd {
	return func() tea.Msg {
		categories, err := m.hierarchySvc.ListCategories(context.Background(), 1000, 0)
		return CategoriesLoadedMsg{Categories: categories, Error: err}
	}
}

func (m *CategoryManagement) loadCategoryHierarchy() tea.Cmd {
	return func() tea.Msg {
		hierarchy, err := m.hierarchySvc.GetCategoryHierarchy(context.Background(), nil)
		return CategoryHierarchyLoadedMsg{Hierarchy: hierarchy, Error: err}
	}
}

func (m *CategoryManagement) loadProductCounts() tea.Cmd {
	return func() tea.Msg {
		// This would need to be implemented in the hierarchy service
		// For now, return mock data
		counts := make(map[uuid.UUID]int)
		return ProductCountsLoadedMsg{Counts: counts, Error: nil}
	}
}

func (m *CategoryManagement) deleteCategory(id uuid.UUID) tea.Cmd {
	return func() tea.Msg {
		err := m.hierarchySvc.DeleteCategory(context.Background(), id)
		return CategoryDeletedMsg{ID: id, Error: err}
	}
}

func (m *CategoryManagement) performBulkOperation() tea.Cmd {
	return func() tea.Msg {
		var affected int
		var err error

		switch m.bulkOperation {
		case BulkActivate, BulkDeactivate:
			// Would need to implement category activation/deactivation
			affected = len(m.selectedCategories)
		case BulkMove:
			// Would need to implement bulk move functionality
			affected = len(m.selectedCategories)
		case BulkDelete:
			for id := range m.selectedCategories {
				if deleteErr := m.hierarchySvc.DeleteCategory(context.Background(), id); deleteErr != nil {
					err = deleteErr
					break
				}
				affected++
			}
		}

		return BulkOperationCompletedMsg{
			Operation: m.bulkOperation,
			Affected:  affected,
			Error:     err,
		}
	}
}

func (m *CategoryManagement) applyFilter() {
	m.filteredCategories = nil

	for _, category := range m.categories {
		if m.matchesFilter(category) {
			m.filteredCategories = append(m.filteredCategories, category)
		}
	}

	m.totalItems = len(m.filteredCategories)
	m.totalPages = (m.totalItems + m.itemsPerPage - 1) / m.itemsPerPage
	if m.totalPages < 1 {
		m.totalPages = 1
	}

	m.adjustSelection()
}

func (m *CategoryManagement) matchesFilter(category *models.Category) bool {
	// Level filter
	if m.filter.Level >= 0 && category.Level != m.filter.Level {
		return false
	}

	// Search term
	if m.filter.SearchTerm != "" {
		term := strings.ToLower(m.filter.SearchTerm)
		if !strings.Contains(strings.ToLower(category.Name), term) &&
			!strings.Contains(strings.ToLower(category.Path), term) {
			return false
		}
	}

	// Has products filter
	if m.filter.HasProducts {
		productCount := m.productCounts[category.ID]
		if productCount == 0 {
			return false
		}
	}

	return true
}

func (m *CategoryManagement) adjustSelection() {
	if len(m.filteredCategories) == 0 {
		m.selectedIndex = 0
		return
	}

	if m.selectedIndex >= len(m.filteredCategories) {
		m.selectedIndex = len(m.filteredCategories) - 1
	}

	m.adjustScrollOffset()
}

func (m *CategoryManagement) adjustScrollOffset() {
	// Keep selected item visible
	if m.selectedIndex < m.scrollOffset {
		m.scrollOffset = m.selectedIndex
	} else if m.selectedIndex >= m.scrollOffset+m.itemsPerPage {
		m.scrollOffset = m.selectedIndex - m.itemsPerPage + 1
	}

	// Ensure scroll offset is within bounds
	maxOffset := len(m.filteredCategories) - m.itemsPerPage
	if maxOffset < 0 {
		maxOffset = 0
	}
	if m.scrollOffset > maxOffset {
		m.scrollOffset = maxOffset
	}
}

func (m *CategoryManagement) canDeleteCategory(category *models.Category) bool {
	// Check if category has products
	if m.productCounts[category.ID] > 0 {
		return false
	}

	// Check if category has children (would need to implement this check)
	// For now, assume it's allowed if no products
	return true
}

func (m *CategoryManagement) hasPermission(permission string) bool {
	// For now, return true - would need to implement permission checking
	// in the session manager or get user role from session
	return true
}

func (m *CategoryManagement) getDisplayModeName() string {
	if m.displayMode == CategoryTableMode {
		return "Table"
	}
	return "Hierarchy"
}

func (m *CategoryManagement) truncate(s string, length int) string {
	if len(s) <= length {
		return s
	}
	if length < 3 {
		return s[:length]
	}
	return s[:length-3] + "..."
}
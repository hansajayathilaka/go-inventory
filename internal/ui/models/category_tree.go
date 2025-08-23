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

type CategoryTreeState int

const (
	CategoryTreeLoadingState CategoryTreeState = iota
	CategoryTreeReadyState
	CategoryTreeSearchState
	CategoryTreeErrorState
)

type TreeNodeType int

const (
	TreeNodeCategory TreeNodeType = iota
	TreeNodeVirtual
)

type TreeNode struct {
	ID         uuid.UUID
	Name       string
	Path       string
	Level      int
	Type       TreeNodeType
	Category   *models.Category
	Children   []*TreeNode
	Parent     *TreeNode
	Expanded   bool
	ProductCount int
}

type CategoryTree struct {
	state           CategoryTreeState
	appCtx          *app.Context
	sessionMgr      *app.SessionManager
	currentUser     *models.User
	hierarchyService hierarchy.Service
	
	// Tree data
	rootNodes       []*TreeNode
	flattenedNodes  []*TreeNode
	selectedNode    *TreeNode
	selectedIndex   int
	
	// Navigation and display
	breadcrumbs     []*TreeNode
	scrollOffset    int
	viewportHeight  int
	
	// Search functionality
	searchQuery     string
	searchResults   []*TreeNode
	isSearchActive  bool
	
	// Selection mode (for product assignment)
	selectionMode   bool
	selectedForProduct *TreeNode
	
	// UI state
	errorMsg        string
	statusMsg       string
	
	// Tree display settings
	showProductCount bool
	maxDepth        int
}

type CategoryTreeMsg struct {
	Type string
	Data interface{}
}

type LoadCategoriesMsg struct {
	RootNodes []*TreeNode
}

type SearchResultsMsg struct {
	Results []*TreeNode
}

type CategorySelectedMsg struct {
	Category *models.Category
}

func NewCategoryTree(appCtx *app.Context, sessionMgr *app.SessionManager, user *models.User) *CategoryTree {
	return &CategoryTree{
		state:           CategoryTreeLoadingState,
		appCtx:          appCtx,
		sessionMgr:      sessionMgr,
		currentUser:     user,
		hierarchyService: appCtx.HierarchyService,
		viewportHeight:  20,
		showProductCount: true,
		maxDepth:        5,
		selectedIndex:   0,
	}
}

func (ct *CategoryTree) Init() tea.Cmd {
	return tea.Batch(
		ct.loadCategoriesCmd(),
		ct.updateStatusCmd("Loading category tree..."),
	)
}

func (ct *CategoryTree) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		ct.viewportHeight = msg.Height - 8 // Account for header, footer, status

	case tea.KeyMsg:
		return ct.handleKeyPress(msg)

	case LoadCategoriesMsg:
		ct.state = CategoryTreeReadyState
		ct.rootNodes = msg.RootNodes
		ct.rebuildFlattenedView()
		ct.statusMsg = fmt.Sprintf("Loaded %d categories", ct.countTotalNodes())
		return ct, nil

	case SearchResultsMsg:
		ct.searchResults = msg.Results
		ct.statusMsg = fmt.Sprintf("Found %d matches", len(msg.Results))
		return ct, nil

	case CategoryTreeMsg:
		switch msg.Type {
		case "error":
			ct.state = CategoryTreeErrorState
			ct.errorMsg = fmt.Sprintf("%v", msg.Data)
		case "status":
			ct.statusMsg = fmt.Sprintf("%v", msg.Data)
		}
		return ct, nil
	}

	return ct, nil
}

func (ct *CategoryTree) handleKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch ct.state {
	case CategoryTreeLoadingState:
		return ct, nil

	case CategoryTreeSearchState:
		return ct.handleSearchKeys(msg)

	case CategoryTreeReadyState:
		switch msg.String() {
		case "q", "ctrl+c":
			return ct, tea.Quit

		case "esc":
			if ct.selectionMode {
				ct.selectionMode = false
				ct.statusMsg = "Selection mode cancelled"
				return ct, nil
			}
			// Navigate back - for now just quit, proper navigation will be added later
			return ct, tea.Quit

		case "up", "k":
			if ct.selectedIndex > 0 {
				ct.selectedIndex--
				ct.updateSelectedNode()
				ct.adjustScroll()
			}

		case "down", "j":
			if ct.selectedIndex < len(ct.flattenedNodes)-1 {
				ct.selectedIndex++
				ct.updateSelectedNode()
				ct.adjustScroll()
			}

		case "left", "h":
			if ct.selectedNode != nil && ct.selectedNode.Expanded {
				ct.collapseNode(ct.selectedNode)
				ct.rebuildFlattenedView()
			} else if ct.selectedNode != nil && ct.selectedNode.Parent != nil {
				// Navigate to parent
				parentIndex := ct.findNodeIndex(ct.selectedNode.Parent)
				if parentIndex >= 0 {
					ct.selectedIndex = parentIndex
					ct.updateSelectedNode()
					ct.adjustScroll()
				}
			}

		case "right", "l":
			if ct.selectedNode != nil && !ct.selectedNode.Expanded && len(ct.selectedNode.Children) > 0 {
				ct.expandNode(ct.selectedNode)
				ct.rebuildFlattenedView()
			} else if ct.selectedNode != nil && ct.selectedNode.Expanded && len(ct.selectedNode.Children) > 0 {
				// Navigate to first child
				ct.selectedIndex++
				ct.updateSelectedNode()
				ct.adjustScroll()
			}

		case "enter", " ":
			if ct.selectedNode != nil {
				if ct.selectionMode {
					ct.selectedForProduct = ct.selectedNode
					return ct, tea.Sequence(
						ct.updateStatusCmd(fmt.Sprintf("Selected: %s", ct.selectedNode.Path)),
						func() tea.Msg {
							return CategorySelectedMsg{Category: ct.selectedNode.Category}
						},
					)
				}
				ct.toggleNode(ct.selectedNode)
				ct.rebuildFlattenedView()
			}

		case "/":
			ct.state = CategoryTreeSearchState
			ct.isSearchActive = true
			ct.searchQuery = ""
			ct.statusMsg = "Search categories (ESC to cancel):"
			return ct, nil

		case "s":
			ct.selectionMode = !ct.selectionMode
			if ct.selectionMode {
				ct.statusMsg = "Selection mode: Press ENTER to select a category"
			} else {
				ct.statusMsg = "Selection mode disabled"
			}

		case "e":
			if ct.selectedNode != nil && ct.selectedNode.Type == TreeNodeCategory {
				// Navigate to category edit form
				ct.statusMsg = "Category edit not implemented yet"
			}

		case "c":
			if ct.hasPermission("category:create") {
				// Navigate to create category form with current as parent
				ct.statusMsg = "Category creation not implemented yet"
			}

		case "r":
			return ct, ct.loadCategoriesCmd()

		case "?":
			ct.statusMsg = ct.getHelpText()
		}
	}

	return ct, nil
}

func (ct *CategoryTree) handleSearchKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		ct.state = CategoryTreeReadyState
		ct.isSearchActive = false
		ct.searchQuery = ""
		ct.searchResults = nil
		ct.statusMsg = "Search cancelled"
		return ct, nil

	case "enter":
		if len(ct.searchResults) > 0 {
			// Jump to first search result
			firstResult := ct.searchResults[0]
			ct.ensureNodeVisible(firstResult)
			ct.selectedNode = firstResult
			ct.selectedIndex = ct.findNodeIndex(firstResult)
			ct.state = CategoryTreeReadyState
			ct.isSearchActive = false
			ct.statusMsg = fmt.Sprintf("Jumped to: %s", firstResult.Path)
		}
		return ct, nil

	case "backspace":
		if len(ct.searchQuery) > 0 {
			ct.searchQuery = ct.searchQuery[:len(ct.searchQuery)-1]
			if len(ct.searchQuery) == 0 {
				ct.searchResults = nil
				ct.statusMsg = "Search categories:"
			} else {
				return ct, ct.searchCategoriesCmd(ct.searchQuery)
			}
		}

	default:
		if len(msg.String()) == 1 {
			ct.searchQuery += msg.String()
			return ct, ct.searchCategoriesCmd(ct.searchQuery)
		}
	}

	return ct, nil
}

func (ct *CategoryTree) View() string {
	switch ct.state {
	case CategoryTreeLoadingState:
		return ct.renderLoading()
	case CategoryTreeErrorState:
		return ct.renderError()
	default:
		return ct.renderTree()
	}
}

func (ct *CategoryTree) renderLoading() string {
	return lipgloss.NewStyle().
		Height(ct.viewportHeight).
		Align(lipgloss.Center, lipgloss.Center).
		Render("Loading category tree...")
}

func (ct *CategoryTree) renderError() string {
	content := fmt.Sprintf("Error loading categories:\n\n%s\n\nPress 'r' to retry or 'q' to quit", ct.errorMsg)
	return lipgloss.NewStyle().
		Height(ct.viewportHeight).
		Align(lipgloss.Center, lipgloss.Center).
		Render(content)
}

func (ct *CategoryTree) renderTree() string {
	var sections []string

	// Header
	header := ct.renderHeader()
	sections = append(sections, header)

	// Breadcrumbs
	if len(ct.breadcrumbs) > 0 {
		breadcrumbs := ct.renderBreadcrumbs()
		sections = append(sections, breadcrumbs)
	}

	// Search bar (if active)
	if ct.isSearchActive {
		searchBar := ct.renderSearchBar()
		sections = append(sections, searchBar)
	}

	// Tree view
	treeView := ct.renderTreeNodes()
	sections = append(sections, treeView)

	// Status bar
	statusBar := ct.renderStatusBar()
	sections = append(sections, statusBar)

	return strings.Join(sections, "\n")
}

func (ct *CategoryTree) renderHeader() string {
	title := "Category Tree"
	if ct.selectionMode {
		title += " (Selection Mode)"
	}
	
	return styles.HeaderStyle.Render(title)
}

func (ct *CategoryTree) renderBreadcrumbs() string {
	var parts []string
	for i, node := range ct.breadcrumbs {
		if i > 0 {
			parts = append(parts, " > ")
		}
		parts = append(parts, node.Name)
	}
	
	breadcrumbText := strings.Join(parts, "")
	return styles.BreadcrumbStyle.Render(breadcrumbText)
}

func (ct *CategoryTree) renderSearchBar() string {
	prompt := "Search: "
	query := ct.searchQuery + "█" // Cursor
	
	searchStyle := lipgloss.NewStyle().
		Foreground(styles.Primary).
		Bold(true)
	
	return searchStyle.Render(prompt + query)
}

func (ct *CategoryTree) renderTreeNodes() string {
	if len(ct.flattenedNodes) == 0 {
		emptyMsg := "No categories found"
		if ct.isSearchActive && len(ct.searchQuery) > 0 {
			emptyMsg = "No categories match your search"
		}
		return lipgloss.NewStyle().
			Height(ct.viewportHeight-4).
			Align(lipgloss.Center, lipgloss.Center).
			Foreground(styles.Subtle).
			Render(emptyMsg)
	}

	var lines []string
	
	startIdx := ct.scrollOffset
	endIdx := startIdx + ct.viewportHeight - 4
	if endIdx > len(ct.flattenedNodes) {
		endIdx = len(ct.flattenedNodes)
	}

	for i := startIdx; i < endIdx; i++ {
		node := ct.flattenedNodes[i]
		line := ct.renderTreeNode(node, i == ct.selectedIndex)
		lines = append(lines, line)
	}

	// Highlight search results
	if ct.isSearchActive && len(ct.searchResults) > 0 {
		lines = append(lines, "")
		lines = append(lines, styles.InfoStyle.Render(fmt.Sprintf("Search results: %d found", len(ct.searchResults))))
	}

	return strings.Join(lines, "\n")
}

func (ct *CategoryTree) renderTreeNode(node *TreeNode, isSelected bool) string {
	// Indentation based on level
	indent := strings.Repeat("  ", node.Level)
	
	// Tree connector
	connector := ""
	if node.Level > 0 {
		connector = "├─ "
		if ct.isLastChild(node) {
			connector = "└─ "
		}
	}
	
	// Expand/collapse indicator
	expandIcon := "  "
	if len(node.Children) > 0 {
		if node.Expanded {
			expandIcon = "▼ "
		} else {
			expandIcon = "▶ "
		}
	}
	
	// Node name and info
	nodeText := node.Name
	if ct.showProductCount && node.ProductCount > 0 {
		nodeText += fmt.Sprintf(" (%d)", node.ProductCount)
	}
	
	// Level indicator
	levelIndicator := ""
	if node.Level > 0 {
		levelIndicator = fmt.Sprintf("[L%d] ", node.Level)
	}
	
	fullText := indent + connector + expandIcon + levelIndicator + nodeText
	
	// Style based on selection and type
	style := styles.BaseStyle
	if isSelected {
		style = styles.MenuItemSelectedStyle
	}
	
	// Special styling for different levels
	switch node.Level {
	case 0:
		style = style.Bold(true).Foreground(styles.Primary)
	case 1:
		style = style.Foreground(styles.Secondary)
	default:
		style = style.Foreground(styles.Subtle)
	}
	
	if isSelected {
		style = styles.MenuItemSelectedStyle
	}
	
	return style.Render(fullText)
}

func (ct *CategoryTree) renderStatusBar() string {
	var parts []string
	
	if ct.statusMsg != "" {
		parts = append(parts, ct.statusMsg)
	} else {
		if ct.selectedNode != nil {
			parts = append(parts, fmt.Sprintf("Selected: %s", ct.selectedNode.Path))
		}
		parts = append(parts, fmt.Sprintf("Items: %d/%d", ct.selectedIndex+1, len(ct.flattenedNodes)))
	}
	
	statusText := strings.Join(parts, " | ")
	return styles.StatusBarStyle.Render(statusText)
}

// Helper functions
func (ct *CategoryTree) loadCategoriesCmd() tea.Cmd {
	return func() tea.Msg {
		hierarchy, err := ct.hierarchyService.GetCategoryHierarchy(context.Background(), nil)
		if err != nil {
			return CategoryTreeMsg{Type: "error", Data: err.Error()}
		}
		
		rootNodes := ct.buildTreeFromHierarchy(hierarchy)
		return LoadCategoriesMsg{RootNodes: rootNodes}
	}
}

func (ct *CategoryTree) searchCategoriesCmd(query string) tea.Cmd {
	return func() tea.Msg {
		results := ct.searchInTree(ct.rootNodes, strings.ToLower(query))
		return SearchResultsMsg{Results: results}
	}
}

func (ct *CategoryTree) updateStatusCmd(msg string) tea.Cmd {
	return func() tea.Msg {
		return CategoryTreeMsg{Type: "status", Data: msg}
	}
}

func (ct *CategoryTree) buildTreeFromHierarchy(hierarchy *hierarchy.CategoryNode) []*TreeNode {
	if hierarchy == nil || hierarchy.Category == nil {
		return []*TreeNode{}
	}

	// If it's a virtual root, return its children
	if hierarchy.Category.Level == -1 {
		var rootNodes []*TreeNode
		for _, child := range hierarchy.Children {
			if node := ct.buildSingleTreeNode(child, nil); node != nil {
				rootNodes = append(rootNodes, node)
			}
		}
		return rootNodes
	}

	// Single root node
	if node := ct.buildSingleTreeNode(hierarchy, nil); node != nil {
		return []*TreeNode{node}
	}

	return []*TreeNode{}
}

func (ct *CategoryTree) buildSingleTreeNode(hierarchy *hierarchy.CategoryNode, parent *TreeNode) *TreeNode {
	if hierarchy == nil || hierarchy.Category == nil {
		return nil
	}

	node := &TreeNode{
		ID:       hierarchy.Category.ID,
		Name:     hierarchy.Category.Name,
		Path:     hierarchy.Category.Path,
		Level:    hierarchy.Category.Level,
		Type:     TreeNodeCategory,
		Category: hierarchy.Category,
		Parent:   parent,
		Expanded: hierarchy.Category.Level < 2, // Auto-expand first 2 levels
		Children: []*TreeNode{},
	}

	// Build children
	for _, child := range hierarchy.Children {
		if childNode := ct.buildSingleTreeNode(child, node); childNode != nil {
			node.Children = append(node.Children, childNode)
		}
	}

	return node
}

func (ct *CategoryTree) rebuildFlattenedView() {
	ct.flattenedNodes = []*TreeNode{}
	for _, root := range ct.rootNodes {
		ct.flattenNode(root)
	}
	ct.updateSelectedNode()
}

func (ct *CategoryTree) flattenNode(node *TreeNode) {
	ct.flattenedNodes = append(ct.flattenedNodes, node)
	if node.Expanded {
		for _, child := range node.Children {
			ct.flattenNode(child)
		}
	}
}

func (ct *CategoryTree) updateSelectedNode() {
	if ct.selectedIndex >= 0 && ct.selectedIndex < len(ct.flattenedNodes) {
		ct.selectedNode = ct.flattenedNodes[ct.selectedIndex]
		ct.updateBreadcrumbs()
	}
}

func (ct *CategoryTree) updateBreadcrumbs() {
	if ct.selectedNode == nil {
		ct.breadcrumbs = []*TreeNode{}
		return
	}

	var crumbs []*TreeNode
	current := ct.selectedNode
	for current != nil {
		crumbs = append([]*TreeNode{current}, crumbs...)
		current = current.Parent
	}
	ct.breadcrumbs = crumbs
}

func (ct *CategoryTree) expandNode(node *TreeNode) {
	node.Expanded = true
}

func (ct *CategoryTree) collapseNode(node *TreeNode) {
	node.Expanded = false
}

func (ct *CategoryTree) toggleNode(node *TreeNode) {
	node.Expanded = !node.Expanded
}

func (ct *CategoryTree) findNodeIndex(target *TreeNode) int {
	for i, node := range ct.flattenedNodes {
		if node.ID == target.ID {
			return i
		}
	}
	return -1
}

func (ct *CategoryTree) adjustScroll() {
	if ct.selectedIndex < ct.scrollOffset {
		ct.scrollOffset = ct.selectedIndex
	} else if ct.selectedIndex >= ct.scrollOffset+ct.viewportHeight-4 {
		ct.scrollOffset = ct.selectedIndex - ct.viewportHeight + 5
	}
	
	if ct.scrollOffset < 0 {
		ct.scrollOffset = 0
	}
}

func (ct *CategoryTree) searchInTree(nodes []*TreeNode, query string) []*TreeNode {
	var results []*TreeNode
	for _, node := range nodes {
		if strings.Contains(strings.ToLower(node.Name), query) ||
		   strings.Contains(strings.ToLower(node.Path), query) {
			results = append(results, node)
		}
		// Recursively search children
		childResults := ct.searchInTree(node.Children, query)
		results = append(results, childResults...)
	}
	return results
}

func (ct *CategoryTree) ensureNodeVisible(node *TreeNode) {
	// Expand all parents to make node visible
	current := node.Parent
	for current != nil {
		current.Expanded = true
		current = current.Parent
	}
	ct.rebuildFlattenedView()
}

func (ct *CategoryTree) isLastChild(node *TreeNode) bool {
	if node.Parent == nil {
		return false
	}
	parent := node.Parent
	if len(parent.Children) == 0 {
		return false
	}
	return parent.Children[len(parent.Children)-1].ID == node.ID
}

func (ct *CategoryTree) countTotalNodes() int {
	count := 0
	var countNodes func([]*TreeNode)
	countNodes = func(nodes []*TreeNode) {
		for _, node := range nodes {
			count++
			countNodes(node.Children)
		}
	}
	countNodes(ct.rootNodes)
	return count
}

func (ct *CategoryTree) hasPermission(permission string) bool {
	if ct.currentUser == nil {
		return false
	}
	
	// Admin can do everything
	if ct.currentUser.Role == "admin" {
		return true
	}
	
	// Manager can create/edit categories
	if ct.currentUser.Role == "manager" && 
	   (permission == "category:create" || permission == "category:edit") {
		return true
	}
	
	// Staff can view categories
	if permission == "category:view" {
		return ct.currentUser.Role == "staff" || ct.currentUser.Role == "manager" || ct.currentUser.Role == "admin"
	}
	
	return false
}

func (ct *CategoryTree) getHelpText() string {
	help := []string{
		"Navigation: ↑/↓ or j/k to move, ←/→ or h/l to collapse/expand",
		"Actions: Enter/Space to toggle, / to search, s for selection mode",
		"Management: c to create, e to edit, r to refresh",
		"Other: ? for help, ESC to go back, q to quit",
	}
	return strings.Join(help, " | ")
}
package components

import (
	"strings"

	"github.com/charmbracelet/lipgloss/v2"
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/ui/styles"
)

type Layout struct {
	Title       string
	Breadcrumbs []string
	Content     tea.Model
	Help        string
	Width       int
	Height      int
}

type LayoutMsg struct {
	Width  int
	Height int
}

func NewLayout(title string, content tea.Model) Layout {
	return Layout{
		Title:   title,
		Content: content,
		Width:   80,
		Height:  24,
	}
}

func (l Layout) Init() tea.Cmd {
	if l.Content != nil {
		return l.Content.Init()
	}
	return nil
}

func (l Layout) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		l.Width = msg.Width
		l.Height = msg.Height
		
		if l.Content != nil {
			var cmd tea.Cmd
			l.Content, cmd = l.Content.Update(msg)
			return l, cmd
		}
		
	default:
		if l.Content != nil {
			var cmd tea.Cmd
			l.Content, cmd = l.Content.Update(msg)
			return l, cmd
		}
	}
	
	return l, nil
}

func (l Layout) View() string {
	if l.Width < 40 || l.Height < 10 {
		return "Terminal too small. Please resize."
	}

	// Calculate available space
	headerHeight := 3
	footerHeight := 3
	contentHeight := l.Height - headerHeight - footerHeight - 2 // -2 for borders

	// Header with application name
	header := l.renderHeader()
	
	// Navigation breadcrumbs
	nav := l.renderBreadcrumbs()
	
	// Content area
	content := l.renderContent(contentHeight)
	
	// Footer with instructions
	footer := l.renderFooter()

	// Main container with full screen border
	mainStyle := lipgloss.NewStyle().
		Width(l.Width - 2).
		Height(l.Height - 2).
		Border(lipgloss.DoubleBorder()).
		BorderForeground(styles.Primary)

	// Combine all sections
	fullContent := lipgloss.JoinVertical(lipgloss.Left,
		header,
		nav,
		content,
		footer,
	)

	return mainStyle.Render(fullContent)
}

func (l Layout) renderHeader() string {
	appName := "📦 TUI INVENTORY MANAGEMENT SYSTEM"
	
	headerStyle := lipgloss.NewStyle().
		Width(l.Width - 4).
		Align(lipgloss.Center).
		Bold(true).
		Foreground(lipgloss.Color("#ffffff")).
		Background(styles.Primary).
		Padding(0, 1).
		MarginBottom(1)

	return headerStyle.Render(appName)
}

func (l Layout) renderBreadcrumbs() string {
	if len(l.Breadcrumbs) == 0 {
		l.Breadcrumbs = []string{"Home"}
	}
	
	breadcrumbText := strings.Join(l.Breadcrumbs, " > ")
	
	breadcrumbStyle := lipgloss.NewStyle().
		Width(l.Width - 4).
		Foreground(styles.Subtle).
		Padding(0, 1).
		MarginBottom(1)

	return breadcrumbStyle.Render("📍 " + breadcrumbText)
}

func (l Layout) renderContent(height int) string {
	contentStyle := lipgloss.NewStyle().
		Width(l.Width - 4).
		Height(height).
		Padding(1)

	if l.Content != nil {
		contentView := ""
		if viewer, ok := l.Content.(interface{ View() string }); ok {
			contentView = viewer.View()
		}
		return contentStyle.Render(contentView)
	}
	
	return contentStyle.Render("No content available")
}

func (l Layout) renderFooter() string {
	defaultHelp := "↑/↓: Navigate • Enter: Select • Esc: Back • q: Quit • Ctrl+C: Exit"
	helpText := l.Help
	if helpText == "" {
		helpText = defaultHelp
	}

	footerStyle := lipgloss.NewStyle().
		Width(l.Width - 4).
		Align(lipgloss.Center).
		Foreground(lipgloss.Color("#ffffff")).
		Background(styles.Dark).
		Padding(0, 1).
		MarginTop(1)

	return footerStyle.Render("💡 " + helpText)
}

func (l Layout) WithBreadcrumbs(breadcrumbs []string) Layout {
	l.Breadcrumbs = breadcrumbs
	return l
}

func (l Layout) WithContent(content tea.Model) Layout {
	l.Content = content
	return l
}

func (l Layout) WithHelp(help string) Layout {
	l.Help = help
	return l
}
package components

import (
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
	if l.Width < 20 || l.Height < 5 {
		return "Terminal too small"
	}

	// Calculate available space for full screen
	headerHeight := 1
	footerHeight := 1
	contentHeight := l.Height - headerHeight - footerHeight - 1

	// Header 
	header := l.renderHeader()
	
	// Content area takes most space
	content := l.renderContent(contentHeight)
	
	// Footer 
	footer := l.renderFooter()

	// Full screen layout
	fullContent := lipgloss.JoinVertical(lipgloss.Left,
		header,
		content,
		footer,
	)

	return fullContent
}

func (l Layout) renderHeader() string {
	appName := "TUI INVENTORY MANAGEMENT SYSTEM"
	
	headerStyle := lipgloss.NewStyle().
		Width(l.Width).
		Align(lipgloss.Center).
		Bold(true).
		Foreground(lipgloss.Color("#ffffff")).
		Background(styles.Primary)

	return headerStyle.Render(appName)
}


func (l Layout) renderContent(height int) string {
	contentStyle := lipgloss.NewStyle().
		Width(l.Width).
		Height(height)

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
		Width(l.Width).
		Align(lipgloss.Center).
		Foreground(lipgloss.Color("#ffffff")).
		Background(styles.Dark)

	return footerStyle.Render(helpText)
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
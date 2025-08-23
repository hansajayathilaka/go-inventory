package components

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss/v2"
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/ui/styles"
)

type MenuItem struct {
	Label       string
	Description string
	Action      string
	Disabled    bool
}

type Menu struct {
	Title     string
	Items     []MenuItem
	Selected  int
	Width     int
	Height    int
	ShowHelp  bool
}

type MenuMsg struct {
	Action string
	Item   MenuItem
}

func NewMenu(title string, items []MenuItem) Menu {
	return Menu{
		Title:    title,
		Items:    items,
		Selected: 0,
		Width:    60,
		Height:   len(items) + 5,
		ShowHelp: false,
	}
}

func (m Menu) Init() tea.Cmd {
	return nil
}

func (m Menu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			if m.Selected > 0 {
				m.Selected--
			}
		case "down", "j":
			if m.Selected < len(m.Items)-1 {
				m.Selected++
			}
		case "enter", " ":
			if m.Selected < len(m.Items) && !m.Items[m.Selected].Disabled {
				return m, func() tea.Msg {
					return MenuMsg{
						Action: m.Items[m.Selected].Action,
						Item:   m.Items[m.Selected],
					}
				}
			}
		}
	}
	return m, nil
}

func (m Menu) View() string {
	var content strings.Builder
	
	// Enhanced menu styling
	menuStyle := lipgloss.NewStyle().
		Width(m.Width).
		Padding(2, 3).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.Primary).
		Align(lipgloss.Center)
	
	if m.Title != "" {
		titleStyle := lipgloss.NewStyle().
			Bold(true).
			Foreground(styles.Primary).
			Align(lipgloss.Center).
			Width(m.Width - 6).
			MarginBottom(2)
		content.WriteString(titleStyle.Render("🏠 " + m.Title))
		content.WriteString("\n")
	}
	
	for i, item := range m.Items {
		itemStyle := lipgloss.NewStyle().
			Width(m.Width - 6).
			Padding(0, 2).
			MarginBottom(1)
		
		if item.Disabled {
			itemStyle = itemStyle.
				Foreground(styles.Subtle).
				Strikethrough(true)
			content.WriteString(itemStyle.Render(fmt.Sprintf("  🚫 %s", item.Label)))
		} else if i == m.Selected {
			itemStyle = itemStyle.
				Background(styles.Primary).
				Foreground(lipgloss.Color("#ffffff")).
				Bold(true).
				Border(lipgloss.RoundedBorder()).
				BorderForeground(styles.Primary)
			content.WriteString(itemStyle.Render(fmt.Sprintf("👉 %s", item.Label)))
		} else {
			itemStyle = itemStyle.
				Foreground(styles.Dark)
			content.WriteString(itemStyle.Render(fmt.Sprintf("   %s", item.Label)))
		}
		
		if item.Description != "" && i == m.Selected {
			content.WriteString("\n")
			descStyle := lipgloss.NewStyle().
				Width(m.Width - 6).
				Foreground(styles.Subtle).
				Italic(true).
				Align(lipgloss.Center).
				Padding(0, 2)
			content.WriteString(descStyle.Render("💭 " + item.Description))
		}
		content.WriteString("\n")
	}
	
	if m.ShowHelp {
		helpStyle := lipgloss.NewStyle().
			Width(m.Width - 6).
			Align(lipgloss.Center).
			Foreground(styles.Subtle).
			Italic(true).
			MarginTop(2)
		help := helpStyle.Render("⌨️  Use ↑/↓ to navigate • Enter to select")
		content.WriteString(help)
	}
	
	return menuStyle.Render(content.String())
}
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
		Width:    80,
		Height:   len(items) + 5,
		ShowHelp: false,
	}
}

func (m Menu) Init() tea.Cmd {
	return nil
}

func (m Menu) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height
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
		case "enter":
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
	
	if m.Title != "" {
		titleStyle := lipgloss.NewStyle().
			Bold(true).
			Foreground(styles.Primary).
			Align(lipgloss.Center).
			Width(m.Width).
			MarginBottom(1)
		content.WriteString(titleStyle.Render(m.Title))
		content.WriteString("\n")
	}
	
	for i, item := range m.Items {
		if item.Disabled {
			itemStyle := lipgloss.NewStyle().
				Width(m.Width).
				Foreground(styles.Subtle)
			content.WriteString(itemStyle.Render(fmt.Sprintf("  %s (disabled)", item.Label)))
		} else if i == m.Selected {
			itemStyle := lipgloss.NewStyle().
				Width(m.Width).
				Background(styles.Primary).
				Foreground(lipgloss.Color("#ffffff"))
			content.WriteString(itemStyle.Render(fmt.Sprintf("> %s", item.Label)))
		} else {
			itemStyle := lipgloss.NewStyle().
				Width(m.Width).
				Foreground(styles.Dark)
			content.WriteString(itemStyle.Render(fmt.Sprintf("  %s", item.Label)))
		}
		
		if item.Description != "" && i == m.Selected {
			content.WriteString("\n")
			descStyle := lipgloss.NewStyle().
				Width(m.Width).
				Foreground(styles.Subtle).
				Align(lipgloss.Center)
			content.WriteString(descStyle.Render(item.Description))
		}
		content.WriteString("\n")
	}
	
	if m.ShowHelp {
		content.WriteString("\n")
		helpStyle := lipgloss.NewStyle().
			Width(m.Width).
			Align(lipgloss.Center).
			Foreground(styles.Subtle)
		help := helpStyle.Render("Use ↑/↓ to navigate • Enter to select")
		content.WriteString(help)
	}
	
	return content.String()
}
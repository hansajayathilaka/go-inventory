package styles

import (
	"github.com/charmbracelet/lipgloss/v2"
)

var (
	// Enhanced color palette for better visual appeal
	Primary     = lipgloss.Color("#2563eb")  // Modern blue
	Secondary   = lipgloss.Color("#64748b")  // Slate
	Success     = lipgloss.Color("#16a34a")  // Green
	Warning     = lipgloss.Color("#ca8a04")  // Amber
	Danger      = lipgloss.Color("#dc2626")  // Red
	Info        = lipgloss.Color("#0ea5e9")  // Sky blue
	Light       = lipgloss.Color("#f8fafc")  // Slate 50
	Dark        = lipgloss.Color("#1e293b")  // Slate 800
	
	Background  = lipgloss.Color("#ffffff")
	Foreground  = lipgloss.Color("#0f172a")  // Slate 900
	Border      = lipgloss.Color("#e2e8f0")  // Slate 200
	Subtle      = lipgloss.Color("#64748b")  // Slate 500
	Accent      = lipgloss.Color("#8b5cf6")  // Violet
)

var (
	// Enhanced base styles
	BaseStyle = lipgloss.NewStyle().
		Padding(1, 2).
		Foreground(Foreground)
	
	TitleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(Primary).
		Padding(0, 1).
		MarginBottom(1).
		Align(lipgloss.Center)
	
	HeaderStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(Light).
		Background(Primary).
		Padding(1, 2).
		MarginBottom(1).
		Align(lipgloss.Center).
		Border(lipgloss.DoubleBorder()).
		BorderForeground(Primary)
	
	MenuStyle = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(Primary).
		Padding(2, 3).
		Background(Light).
		Align(lipgloss.Center)
	
	MenuItemStyle = lipgloss.NewStyle().
		Padding(0, 2)
	
	MenuItemSelectedStyle = MenuItemStyle.Copy().
		Background(Primary).
		Foreground(Light).
		Bold(true).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(Primary)
	
	InputStyle = lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(Border).
		Padding(0, 1)
	
	InputFocusedStyle = InputStyle.Copy().
		BorderForeground(Primary)
	
	ButtonStyle = lipgloss.NewStyle().
		Background(Primary).
		Foreground(Light).
		Padding(0, 2).
		Bold(true).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(Primary)
	
	ButtonSelectedStyle = ButtonStyle.Copy().
		Background(Dark).
		BorderForeground(Dark)
	
	TableHeaderStyle = lipgloss.NewStyle().
		Bold(true).
		Background(Light).
		Foreground(Dark).
		Padding(0, 1).
		Border(lipgloss.NormalBorder()).
		BorderForeground(Border)
	
	TableCellStyle = lipgloss.NewStyle().
		Padding(0, 1).
		Border(lipgloss.NormalBorder()).
		BorderForeground(Border)
	
	TableSelectedRowStyle = TableCellStyle.Copy().
		Background(Primary).
		Foreground(Light)
	
	StatusBarStyle = lipgloss.NewStyle().
		Background(Dark).
		Foreground(Light).
		Padding(0, 1)
	
	ErrorStyle = lipgloss.NewStyle().
		Foreground(Danger).
		Bold(true)
	
	SuccessStyle = lipgloss.NewStyle().
		Foreground(Success).
		Bold(true)
	
	WarningStyle = lipgloss.NewStyle().
		Foreground(Warning).
		Bold(true)
	
	InfoStyle = lipgloss.NewStyle().
		Foreground(Info).
		Bold(true)
	
	HelpStyle = lipgloss.NewStyle().
		Foreground(Subtle).
		Italic(true)
	
	BreadcrumbStyle = lipgloss.NewStyle().
		Foreground(Subtle).
		Padding(0, 1).
		Italic(true)
	
	// New enhanced styles
	CardStyle = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(Border).
		Padding(2).
		Background(Light).
		Margin(1)
	
	LayoutStyle = lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(Primary)
	
	FooterStyle = lipgloss.NewStyle().
		Background(Dark).
		Foreground(Light).
		Padding(0, 2).
		Align(lipgloss.Center).
		Bold(true)
)
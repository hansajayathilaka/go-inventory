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
	// Clean minimal styles
	BaseStyle = lipgloss.NewStyle().
		Foreground(Foreground)
	
	TitleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(Primary)
	
	HeaderStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(Light).
		Background(Primary).
		Padding(0, 1)
	
	MenuStyle = lipgloss.NewStyle()
	
	MenuItemStyle = lipgloss.NewStyle().
		Padding(0, 1)
	
	MenuItemSelectedStyle = lipgloss.NewStyle().
		Padding(0, 1).
		Background(Primary).
		Foreground(Light)
	
	InputStyle = lipgloss.NewStyle().
		Padding(0, 1)
	
	InputFocusedStyle = lipgloss.NewStyle().
		Padding(0, 1).
		Foreground(Primary)
	
	ButtonStyle = lipgloss.NewStyle().
		Background(Primary).
		Foreground(Light).
		Padding(0, 2)
	
	ButtonSelectedStyle = lipgloss.NewStyle().
		Background(Dark).
		Foreground(Light).
		Padding(0, 2)
	
	TableHeaderStyle = lipgloss.NewStyle().
		Bold(true).
		Background(Light).
		Foreground(Dark).
		Padding(0, 1)
	
	TableCellStyle = lipgloss.NewStyle().
		Padding(0, 1)
	
	TableSelectedRowStyle = lipgloss.NewStyle().
		Padding(0, 1).
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
		Foreground(Subtle)
	
	BreadcrumbStyle = lipgloss.NewStyle().
		Foreground(Subtle).
		Padding(0, 1)
	
	// Clean card and layout styles
	CardStyle = lipgloss.NewStyle().
		Padding(1)
	
	LayoutStyle = lipgloss.NewStyle()
	
	FooterStyle = lipgloss.NewStyle().
		Background(Dark).
		Foreground(Light).
		Padding(0, 1)
)
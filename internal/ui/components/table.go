package components

import (
	"fmt"

	"github.com/charmbracelet/bubbles/v2/table"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"tui-inventory/internal/ui/styles"
)

// Wrapper around Bubbles v2 table for compatibility with existing code
type Column struct {
	Header string
	Width  int
	Flex   bool
}

type Row []string

type Table struct {
	Title       string
	Columns     []Column
	Rows        []Row
	Selected    int
	Width       int
	Height      int
	ShowHeader  bool
	bubblesTable table.Model // Official Bubbles v2 table
}

type TableMsg struct {
	Action string
	Row    Row
	Index  int
}

func NewTable(title string, columns []Column) Table {
	// Convert our columns to Bubbles table columns
	bubblesColumns := make([]table.Column, len(columns))
	for i, col := range columns {
		width := col.Width
		if width <= 0 {
			width = 10
		}
		bubblesColumns[i] = table.Column{
			Title: col.Header,
			Width: width,
		}
	}
	
	// Create Bubbles table with custom styles
	bubblesTable := table.New(
		table.WithColumns(bubblesColumns),
		table.WithFocused(true),
		table.WithHeight(10),
	)
	
	// Apply our custom clean styles
	s := table.DefaultStyles()
	s.Header = s.Header.
		Bold(true).
		Background(styles.Primary).
		Foreground(lipgloss.Color("#ffffff")).
		Padding(0, 1)
	s.Selected = s.Selected.
		Foreground(lipgloss.Color("#ffffff")).
		Background(styles.Primary).
		Bold(true)
	s.Cell = s.Cell.
		Padding(0, 1)
	bubblesTable.SetStyles(s)
	
	return Table{
		Title:        title,
		Columns:      columns,
		Rows:         []Row{},
		Selected:     0,
		Width:        80,
		Height:       20,
		ShowHeader:   true,
		bubblesTable: bubblesTable,
	}
}

func (t *Table) SetRows(rows []Row) {
	t.Rows = rows
	
	// Convert rows to Bubbles table format
	bubblesRows := make([]table.Row, len(rows))
	for i, row := range rows {
		bubblesRow := make(table.Row, len(row))
		copy(bubblesRow, row)
		bubblesRows[i] = bubblesRow
	}
	
	// Update the Bubbles table
	t.bubblesTable.SetRows(bubblesRows)
	
	// Reset selection
	if t.Selected >= len(t.Rows) {
		t.Selected = len(t.Rows) - 1
	}
	if t.Selected < 0 {
		t.Selected = 0
	}
}

func (t *Table) SetSize(width, height int) {
	t.Width = width
	t.Height = height
	
	// Update Bubbles table height
	tableHeight := height - 6 // Account for title, header, help, etc.
	if tableHeight < 3 {
		tableHeight = 3
	}
	t.bubblesTable.SetHeight(tableHeight)
}

func (t *Table) GetSelectedRow() (Row, int) {
	if t.Selected >= 0 && t.Selected < len(t.Rows) {
		return t.Rows[t.Selected], t.Selected
	}
	return Row{}, -1
}

func (t Table) Init() tea.Cmd {
	// Bubbles table doesn't need special initialization
	return nil
}

func (t Table) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	
	// Handle selection before delegating to Bubbles
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		t.SetSize(msg.Width, msg.Height)
	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			cursor := t.bubblesTable.Cursor()
			if cursor >= 0 && cursor < len(t.Rows) {
				t.Selected = cursor
				return t, func() tea.Msg {
					return TableMsg{
						Action: "select",
						Row:    t.Rows[cursor],
						Index:  cursor,
					}
				}
			}
		}
	}
	
	// Delegate to Bubbles table for navigation
	t.bubblesTable, cmd = t.bubblesTable.Update(msg)
	
	// Sync our selection with Bubbles cursor
	t.Selected = t.bubblesTable.Cursor()
	
	return t, cmd
}

func (t Table) View() string {
	var content string
	
	// Add title if present
	if t.Title != "" {
		content = styles.TitleStyle.Render(t.Title) + "\n"
	}
	
	// Add selection indicator
	if len(t.Rows) > 0 && t.Selected >= 0 && t.Selected < len(t.Rows) {
		content += styles.HelpStyle.Render(fmt.Sprintf("Row %d of %d selected", t.Selected+1, len(t.Rows))) + "\n"
	}
	
	// Add the Bubbles table view
	content += t.bubblesTable.View()
	
	// Add help text
	content += "\n" + styles.HelpStyle.Render("↑/↓: Navigate • Enter: Select • q: Back")
	
	return content
}
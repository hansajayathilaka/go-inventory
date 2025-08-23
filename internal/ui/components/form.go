package components

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
	"tui-inventory/internal/ui/styles"
)

type InputType int

const (
	TextInput InputType = iota
	NumberInput
	PasswordInput
	SelectInput
)

type Field struct {
	Label       string
	Key         string
	Type        InputType
	Value       string
	Options     []string
	Required    bool
	Placeholder string
	Error       string
}

type FormLayout int

const (
	VerticalLayout FormLayout = iota
	CompactLayout
	TwoColumnLayout
)

type Form struct {
	Title    string
	Fields   []Field
	Focused  int
	Width    int
	Height   int
	Values   map[string]string
	Layout   FormLayout
	MaxHeight int
}

type FormMsg struct {
	Action string
	Values map[string]string
}

func NewForm(title string, fields []Field) Form {
	values := make(map[string]string)
	for _, field := range fields {
		values[field.Key] = field.Value
	}
	
	return Form{
		Title:     title,
		Fields:    fields,
		Focused:   0,
		Width:     80,
		Height:    calculateFormHeight(len(fields), CompactLayout),
		Values:    values,
		Layout:    CompactLayout,
		MaxHeight: 20,
	}
}

func NewFormWithLayout(title string, fields []Field, layout FormLayout) Form {
	form := NewForm(title, fields)
	form.Layout = layout
	form.Height = calculateFormHeight(len(fields), layout)
	return form
}

func calculateFormHeight(fieldCount int, layout FormLayout) int {
	switch layout {
	case CompactLayout:
		return fieldCount + 8  // More compact
	case TwoColumnLayout:
		return (fieldCount+1)/2 + 8  // Half height for two columns
	default: // VerticalLayout
		return fieldCount*3 + 5  // Original spacing
	}
}

func (f Form) Init() tea.Cmd {
	return nil
}

func (f Form) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "shift+tab":
			if f.Focused > 0 {
				f.Focused--
			}
		case "down", "tab":
			if f.Focused < len(f.Fields)-1 {
				f.Focused++
			}
		case "enter":
			return f, func() tea.Msg {
				return FormMsg{
					Action: "submit",
					Values: f.Values,
				}
			}
		case "esc":
			return f, func() tea.Msg {
				return FormMsg{
					Action: "cancel",
					Values: f.Values,
				}
			}
		case "backspace":
			if f.Focused < len(f.Fields) {
				field := &f.Fields[f.Focused]
				if len(f.Values[field.Key]) > 0 {
					f.Values[field.Key] = f.Values[field.Key][:len(f.Values[field.Key])-1]
				}
			}
		default:
			if f.Focused < len(f.Fields) {
				field := &f.Fields[f.Focused]
				if field.Type == TextInput || field.Type == NumberInput || field.Type == PasswordInput {
					if len(msg.String()) == 1 {
						f.Values[field.Key] += msg.String()
					}
				}
			}
		}
	}
	return f, nil
}

func (f Form) View() string {
	switch f.Layout {
	case CompactLayout:
		return f.renderCompactLayout()
	case TwoColumnLayout:
		return f.renderTwoColumnLayout()
	default:
		return f.renderVerticalLayout()
	}
}

func (f Form) renderCompactLayout() string {
	var content strings.Builder
	
	if f.Title != "" {
		content.WriteString(styles.TitleStyle.Render(f.Title))
		content.WriteString("\n")
	}
	
	for i, field := range f.Fields {
		// Create compact field row: "Label: [Input]" format
		label := field.Label
		if field.Required {
			label += " *"
		}
		
		value := f.getDisplayValue(field)
		
		var inputStyle lipgloss.Style
		if i == f.Focused {
			inputStyle = styles.InputFocusedStyle
		} else {
			inputStyle = styles.InputStyle
		}
		
		// Limit label width and input width for compact display
		labelWidth := 20
		inputWidth := f.Width - labelWidth - 4
		
		labelStr := lipgloss.NewStyle().Width(labelWidth).Align(lipgloss.Right).
			Bold(i == f.Focused).Render(label + ":")
		
		var inputStr string
		switch field.Type {
		case SelectInput:
			selectedOption := f.getSelectDisplay(field, value)
			inputStr = inputStyle.Copy().Width(inputWidth).Render(selectedOption)
		default:
			inputStr = inputStyle.Copy().Width(inputWidth).Render(value)
		}
		
		content.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, labelStr, " ", inputStr))
		
		if field.Error != "" {
			content.WriteString("\n")
			content.WriteString(strings.Repeat(" ", labelWidth+1))
			content.WriteString(styles.ErrorStyle.Render(field.Error))
		}
		
		content.WriteString("\n")
	}
	
	content.WriteString(f.renderFooter())
	return styles.BaseStyle.Render(content.String())
}

func (f Form) renderTwoColumnLayout() string {
	var content strings.Builder
	
	if f.Title != "" {
		content.WriteString(styles.TitleStyle.Render(f.Title))
		content.WriteString("\n")
	}
	
	colWidth := (f.Width - 4) / 2
	
	for i := 0; i < len(f.Fields); i += 2 {
		leftField := f.Fields[i]
		var rightField *Field
		if i+1 < len(f.Fields) {
			rightField = &f.Fields[i+1]
		}
		
		leftCol := f.renderFieldCompact(leftField, i, colWidth)
		rightCol := ""
		if rightField != nil {
			rightCol = f.renderFieldCompact(*rightField, i+1, colWidth)
		}
		
		content.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, leftCol, "  ", rightCol))
		content.WriteString("\n")
	}
	
	content.WriteString(f.renderFooter())
	return styles.BaseStyle.Render(content.String())
}

func (f Form) renderVerticalLayout() string {
	var content strings.Builder
	
	if f.Title != "" {
		content.WriteString(styles.TitleStyle.Render(f.Title))
		content.WriteString("\n\n")
	}
	
	for i, field := range f.Fields {
		content.WriteString(styles.BaseStyle.Copy().Bold(true).Render(field.Label))
		if field.Required {
			content.WriteString(styles.ErrorStyle.Render(" *"))
		}
		content.WriteString("\n")
		
		value := f.getDisplayValue(field)
		
		var inputStyle lipgloss.Style
		if i == f.Focused {
			inputStyle = styles.InputFocusedStyle
		} else {
			inputStyle = styles.InputStyle
		}
		
		switch field.Type {
		case SelectInput:
			selectedOption := f.getSelectDisplay(field, value)
			content.WriteString(inputStyle.Copy().Width(f.Width-4).Render(selectedOption))
		default:
			content.WriteString(inputStyle.Copy().Width(f.Width-4).Render(value))
		}
		
		if field.Error != "" {
			content.WriteString("\n")
			content.WriteString(styles.ErrorStyle.Render(field.Error))
		}
		
		content.WriteString("\n\n")
	}
	
	content.WriteString(f.renderFooter())
	return styles.BaseStyle.Render(content.String())
}

func (f Form) renderFieldCompact(field Field, index int, width int) string {
	var content strings.Builder
	
	label := field.Label
	if field.Required {
		label += " *"
	}
	
	content.WriteString(lipgloss.NewStyle().Bold(index == f.Focused).Width(width).Render(label))
	content.WriteString("\n")
	
	value := f.getDisplayValue(field)
	
	var inputStyle lipgloss.Style
	if index == f.Focused {
		inputStyle = styles.InputFocusedStyle
	} else {
		inputStyle = styles.InputStyle
	}
	
	switch field.Type {
	case SelectInput:
		selectedOption := f.getSelectDisplay(field, value)
		content.WriteString(inputStyle.Copy().Width(width).Render(selectedOption))
	default:
		content.WriteString(inputStyle.Copy().Width(width).Render(value))
	}
	
	if field.Error != "" {
		content.WriteString("\n")
		content.WriteString(styles.ErrorStyle.Copy().Width(width).Render(field.Error))
	}
	
	return content.String()
}

func (f Form) getDisplayValue(field Field) string {
	value := f.Values[field.Key]
	displayValue := value
	
	if field.Type == PasswordInput && value != "" {
		displayValue = strings.Repeat("*", len(value))
	}
	
	if value == "" && field.Placeholder != "" {
		displayValue = field.Placeholder
	}
	
	return displayValue
}

func (f Form) getSelectDisplay(field Field, value string) string {
	if len(field.Options) > 0 {
		selectedOption := "Select..."
		if value != "" {
			for _, option := range field.Options {
				if option == value {
					selectedOption = option
					break
				}
			}
		}
		return selectedOption
	}
	return value
}

func (f Form) renderFooter() string {
	var content strings.Builder
	
	content.WriteString("\n")
	buttons := lipgloss.JoinHorizontal(lipgloss.Left,
		styles.ButtonStyle.Render("Submit (Enter)"),
		"  ",
		styles.ButtonStyle.Background(styles.Secondary).Render("Cancel (Esc)"),
	)
	content.WriteString(buttons)
	content.WriteString("\n\n")
	
	// Enhanced help text based on layout
	var helpText string
	switch f.Layout {
	case CompactLayout:
		helpText = "Tab/↑↓: Navigate • Enter: Submit • Esc: Cancel • Compact Layout"
	case TwoColumnLayout:
		helpText = "Tab/↑↓: Navigate • Enter: Submit • Esc: Cancel • Two-Column Layout"
	default:
		helpText = "Tab/↑↓: Navigate • Enter: Submit • Esc: Cancel • Standard Layout"
	}
	
	help := styles.HelpStyle.Render(helpText)
	content.WriteString(help)
	
	return content.String()
}
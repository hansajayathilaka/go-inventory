package models

import (
	tea "github.com/charmbracelet/bubbletea/v2"
	"tui-inventory/internal/app"
)

type PlaceholderModel struct {
	title string
}

func NewPlaceholder(title string) PlaceholderModel {
	return PlaceholderModel{title: title}
}

func (m PlaceholderModel) Init() tea.Cmd {
	return nil
}

func (m PlaceholderModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc":
			return NewMainMenu(), nil
		}
	}
	return m, nil
}

func (m PlaceholderModel) View() string {
	return m.title + "\n\n(Under Construction)\n\nPress 'q' or 'esc' to go back"
}

func NewUserMenu() tea.Model                { return NewUserManagementMenuWithContext(nil) }
func NewReportMenu() tea.Model              { return NewPlaceholder("Reports") }
func NewSettingsMenu() tea.Model            { return NewPlaceholder("Settings") }
func NewProductList() tea.Model             { return NewPlaceholder("Product List") }
func NewProductForm() tea.Model             { return NewPlaceholder("Add Product") }
func NewCategoryMenu() tea.Model            { return NewPlaceholder("Category Management") }
func NewSupplierMenu() tea.Model            { return NewPlaceholder("Supplier Management") }
func NewStockTransferFormWithContext(appCtx *app.Context) tea.Model { return NewPlaceholder("Stock Transfer") }
func NewLowStockListWithContext(appCtx *app.Context) tea.Model      { return NewPlaceholder("Low Stock Alert") }
func NewLocationMenuWithContext(appCtx *app.Context) tea.Model       { return NewPlaceholder("Location Management") }
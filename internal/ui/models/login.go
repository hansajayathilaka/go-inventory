package models

import (
	"context"
	"fmt"
	"strings"
	"time"

	"tui-inventory/internal/app"
	"tui-inventory/internal/repository/models"
	"tui-inventory/internal/ui/components"
	"tui-inventory/internal/ui/styles"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/lipgloss/v2"
)

type LoginState int

const (
	LoginFormState LoginState = iota
	LoadingState
	LoginSuccessState
	SessionTimeoutState
)

type LoginForm struct {
	state          LoginState
	form           components.Form
	appCtx         *app.Context
	sessionMgr     *app.SessionManager
	errorMsg       string
	successMsg     string
	loading        bool
	remembeMe      bool
	sessionID      string
	loginTime      time.Time
	lastActivity   time.Time
	user           *models.User
	timeoutWarning bool
	attempts       int
	maxAttempts    int
}

type LoginSuccessMsg struct {
	User      *models.User
	SessionID string
}

type SessionTimeoutMsg struct{}

type LoginFailedMsg struct {
	Error string
}

func NewLoginForm() LoginForm {
	return NewLoginFormWithContext(nil)
}

func NewLoginFormWithContext(appCtx *app.Context) LoginForm {
	fields := []components.Field{
		{
			Label:       "Username",
			Key:         "username",
			Type:        components.TextInput,
			Required:    true,
			Placeholder: "Enter your username",
		},
		{
			Label:       "Password",
			Key:         "password",
			Type:        components.PasswordInput,
			Required:    true,
			Placeholder: "Enter your password",
		},
	}

	form := components.NewFormWithLayout("System Login", fields, components.CompactLayout)

	var sessionMgr *app.SessionManager
	if appCtx != nil {
		sessionMgr = app.NewSessionManager(appCtx)
	}

	return LoginForm{
		state:       LoginFormState,
		form:        form,
		appCtx:      appCtx,
		sessionMgr:  sessionMgr,
		attempts:    0,
		maxAttempts: 3,
	}
}

func (l LoginForm) Init() tea.Cmd {
	return tea.Batch(
		l.checkExistingSession(),
		l.startTimeoutChecker(),
	)
}

func (l LoginForm) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	l.errorMsg = ""
	l.successMsg = ""

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return l, tea.Quit
		case "esc":
			if l.state == LoadingState {
				return l, nil // Don't allow escape during loading
			}
			return l, tea.Quit
		case "f1":
			// Show help
			l.errorMsg = "Login Help: Use Tab to navigate, Enter to submit, Ctrl+C to quit"
			return l, nil
		}

	case components.FormMsg:
		switch msg.Action {
		case "submit":
			if l.state == LoginFormState {
				return l.handleLogin(msg.Values)
			}
		case "cancel":
			return l, tea.Quit
		}

	case LoginSuccessMsg:
		l.user = msg.User
		l.sessionID = msg.SessionID
		l.state = LoginSuccessState
		l.loginTime = time.Now()
		l.lastActivity = time.Now()
		l.successMsg = fmt.Sprintf("Welcome, %s! Login successful.", msg.User.Username)

		// Redirect to dashboard based on role
		return l.redirectToDashboard()

	case LoginFailedMsg:
		l.state = LoginFormState
		l.loading = false
		l.attempts++
		l.errorMsg = msg.Error

		if l.attempts >= l.maxAttempts {
			l.errorMsg = fmt.Sprintf("Maximum login attempts reached (%d). Please try again later.", l.maxAttempts)
			return l, tea.Quit
		}
		return l, nil

	case SessionTimeoutMsg:
		if l.state == LoginSuccessState {
			l.state = SessionTimeoutState
			l.errorMsg = "Session has expired. Please login again."
		}
		return l, nil
	}

	// Handle form updates when in form state
	if l.state == LoginFormState && !l.loading {
		var cmd tea.Cmd
		var model tea.Model
		model, cmd = l.form.Update(msg)
		l.form = model.(components.Form)
		return l, cmd
	}

	return l, nil
}

func (l LoginForm) View() string {
	var content strings.Builder

	// Header with application title
	header := styles.TitleStyle.Copy().
		Foreground(styles.Primary).
		Bold(true).
		Margin(1, 0).
		Render("🏢 TUI Inventory Management System")
	content.WriteString(lipgloss.Place(80, 3, lipgloss.Center, lipgloss.Center, header))
	content.WriteString("\n\n")

	switch l.state {
	case LoginFormState:
		content.WriteString(l.renderLoginForm())

	case LoadingState:
		content.WriteString(l.renderLoadingState())

	case LoginSuccessState:
		content.WriteString(l.renderSuccessState())

	case SessionTimeoutState:
		content.WriteString(l.renderTimeoutState())
	}

	// Footer with help information
	footer := l.renderFooter()
	content.WriteString("\n")
	content.WriteString(footer)

	return content.String()
}

func (l LoginForm) renderLoginForm() string {
	var content strings.Builder

	// Show error/success messages
	if l.errorMsg != "" {
		errorBox := styles.ErrorStyle.Copy().
			Border(lipgloss.RoundedBorder()).
			Padding(1).
			Width(60).
			Render("⚠️  " + l.errorMsg)
		content.WriteString(lipgloss.Place(80, 3, lipgloss.Center, lipgloss.Center, errorBox))
		content.WriteString("\n")
	}

	if l.successMsg != "" {
		successBox := styles.SuccessStyle.Copy().
			Border(lipgloss.RoundedBorder()).
			Padding(1).
			Width(60).
			Render("✅ " + l.successMsg)
		content.WriteString(lipgloss.Place(80, 3, lipgloss.Center, lipgloss.Center, successBox))
		content.WriteString("\n")
	}

	// Render login form
	formContent := l.form.View()
	centeredForm := lipgloss.Place(80, lipgloss.Height(formContent), lipgloss.Center, lipgloss.Top, formContent)
	content.WriteString(centeredForm)

	// Show security information
	securityInfo := l.renderSecurityInfo()
	content.WriteString("\n")
	content.WriteString(securityInfo)

	return content.String()
}

func (l LoginForm) renderLoadingState() string {
	spinner := "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	frame := int(time.Now().UnixNano()/100000000) % len(spinner)

	loadingText := fmt.Sprintf("%c Authenticating user... Please wait", rune(spinner[frame]))

	loadingBox := styles.InfoStyle.Copy().
		Border(lipgloss.RoundedBorder()).
		Padding(2).
		Width(50).
		Align(lipgloss.Center).
		Render(loadingText)

	return lipgloss.Place(80, 5, lipgloss.Center, lipgloss.Center, loadingBox)
}

func (l LoginForm) renderSuccessState() string {
	var content strings.Builder

	if l.user != nil {
		welcomeText := fmt.Sprintf("Welcome back, %s!", l.user.Username)
		roleText := fmt.Sprintf("Role: %s", string(l.user.Role))
		timeText := fmt.Sprintf("Login time: %s", l.loginTime.Format("2006-01-02 15:04:05"))

		successBox := styles.SuccessStyle.Copy().
			Border(lipgloss.RoundedBorder()).
			Padding(2).
			Width(60).
			Render(fmt.Sprintf("✅ %s\n\n%s\n%s", welcomeText, roleText, timeText))

		content.WriteString(lipgloss.Place(80, 7, lipgloss.Center, lipgloss.Center, successBox))
	}

	// Show "Redirecting..." message
	content.WriteString("\n\n")
	redirectMsg := styles.InfoStyle.Render("🔄 Redirecting to dashboard...")
	content.WriteString(lipgloss.Place(80, 1, lipgloss.Center, lipgloss.Center, redirectMsg))

	return content.String()
}

func (l LoginForm) renderTimeoutState() string {
	timeoutBox := styles.WarningStyle.Copy().
		Border(lipgloss.RoundedBorder()).
		Padding(2).
		Width(60).
		Align(lipgloss.Center).
		Render("⏰ Session Timeout\n\nYour session has expired due to inactivity.\nPlease login again to continue.")

	return lipgloss.Place(80, 7, lipgloss.Center, lipgloss.Center, timeoutBox)
}

func (l LoginForm) renderSecurityInfo() string {
	var info strings.Builder

	info.WriteString(styles.HelpStyle.Render(fmt.Sprintf("Login attempts: %d/%d", l.attempts, l.maxAttempts)))

	if l.appCtx != nil && l.sessionMgr != nil {
		activeCount := l.sessionMgr.GetActiveSessionCount()
		info.WriteString(" | ")
		info.WriteString(styles.HelpStyle.Render(fmt.Sprintf("Active sessions: %d", activeCount)))
	}

	return lipgloss.Place(80, 1, lipgloss.Center, lipgloss.Center, info.String())
}

func (l LoginForm) renderFooter() string {
	var helpItems []string

	switch l.state {
	case LoginFormState:
		helpItems = []string{
			"Tab/↑↓: Navigate",
			"Enter: Login",
			"F1: Help",
			"Ctrl+C: Quit",
		}
	case LoadingState:
		helpItems = []string{"Please wait..."}
	case LoginSuccessState:
		helpItems = []string{"Redirecting to dashboard..."}
	case SessionTimeoutState:
		helpItems = []string{"Press any key to restart"}
	}

	help := strings.Join(helpItems, " • ")

	footer := styles.FooterStyle.Copy().
		Width(80).
		Align(lipgloss.Center).
		Render(help)

	return footer
}

func (l LoginForm) handleLogin(values map[string]string) (tea.Model, tea.Cmd) {
	username := strings.TrimSpace(values["username"])
	password := values["password"]

	// Basic validation
	if username == "" {
		l.errorMsg = "Username is required"
		return l, nil
	}

	if password == "" {
		l.errorMsg = "Password is required"
		return l, nil
	}

	if l.appCtx == nil {
		l.errorMsg = "Application context not available"
		return l, nil
	}

	l.state = LoadingState
	l.loading = true

	return l, func() tea.Msg {
		ctx := context.Background()

		// Simulate network delay for better UX
		time.Sleep(500 * time.Millisecond)

		session, err := l.sessionMgr.Login(ctx, username, password, "127.0.0.1", "TUI-Client")
		if err != nil {
			return LoginFailedMsg{
				Error: fmt.Sprintf("Login failed: %v", err),
			}
		}

		return LoginSuccessMsg{
			User:      session.User,
			SessionID: session.UserID.String(),
		}
	}
}

func (l LoginForm) checkExistingSession() tea.Cmd {
	// In a real implementation, this might check for stored session tokens
	return nil
}

func (l LoginForm) startTimeoutChecker() tea.Cmd {
	return tea.Tick(time.Minute, func(time.Time) tea.Msg {
		// Check for session timeout
		if l.state == LoginSuccessState {
			if time.Since(l.lastActivity) > 30*time.Minute {
				return SessionTimeoutMsg{}
			}
		}
		return nil
	})
}

func (l LoginForm) redirectToDashboard() (tea.Model, tea.Cmd) {
	// Add a small delay for UX, then redirect
	return l, tea.Tick(2*time.Second, func(time.Time) tea.Msg {
		// Return to main menu or dashboard based on user role
		return tea.Quit // For now, we'll quit and let the main app handle the redirect
	})
}

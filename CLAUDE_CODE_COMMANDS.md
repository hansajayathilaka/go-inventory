# Claude Code Custom Commands Guide

## Triggering Claude Code

You can trigger Claude Code in several ways:

### 1. Issue Comments
Comment on any GitHub issue with `@claude` followed by your request:
```
@claude fix the database connection issue
@claude implement the user authentication system
@claude review this code and suggest improvements
```

### 2. Pull Request Comments
Comment on any pull request with `@claude`:
```
@claude review this PR for security issues
@claude fix the failing tests
@claude optimize the database queries in this PR
```

### 3. Pull Request Review Comments
Add `@claude` to your review comments:
```
@claude this function needs error handling
@claude suggest a better algorithm for this sorting logic
```

### 4. New Issues
Create new issues with `@claude` in the title or body to automatically trigger Claude:
```
Title: @claude Implement inventory reporting feature
Body: @claude please add comprehensive reporting functionality for inventory levels
```

## Available Commands for This Project

Claude has access to the following Go-specific commands:
- `go build` - Build the application
- `go test` - Run tests
- `go run` - Run the application
- `go mod` - Module management
- `go vet` - Code analysis
- `go install` - Install packages
- Build and run the TUI application: `./tui-inventory`

## Example Custom Commands

### Development Tasks
```
@claude run the tests and fix any failures
@claude build the application and check for compilation errors  
@claude add proper error handling to the database layer
@claude implement the audit logging for user actions
```

### Code Review Tasks
```
@claude review the user management code for security issues
@claude check the database models for proper GORM usage
@claude suggest improvements for the TUI navigation
```

### Feature Implementation
```
@claude implement a new product search feature
@claude add export functionality for inventory reports
@claude create a backup and restore system for the database
```

## Project-Specific Context

Claude understands this project structure:
- **Technology Stack**: Go, Bubble Tea v2, GORM, PostgreSQL
- **Architecture**: Clean Architecture (3-layer)
- **Database**: PostgreSQL with credentials `inventory_user:inventory_pass@localhost:5432/inventory_db`
- **Configuration**: Uses `config.yml` (created from `config.yaml.example`)
- **Main Entry**: `cmd/main.go`
- **Testing**: `go test ./...` or `go test -v ./internal/...`

## Best Practices

1. **Be Specific**: Describe exactly what you want Claude to do
2. **Provide Context**: Mention relevant files or features if applicable  
3. **One Task at a Time**: Break complex requests into smaller tasks
4. **Review Changes**: Always review Claude's changes before merging

## Notes

- Claude will automatically set up the Go environment and PostgreSQL database
- Configuration is handled automatically using the provided `config.yml`
- Claude follows the project's clean architecture principles
- All database operations use GORM patterns established in the codebase
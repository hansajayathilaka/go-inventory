# API Migration Command

**Command:** `api-migration`

**Description:** Resume or continue the TUI to REST API migration workflow. This command will check the current progress in TUI_TO_API_MIGRATION.md and continue from where it left off, prioritizing Swagger setup for immediate API testing.

**Usage:** 
```
/api-migration [step]
```

**Parameters:**
- `step` (optional): Specific step to execute
  - `setup` - Initial setup (remove TUI, add dependencies)
  - `swagger` - Set up Swagger UI first (priority)
  - `users` - Implement user management APIs
  - `products` - Implement product APIs
  - `inventory` - Implement inventory APIs
  - `suppliers` - Implement supplier APIs
  - `locations` - Implement location APIs
  - `audit` - Implement audit/reporting APIs
  - `test` - Run API tests via Swagger
  - `status` - Show current migration status

**Examples:**
```bash
# Continue migration from current step
/api-migration

# Set up Swagger UI first (priority)
/api-migration swagger

# Check migration status
/api-migration status

# Implement specific API module
/api-migration users
```

**What this command does:**
1. Reads TUI_TO_API_MIGRATION.md to determine current progress
2. Executes the next pending step in the migration plan
3. Updates the progress file with completion status
4. Prioritizes Swagger setup so APIs can be tested immediately
5. Implements APIs incrementally with Swagger documentation
6. Maintains the existing business logic and repository layers

**Files managed:**
- `TUI_TO_API_MIGRATION.md` - Progress tracking
- `go.mod` - Dependency management  
- `cmd/main.go` - Server setup
- `internal/api/` - New API layer
- `docs/` - Swagger documentation

**Key features:**
- ✅ Swagger-first development approach
- ✅ Incremental API implementation with immediate testing
- ✅ Preserves existing business logic and database layers
- ✅ File-based progress tracking for session resumption
- ✅ Automatic dependency management
- ✅ Live API documentation generation
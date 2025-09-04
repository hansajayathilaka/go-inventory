# Database Refactor Command

## Command: `/db-refactor`

**Description**: Execute the next task in the database refactor implementation plan

**Usage**: `/db-refactor [task-id]` or `/db-refactor next`

## What This Command Does

1. **Reads current progress** from `DATABASE_REFACTOR_PROGRESS.md`
2. **Identifies next task** in the implementation plan
3. **Executes the task** following the detailed specifications
4. **Runs tests** to validate the changes
5. **Updates progress tracker** with completion status
6. **Commits changes** with descriptive commit message

## Implementation Logic

### Task Identification
- Parses progress file to find current phase and task
- Follows the sequential order defined in the plan
- **Priority**: SQLite migration tasks (Phase 0) before model refactoring
- Handles dependencies between tasks automatically

### Task Execution
The command reads the detailed task specifications from:
- `DATABASE_REFACTOR_PLAN.md` - Complete task definitions and requirements
- `DATABASE_REFACTOR_PROGRESS.md` - Current progress and next tasks
- `DATABASE_DESIGN.md` - Technical specifications and schemas

**Execution Logic**:
1. **Parse Progress File** - Find current phase and incomplete tasks
2. **Load Task Specifications** - Read detailed requirements from plan
3. **Execute Task Logic** - Run phase-specific implementation code
4. **Validate Results** - Run tests and check for errors
5. **Update Progress** - Mark tasks complete and update metrics
6. **Commit Changes** - Create descriptive git commits

### Testing Strategy
- Runs relevant unit tests after code changes
- Executes integration tests when applicable
- Validates database migrations
- Ensures all linting rules pass

### Progress Tracking
- Updates task status in progress file
- Records completion timestamps
- Documents any issues or blockers
- Maintains metrics and KPIs

### Git Integration
- Creates descriptive commit messages
- Follows conventional commit format
- Tags major milestones
- Maintains clean commit history

## Command Workflow

```bash
/db-refactor next
```

1. **Parse Progress**: Read current state from progress tracker
2. **Identify Task**: Find next incomplete task in sequence
3. **Execute Task**: Run task-specific implementation logic
4. **Run Tests**: Execute relevant test suites
5. **Update Progress**: Mark task complete and update metrics
6. **Commit Changes**: Create git commit with descriptive message
7. **Report Results**: Display completion summary and next steps

## Example Output

```
🚀 Database Refactor Progress

📋 Current Task: Phase 1, Task 1.1 - Simplify Purchase Receipt Model
📊 Overall Progress: 5% Complete

✅ Executing Task...
  ▪️ Removing approval workflow fields (7 fields)
  ▪️ Removing complex fields (15 fields)  
  ▪️ Adding essential fields (3 new fields)
  ▪️ Updating status enum to 4 values
  ▪️ Creating database migration script
  ▪️ Writing unit tests

🧪 Running Tests...
  ▪️ Unit tests: PASSED (15/15)
  ▪️ Integration tests: PASSED (3/3)
  ▪️ Linting: PASSED

📈 Progress Updated...
  ▪️ Task 1.1: Complete ✅
  ▪️ Overall Progress: 8% Complete
  ▪️ Updated metrics and timestamps

📝 Git Commit...
  ▪️ Commit: "feat: simplify purchase receipt model for minimal design"
  ▪️ Files changed: 4
  ▪️ Tests passing: ✅

🎯 Next Task: Phase 1, Task 1.2 - Simplify Purchase Receipt Item Model
Run `/db-refactor next` to continue
```

## Error Handling

- **Test Failures**: Rollback changes and report issues
- **Migration Errors**: Preserve data and create rollback script
- **Dependency Issues**: Identify missing prerequisites
- **Validation Errors**: Report specific validation failures

## Safety Features

- **Automatic Backups**: Before any database changes
- **Rollback Capability**: For failed migrations
- **Test Validation**: All changes must pass tests
- **Progress Preservation**: State saved at each step

This command provides **automated, safe execution** of the database refactor plan with comprehensive testing and progress tracking.
# Next UI Task Command

## Description
Automatically picks the next available TUI development task from the development plan and implements it step by step.

## Usage
```
/next-ui-task
```

## What this command does:

1. **Reads the current task status** from `TUI_TASK_STATUS.json`
2. **Identifies the next available task** that:
   - Has status "PENDING" 
   - Has all dependencies completed
   - Follows the priority order (Critical → High → Medium → Low)
3. **Implements the task** by:
   - Creating/modifying the specified files
   - Following the detailed requirements from `TUI_DEVELOPMENT_PLAN.md`
   - Integrating with existing business services
   - Implementing proper error handling and validation
   - Adding role-based access control where needed
4. **Updates task status** by:
   - Marking the current task as "COMPLETED"
   - Adding completion timestamp
   - Updating statistics
   - Finding and setting the next task as ready
5. **Reports progress** including:
   - Task completed summary
   - Files created/modified
   - Next task identified
   - Overall progress statistics

## Implementation Rules

### Code Quality Standards:
- Follow existing code patterns and styles
- Implement proper error handling
- Add input validation for all forms
- Include loading states and user feedback
- Maintain consistent UI/UX patterns
- Add appropriate comments and documentation

### Business Logic Integration:
- Use existing business service interfaces
- Implement proper role-based access control
- Add audit logging for all operations
- Follow the repository pattern for data access
- Integrate with existing authentication system

### TUI Best Practices:
- Use Bubble Tea v2 patterns consistently
- Implement proper message handling
- Add keyboard navigation support
- Include help text and instructions
- Handle screen resizing gracefully
- Provide clear visual feedback

### File Organization:
- Follow the existing project structure
- Use consistent naming conventions
- Group related functionality together
- Maintain clear separation of concerns
- Add proper package documentation

## Task Selection Logic

The command will select tasks using this priority:
1. **Phase order**: Complete Phase 1 before Phase 2, etc.
2. **Dependency checking**: Ensure all dependencies are completed
3. **Priority level**: Critical → High → Medium → Low within each phase
4. **Component tasks**: Can be worked on in parallel with main phases

## Error Handling

If no tasks are available, the command will:
- Report current status
- Identify any blocked tasks
- Suggest next steps if all tasks are complete
- Provide debugging information if there are issues

## Progress Tracking

After each task completion, the command updates:
- Individual task status and timestamps
- Overall project statistics
- Current phase and task pointers
- Dependency completion status

## Example Output

```
🔄 TUI Development Progress: Task 3 of 31

✅ COMPLETED: Enhanced Login System
📁 Files modified: 
   - internal/ui/models/login.go (created)
   - internal/ui/components/form.go (enhanced)

🎯 NEXT TASK: User Profile Management (Task 2)
   Priority: High
   Files to create: internal/ui/models/user_profile.go
   Dependencies: Task 1 (✅ completed)

📊 Progress: Phase 1 (33% complete) | Overall: 6% complete
```

## Notes for Claude

When executing this command:
1. Always read both the development plan and current task status first
2. Implement the complete task as specified, not just a partial implementation
3. Ensure the implementation follows Go syntax and integrates with existing code
4. Update the task status file immediately after completion
5. Provide clear, actionable feedback about what was accomplished
6. If blocked or uncertain, explain the issue and suggest solutions
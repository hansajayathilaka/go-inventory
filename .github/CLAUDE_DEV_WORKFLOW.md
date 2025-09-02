# Claude Development Workflow Usage

## Overview
The **Claude Development Tasks** workflow allows you to manually trigger Claude to execute development tasks and automatically push the changes to your branch.

## Workflow File
📁 `.github/workflows/claude-dev-tasks.yml`

## How to Trigger

### 1. Via GitHub Web Interface
1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **Claude Development Tasks** workflow
4. Click **Run workflow** button
5. Fill in the parameters:
   - **Task Type**: Choose `frontend-next` or `backend-pos-next`
   - **Branch**: Target branch (leave empty for current branch)
   - **Custom Instructions**: Optional additional instructions for Claude

### 2. Via GitHub CLI
```bash
# Frontend development task
gh workflow run claude-dev-tasks.yml \
  -f task_type=frontend-next \
  -f branch=feature/frontend-setup

# Backend POS development task  
gh workflow run claude-dev-tasks.yml \
  -f task_type=backend-pos-next \
  -f branch=feature/pos-system

# With custom instructions
gh workflow run claude-dev-tasks.yml \
  -f task_type=frontend-next \
  -f custom_prompt="Focus on implementing the authentication system with proper error handling"
```

## Available Task Types

### `frontend-next`
- **Purpose**: Continue React frontend development
- **Progress File**: `FRONTEND_PROGRESS.md`
- **Plan File**: `FRONTEND_PLAN.md`
- **What it does**:
  - Reads current frontend progress
  - Identifies next pending task in current phase
  - Implements the task using React + TypeScript + Tailwind + shadcn/ui
  - Updates progress tracking
  - Commits changes with descriptive message

### `backend-pos-next`
- **Purpose**: Continue backend POS system implementation
- **Progress File**: `BACKEND_POS_PROGRESS.md`
- **Plan File**: `BACKEND_POS_PLAN.md`
- **What it does**:
  - Reads current backend POS progress
  - Identifies next pending task in current phase
  - Implements the task following Go architecture patterns
  - Updates database models/migrations as needed
  - Updates progress tracking
  - Commits changes with descriptive message

## Workflow Parameters

### `task_type` (required)
- **Options**: `frontend-next`, `backend-pos-next`
- **Description**: Type of development task to execute

### `branch` (optional)
- **Type**: String
- **Description**: Target branch for the changes
- **Default**: Current branch (`github.ref_name`)
- **Example**: `feature/authentication`, `dev`, `main`

### `custom_prompt` (optional)
- **Type**: String
- **Description**: Additional instructions for Claude
- **Example**: `"Focus on error handling and validation"`, `"Add comprehensive tests"`

## Workflow Behavior

### What the Workflow Does:
1. **Checkout**: Checks out the specified branch
2. **Git Config**: Configures Git for automated commits
3. **Claude Execution**: Runs Claude with the development task
4. **Progress Update**: Claude updates the appropriate progress file
5. **Implementation**: Claude implements the next pending task
6. **Commit**: Claude creates a descriptive commit message
7. **Push**: Workflow pushes changes back to the branch
8. **Summary**: Creates a workflow summary with results

### Permissions Required:
- `contents: write` - To push changes to repository
- `pull-requests: write` - To create/update PRs if needed
- `issues: write` - To create issues for blockers
- `actions: read` - To read workflow results
- `id-token: write` - For Claude authentication

## Expected Outcomes

### Successful Execution ✅
- Changes are implemented and pushed to the target branch
- Progress file is updated with completion status
- Descriptive commit message is created
- Workflow summary shows success

### No Changes ⚠️
- Task was already completed
- No implementation required
- Workflow logs contain details

### Failure ❌
- Check workflow logs for errors
- Verify branch exists and has proper permissions
- Ensure `CLAUDE_CODE_OAUTH_TOKEN` secret is configured

## Development Workflow Examples

### Starting Frontend Development
```bash
# Start with Phase 1: Foundation Setup
gh workflow run claude-dev-tasks.yml \
  -f task_type=frontend-next \
  -f branch=feature/frontend-foundation
```

### Continuing Backend POS Development
```bash
# Continue with current POS development phase
gh workflow run claude-dev-tasks.yml \
  -f task_type=backend-pos-next \
  -f branch=feature/pos-api
```

### Custom Development Focus
```bash
# Frontend with specific focus
gh workflow run claude-dev-tasks.yml \
  -f task_type=frontend-next \
  -f custom_prompt="Prioritize accessibility and responsive design for mobile tablets"
```

## Monitoring Progress

### Progress Files
- **Frontend**: Check `FRONTEND_PROGRESS.md` for task completion
- **Backend**: Check `BACKEND_POS_PROGRESS.md` for phase status

### Git History
- Each task completion creates a descriptive commit
- Commit messages follow the pattern: `feat/fix: [Phase] - [Task Description]`

### Workflow Logs
- Detailed execution logs available in Actions tab
- Claude's implementation process is logged
- Error messages and debugging information included

## Best Practices

### Branch Strategy
- Use feature branches for each major phase
- Merge to `dev` branch when phases are completed
- Create PRs for code review before merging

### Iterative Development
- Run one task at a time for better tracking
- Review changes before triggering next task
- Test implementations locally when possible

### Custom Instructions
- Be specific about requirements or constraints
- Mention performance or security considerations
- Include testing requirements if needed

## Troubleshooting

### Common Issues

#### Workflow Fails to Start
- Check if `CLAUDE_CODE_OAUTH_TOKEN` secret exists
- Verify branch name is correct
- Ensure repository has Actions enabled

#### No Changes Pushed
- All tasks in current phase may be completed
- Check workflow logs for Claude's analysis
- Review progress files for current status

#### Permission Errors
- Verify workflow has `contents: write` permission
- Check if branch is protected
- Ensure token has appropriate permissions

### Getting Help
- Check workflow logs in GitHub Actions
- Review progress files for current status
- Create an issue if persistent problems occur
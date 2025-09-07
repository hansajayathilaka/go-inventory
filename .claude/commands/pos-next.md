# pos-next

Find and start the next pending task from the POS frontend development plan.

## Usage
```
/pos-next
```

## Description
This command reads the POS_SIMPLE_PLAN.md and POS_SIMPLE_PROGRESS.md files to understand the current project status and automatically start working on the next pending task in the development pipeline.

## What it does:
1. Reads the POS frontend implementation plan for context
2. Analyzes the progress tracker to find the current phase and next pending task
3. Identifies any blockers or dependencies
4. Starts working on the next logical task in the sequence
5. Updates the progress tracker as work begins
6. Verify the project by building and running tests after completing the task
7. Commits changes to version control with a descriptive message remove if unnecessary exist

## Example output:
- "Starting Phase 1.1: Creating POSLayout.tsx with distraction-free design"
- "Moving to Phase 2.1: Building session management system" 
- "All tasks complete! POS frontend development finished."

This command helps maintain momentum in the POS development workflow by automatically determining what to work on next based on the current project state.
# Frontend Development - Next Task

Continue frontend development for the hardware store inventory system.

## Usage
```bash
/frontend-next
```

## Description
This command resumes frontend development by:
1. Reading the current progress from `FRONTEND_PROGRESS.md`
2. Checking `REQUESTED_APIS.md` for any missing backend APIs
3. Identifying the next pending task or phase
4. Working on the current task with focused implementation
5. Documenting any missing APIs encountered during development
6. Updating progress tracking after completion
7. Committing changes with descriptive commit message

## Current Project Status
- **Project**: React Frontend for Hardware Store Inventory System
- **Tech Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Progress File**: `FRONTEND_PROGRESS.md`
- **Plan File**: `FRONTEND_PLAN.md`

## What This Command Does
1. **Progress Check**: Reads current status from progress tracker
2. **API Status Check**: Reviews `REQUESTED_APIS.md` for missing backend endpoints
3. **Task Identification**: Finds the next incomplete task or phase
4. **Implementation**: Works on the identified task with proper setup
5. **API Documentation**: Documents any missing APIs encountered during development
6. **Progress Update**: Updates the progress tracker with completion status
7. **Commit Changes**: Creates a descriptive commit with progress update

## Example Workflow
```
Phase 1: Foundation Setup (Current)
├── ✅ Initialize Vite + React + TypeScript project  
├── 🔄 Setup Tailwind CSS and shadcn/ui configuration (WORKING)
├── ⏳ Configure routing with React Router
├── ⏳ Implement authentication system
└── ⏳ ... (remaining tasks)
```

## Files Updated
- Frontend source code in `frontend/` directory
- `FRONTEND_PROGRESS.md` - Progress tracking
- `REQUESTED_APIS.md` - Missing API endpoints (if any encountered)
- Git commit with phase and task completion status

## Prerequisites
- Existing Go backend running on port 9090
- Node.js and npm installed
- Git repository initialized

## Next Steps After Each Run
- Review the updated progress in `FRONTEND_PROGRESS.md`
- Check `REQUESTED_APIS.md` for any new missing API requests
- Test the implemented features
- Run `/frontend-next` again for the next task
- Use `/backend-pos-next` when backend POS features are needed

## Handling Missing APIs During Development

### When You Encounter Missing APIs:
1. **Continue Development**: Don't stop - implement with mock data/placeholders
2. **Document the Missing API**: Add to `REQUESTED_APIS.md` using the template:
   ```
   ### [PRIORITY] HTTP_METHOD /api/v1/endpoint/path
   - **Frontend Feature**: Current page/component being worked on
   - **Description**: What this endpoint should do
   - **Expected Request/Response**: Brief format description
   - **Date Requested**: Current date
   - **Status**: REQUESTED
   ```
3. **Mark Feature Status**: Note in progress tracker if feature is blocked by missing API
4. **Continue with Next Task**: Move to next implementation task while API is pending

### API Priority Guidelines:
- **HIGH**: Core functionality (authentication, product lists, basic CRUD)
- **MEDIUM**: Enhanced features (filtering, search, reports)
- **LOW**: Nice-to-have features (advanced analytics, exports)
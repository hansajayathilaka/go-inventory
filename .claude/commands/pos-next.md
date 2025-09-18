# pos-next

POS Development Orchestrator - Automatically implements the next task from the POS implementation plan with full error handling and testing.

## Usage
```
/pos-next
```

## Description
This is the central command that automatically implements the next task from the POS development plan. It reads the plan, identifies the next unchecked task, implements it completely, handles all errors, and commits the changes.

## What it does:
1. **Plan Analysis**: Reads `POS_IMPLEMENTATION_PLAN.md` to identify current progress and next task
2. **Task Implementation**: Automatically implements the identified task with complete code
3. **Build Error Handling**: Detects and fixes TypeScript, compilation, and linting errors
4. **API Development**: Creates missing backend APIs if required by frontend
5. **Testing & Validation**: Runs comprehensive tests to ensure everything works
6. **Error Resolution**: Automatically fixes runtime errors and API integration issues
7. **Progress Tracking**: Updates the plan file with completed checkboxes
8. **Automatic Commit**: Commits all changes with detailed commit messages

## Automated Workflow:

### 1. Plan Reading & Task Selection
- Parses `POS_IMPLEMENTATION_PLAN.md` to find current phase and progress
- Identifies the first unchecked `[ ]` task in the active phase
- Extracts task details and requirements

### 2. Implementation Strategy
- **Frontend Tasks**: Creates React components, types, and UI logic
- **Backend Tasks**: Develops Go APIs, handlers, and business logic
- **Full-Stack Tasks**: Implements both frontend and backend in sequence
- **Infrastructure Tasks**: Sets up routing, stores, and architecture

### 3. Error Handling Pipeline
- **Build Errors**: Runs `npm run build` and fixes TypeScript/compilation issues
- **Lint Errors**: Runs `npm run lint` and auto-fixes code style issues
- **Runtime Errors**: Tests implementation and fixes API integration problems
- **Missing APIs**: Creates backend endpoints if frontend needs them

### 4. Testing & Validation
- **Frontend Tests**: Component rendering, user interactions, state management
- **Backend Tests**: API endpoints, business logic, error handling
- **Integration Tests**: Full stack functionality, API-UI communication
- **Build Validation**: Ensures no TypeScript errors or lint issues

### 5. Progress Tracking & Completion
- Updates `POS_IMPLEMENTATION_PLAN.md` by checking off completed tasks `[x]`
- Creates detailed commit messages describing what was implemented
- Automatically moves to next phase when current phase is complete

## Example Execution Flow:

### Step 1: Plan Analysis
```
📋 Reading POS_IMPLEMENTATION_PLAN.md...
✅ Found Phase 1: Core Infrastructure (Foundation)
🎯 Next Task: "Create POS layout and routing"
```

### Step 2: Implementation
```
🚀 Implementing POS layout and routing...
📁 Creating /workspaces/tui-inventory/frontend/src/pages/POS.tsx
📁 Creating /workspaces/tui-inventory/frontend/src/components/pos/POSLayout.tsx
🔧 Updating App.tsx with POS routes
📝 Adding POS System to sidebar navigation
```

### Step 3: Error Resolution
```
🏗️ Running build to check for errors...
❌ Found TypeScript error in POSLayout.tsx:15
🔧 Fixing: Adding missing import for Button component
✅ Build successful!
```

### Step 4: API Creation (if needed)
```
🔍 Checking if backend APIs are needed...
⚡ Frontend requires POS session API
📡 Creating /workspaces/tui-inventory/internal/api/handlers/pos_session_handler.go
🛠️ Adding routes to router.go
✅ Backend APIs ready!
```

### Step 5: Testing & Validation
```
🧪 Running tests...
✅ Frontend build: PASSED
✅ Backend build: PASSED
✅ API integration: PASSED
✅ UI functionality: PASSED
```

### Step 6: Commit & Progress Update
```
📝 Updating progress in POS_IMPLEMENTATION_PLAN.md
✅ Task marked as complete: [x] Create POS layout and routing
💾 Committing changes...
🎉 Task completed successfully!
```

## Smart Features:

- **Dependency Detection**: Automatically identifies when backend APIs are needed
- **Error Recovery**: Continues implementation even after fixing multiple errors
- **Progress Preservation**: Never loses progress, always updates the plan file
- **Quality Assurance**: Ensures every implementation is tested and working
- **Full Automation**: Requires no manual intervention once started

This command transforms your POS development from manual task management into a fully automated implementation pipeline that handles everything from code generation to testing to progress tracking.

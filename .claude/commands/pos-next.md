# pos-next

POS Development Orchestrator - Manages tasks, assigns specialists, delegates work, and tracks progress.

## Usage
```
/pos-next
```

## Description
This is the central command that orchestrates your entire POS development workflow. It reads progress files, identifies next tasks, assigns them to appropriate specialists, tracks completion, and ensures quality through testing.

## What it does:
1. **Progress Analysis**: Reads `POS_SIMPLE_PLAN.md` and `POS_SIMPLE_PROGRESS.md` for current state
2. **Task Breakdown**: Breaks large tasks into very small, detailed sub-tasks with exact specifications
3. **Detailed Assignment**: Provides specialists with comprehensive task descriptions including:
   - **Backend**: Exact database schema, API endpoints, request/response bodies, error codes
   - **Frontend**: Component structure, TypeScript interfaces, user interactions, validation rules
   - **Testing**: Specific test scenarios for both API calls and UI interactions
4. **Work Coordination**: Manages handoffs between frontend, backend, and testing
5. **Progress Tracking**: Updates progress files as micro-tasks are completed
6. **Quality Gates**: Ensures comprehensive testing of both API and UI before task completion
7. **Dependency Management**: Coordinates when frontend needs backend APIs or testing needs both
8. **Commit Changes**: Commit the relevent changes with proper commit message

## Team Specialists Available:
- **`/pos-frontend-dev`**: React/TypeScript specialist for POS UI/UX
- **`/pos-backend-dev`**: Go specialist for APIs and business logic  
- **`/pos-tester`**: Testing specialist for both frontend and backend validation

## Assignment Logic:
- **Frontend Work** → `/pos-frontend-dev`: React components, UI/UX, TypeScript, styling
- **Backend Work** → `/pos-backend-dev`: Go APIs, database, business logic, auth
- **Testing Work** → `/pos-tester`: Unit tests, integration tests, E2E validation
- **Complex Features** → Multiple specialists in sequence with coordination

## Workflow Examples:

### New Feature Development:
1. **Backend First**: API endpoints and business logic
2. **Frontend Second**: UI components consuming the APIs
3. **Testing Last**: Comprehensive validation of the complete feature

### Bug Fixes:
1. **Analysis**: Determine if bug is frontend, backend, or integration
2. **Assignment**: Route to appropriate specialist  
3. **Testing**: Validate fix and check for regressions

### Testing Cycles:
1. **Development Complete**: All planned tasks finished
2. **Full Testing**: `/pos-tester` runs comprehensive test suite
3. **Issue Resolution**: Route any discovered issues back to developers
4. **Final Validation**: Ensure all tests pass before release

## Example Detailed Task Assignments:

### Backend Task Assignment:
"📋 **Task**: Product Search API  
**Assigning to**: Backend Developer  
**Details**: 
- Database: Add `search_vector` column to `products` table with GIN index
- API: `GET /api/v1/products/search` with query params (q, category_id, limit, offset)
- Response: JSON with products array, total_count, has_more fields
- Validation: minimum 2 chars for search term, max 100 results
- Errors: 400 for short term, 422 for invalid category, 401 for auth"

### Frontend Task Assignment:
"🎨 **Task**: Product Search Component  
**Assigning to**: Frontend Developer  
**Details**:
- Component: ProductSearch with onProductSelect prop and state for query/results/loading
- TypeScript: ProductSearchProps and ProductSearchState interfaces
- UI: Input with search icon, ScrollArea for results, Card for each item, Skeleton for loading
- Interactions: 300ms debounce, arrow key navigation, enter to select, escape to clear
- API: Call /api/v1/products/search with proper error handling and loading states"

### Testing Task Assignment:
"🧪 **Task**: Test Product Search Feature  
**Assigning to**: Tester  
**Details**:
- API Tests: curl commands for valid search, validation errors, auth failures, performance
- UI Tests: React component tests for rendering, user interactions, error scenarios
- Integration: E2E test with real API calls and UI interaction flow
- Performance: Response time < 200ms, UI render < 50ms, no memory leaks"

## Progress Management:
- **Task Tracking**: Updates progress files with completion status
- **Dependency Management**: Ensures prerequisites are met before starting tasks
- **Quality Control**: No task marked complete until testing passes
- **Handoff Coordination**: Manages work transitions between specialists
- **Blocker Resolution**: Identifies and helps resolve development blockers

This single command replaces multiple management tools and acts as your intelligent development workflow orchestrator, ensuring the right expert handles each task while maintaining quality and progress tracking. If there is any missing APIs needed for the frontend, implement those APIs as well. At last frontend and backend should both sync together to give the correct output.

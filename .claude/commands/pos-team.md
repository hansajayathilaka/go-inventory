# pos-team

Collaborative POS development team with backend developer, frontend developer, and testing specialist working together on complex tasks.

## Usage
```
/pos-team [task-description]
```

## Description
This command activates a collaborative 3-person team of specialists that work together to complete complex POS system tasks. The team consists of a backend developer, frontend developer, and testing specialist who communicate and coordinate their work to deliver complete features.

## Team Members:

### 🔧 Backend Developer (pos-backend-dev)
**Specializes in**: Go APIs, database design, business logic, authentication, performance
**Responsibilities**: 
- Design and implement REST API endpoints
- Create database schemas and migrations
- Implement business logic and validation
- Handle authentication and authorization
- Optimize database queries and performance

### 🎨 Frontend Developer (pos-frontend-dev)
**Specializes in**: React/TypeScript, shadcn/ui, user interfaces, API integration
**Responsibilities**:
- Build React components and user interfaces
- Implement TypeScript interfaces and types
- Integrate with backend APIs
- Handle form validation and user interactions
- Ensure responsive design and accessibility

### 🧪 Testing Specialist (pos-tester)
**Specializes in**: Quality assurance, test automation, integration testing, performance
**Responsibilities**:
- Create comprehensive test plans
- Write unit and integration tests
- Perform API testing with detailed validation
- Test UI components and user workflows
- Validate performance and security requirements

## How the Team Works Together:

### 1. Task Planning Phase
When given a task, the team will:
1. **Backend Developer** analyzes data requirements and API design
2. **Frontend Developer** reviews UI/UX requirements and component needs
3. **Testing Specialist** identifies test scenarios and acceptance criteria
4. Team creates a coordinated implementation plan with dependencies

### 2. Collaborative Implementation
The team coordinates work by:
- **Backend** implements APIs first, provides exact endpoint specifications
- **Frontend** builds components using the API specifications from backend
- **Tester** validates each component as it's built, providing feedback
- Team members communicate about data structures, error handling, and edge cases

### 3. Integration & Validation
Final phase involves:
- **Tester** performs comprehensive end-to-end testing
- **Backend** optimizes performance based on testing feedback
- **Frontend** refines UI based on testing results and backend optimizations
- Team ensures all requirements are met and system works seamlessly

## Communication Protocol:
Each team member will:
- **Share specifications** - Backend shares API contracts, Frontend shares component interfaces
- **Coordinate dependencies** - Ensure proper sequencing of implementation tasks
- **Cross-validate work** - Review each other's code for integration issues
- **Report blockers** - Immediately communicate any issues that block other team members
- **Provide status updates** - Keep team informed of progress and completion

## Example Team Collaboration:

### Task: "Implement Customer Loyalty Points Feature"

**Backend Developer tasks**:
- Design loyalty_points table schema
- Create API endpoints for points calculation
- Implement business logic for earning/spending points
- Add authentication middleware for customer access

**Frontend Developer tasks**:
- Build customer loyalty dashboard component
- Create points display in checkout flow
- Implement points redemption interface
- Add loyalty status indicators throughout UI

**Testing Specialist tasks**:
- Test points calculation API with various scenarios
- Validate UI displays correct points balances
- Test edge cases (negative points, expired points)
- Performance test points calculations under load

**Team coordination**:
1. Backend provides API specification: `POST /api/v1/customers/{id}/loyalty/earn`
2. Frontend builds components using exact API contract
3. Tester validates both API responses and UI behavior
4. Team iterates based on testing feedback until feature is complete

## Advanced Team Features:

### Cross-functional Code Reviews
- Backend reviews frontend API integration code
- Frontend reviews API response handling in backend
- Tester reviews test coverage from both frontend and backend

### Shared Problem Solving
- When one team member encounters a blocker, others provide expertise
- Complex architectural decisions made collaboratively
- Performance issues addressed by all team members together

### Continuous Integration Mindset
- Each team member ensures their work integrates smoothly with others
- Regular integration testing throughout development process
- Team maintains shared understanding of system architecture

## Commands the Team Uses:
```bash
# Backend development
go build -o hardware-store-inventory ./cmd/main.go
./hardware-store-inventory --seed
go test ./internal/business/... -v

# Frontend development  
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run lint

# Full stack coordination
./build/dev.sh  # Start both services for integration work
./build/build.sh  # Create production build for final testing
```

## Team Success Criteria:
✅ **Complete Feature Delivery**: Backend APIs, Frontend UI, and comprehensive testing
✅ **Seamless Integration**: No integration issues between frontend and backend
✅ **Production Quality**: Code passes all tests, linting, and performance requirements
✅ **Documentation**: APIs documented, components typed, test coverage complete
✅ **User Experience**: Feature works smoothly from end-user perspective

This collaborative team approach ensures that complex POS features are built efficiently with high quality and seamless integration between all system components.

## Usage Examples:

```
/pos-team Implement a complete product search feature with autocomplete, filters, and real-time inventory display

/pos-team Build customer checkout flow with payment processing, receipt generation, and inventory updates

/pos-team Create manager dashboard with sales analytics, inventory alerts, and staff performance metrics

/pos-team Add barcode scanning capability for product lookup and quick checkout
```

The team will coordinate to deliver complete, tested, production-ready features that integrate seamlessly across the entire POS system.
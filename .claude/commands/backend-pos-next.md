# Backend POS Development - Next Task

Continue backend POS system development for the hardware store inventory system.

## Usage
```bash
/backend-pos-next
```

## Description
This command resumes backend POS development by:
1. Checking `REQUESTED_APIS.md` for high-priority missing APIs
2. Reading the current progress from `BACKEND_POS_PROGRESS.md`
3. Prioritizing missing API implementation over planned tasks
4. Working on the current task with focused implementation
5. Updating missing APIs status when endpoints are completed
6. Updating progress tracking after completion
7. Committing changes with descriptive commit message

## Current Project Status
- **Project**: Go Backend POS System Extension
- **Architecture**: Clean 3-layer architecture (API → Business → Repository)
- **Progress File**: `BACKEND_POS_PROGRESS.md`
- **Plan File**: `BACKEND_POS_PLAN.md`

## What This Command Does
1. **Missing API Check**: Reviews `REQUESTED_APIS.md` for frontend-requested endpoints
2. **Priority Assessment**: Prioritizes HIGH priority missing APIs first
3. **Progress Check**: Reads current status from progress tracker
4. **Task Selection**: Chooses missing API implementation or planned tasks
5. **Implementation**: Works on the identified task following Go best practices
6. **API Status Update**: Moves completed APIs to "Recently Implemented" section
7. **Progress Update**: Updates the progress tracker with completion status
8. **Commit Changes**: Creates a descriptive commit with progress update

## Example Workflow
```
Phase 1: Sales Transaction Models (Current)
├── ✅ Create Sale, SaleItem, Payment models
├── 🔄 Add database migrations (WORKING)
├── ⏳ Update repository layer with interfaces
├── ⏳ Add model validation and relationships
└── ⏳ ... (remaining tasks)
```

## Files Updated
- Backend source code in `internal/` directory
- Database migrations in appropriate migration directory
- `BACKEND_POS_PROGRESS.md` - Progress tracking
- `REQUESTED_APIS.md` - API completion status updates
- Git commit with phase and task completion status

## Architecture Components

### Database Layer
- Models in `internal/repository/models/`
- Repository interfaces and implementations
- Database migrations with proper versioning

### Business Layer
- Services in `internal/business/[service]/`
- Business logic validation
- Transaction management

### API Layer  
- Handlers in `internal/api/handlers/`
- Route definitions in `internal/api/router/`
- Middleware for authentication/authorization

## Prerequisites
- Existing Go backend architecture
- PostgreSQL database running
- GORM ORM configured
- JWT authentication system in place

## Next Steps After Each Run
- Review the updated progress in `BACKEND_POS_PROGRESS.md`
- Check `REQUESTED_APIS.md` to see which APIs were completed
- Test the implemented API endpoints with curl or Postman
- Run `/backend-pos-next` again for the next task
- Use `/frontend-next` when frontend implementation is needed

## API Implementation Priority

### Priority Order:
1. **Missing APIs (HIGH Priority)**: From `REQUESTED_APIS.md` marked as HIGH
2. **Missing APIs (MEDIUM Priority)**: From `REQUESTED_APIS.md` marked as MEDIUM  
3. **Planned POS Features**: Continue with planned phases in `BACKEND_POS_PLAN.md`
4. **Missing APIs (LOW Priority)**: From `REQUESTED_APIS.md` marked as LOW

### When Implementing Missing APIs:
1. **Read the Request**: Check `REQUESTED_APIS.md` for endpoint details
2. **Follow Existing Patterns**: Use existing handlers/services as templates
3. **Update Status**: Mark API as "IN_PROGRESS" during development
4. **Complete Implementation**: Full endpoint with validation, business logic, repository
5. **Move to Implemented**: Move completed API to "Recently Implemented" section
6. **Update Progress**: Document completion in `BACKEND_POS_PROGRESS.md`

### API Implementation Steps:
1. Create/update repository models and interfaces
2. Implement business logic service methods
3. Create API handler endpoints with validation
4. Add routes to router configuration
5. Test endpoints with proper authentication
6. Update Swagger documentation if needed

## Integration Points
- **Inventory System**: Stock updates when sales completed
- **Customer System**: Discounts and credit limit handling
- **Audit System**: Comprehensive logging for all operations
- **User System**: Role-based access control for POS functions

## Security & Performance
- Proper authentication middleware
- Input validation and sanitization  
- Database indexing for performance
- Audit logging for sensitive operations
- PCI compliance considerations for payments
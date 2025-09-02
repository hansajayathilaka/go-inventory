# Backend POS Development - Next Task

Continue backend POS system development for the hardware store inventory system.

## Usage
```bash
/backend-pos-next
```

## Description
This command resumes backend POS development by:
1. Reading the current progress from `BACKEND_POS_PROGRESS.md`
2. Identifying the next pending task or phase
3. Working on the current task with focused implementation
4. Updating progress tracking after completion
5. Committing changes with descriptive commit message

## Current Project Status
- **Project**: Go Backend POS System Extension
- **Architecture**: Clean 3-layer architecture (API → Business → Repository)
- **Progress File**: `BACKEND_POS_PROGRESS.md`
- **Plan File**: `BACKEND_POS_PLAN.md`

## What This Command Does
1. **Progress Check**: Reads current status from progress tracker
2. **Task Identification**: Finds the next incomplete task or phase
3. **Implementation**: Works on the identified task following Go best practices
4. **Progress Update**: Updates the progress tracker with completion status
5. **Commit Changes**: Creates a descriptive commit with progress update

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
- Test the implemented API endpoints
- Run `/backend-pos-next` again for the next task
- Use `/frontend-next` when frontend implementation is needed

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
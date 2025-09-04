# Archived Plans and Documents

This directory contains older planning documents that have been superseded by the current database refactor approach.

## Archived Files

### Backend Plans
- `BACKEND_POS_PLAN.md` - Original complex POS system plan (superseded)
- `BACKEND_POS_PROGRESS.md` - Progress on original POS plan (superseded)

### Frontend Plans  
- `FRONTEND_PLAN.md` - Frontend implementation plan (superseded)
- `FRONTEND_PROGRESS.md` - Frontend progress tracking (superseded)

## Current Active Plans

The current implementation follows the minimal database design approach:

- `/DATABASE_REFACTOR_PLAN.md` - Main implementation plan
- `/DATABASE_DESIGN.md` - Detailed database specification  
- `/DATABASE_REFACTOR_PROGRESS.md` - Active progress tracking
- `/database_erd.md` - Entity relationship diagram

## Why These Were Archived

The original plans were too complex for a small shop operation:
- Too many fields and relationships
- Complex approval workflows not needed for 2-person team
- Separate tables for pricing/suppliers (now transaction-based)
- Vehicle compatibility system (can be added later as module)

The new approach prioritizes simplicity and essential functionality.
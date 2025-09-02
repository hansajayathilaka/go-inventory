# Missing API Endpoints Tracker

## Purpose
This file tracks API endpoints that are needed during frontend development but are missing from the backend. When frontend developers encounter missing APIs while using the `/frontend-next` command, they should document them here. Backend developers can then prioritize implementing these APIs when using the `/backend-pos-next` command.

## Current Status
**Last Updated**: 2025-09-02
**Total Missing APIs**: 2

## How to Use This File

### For Frontend Developers
When you encounter a missing API endpoint during development:
1. Add it to the "Missing APIs" section below
2. Include the HTTP method, endpoint path, and brief description
3. Specify which frontend feature/page needs this API
4. Mark the priority level (HIGH/MEDIUM/LOW)

### For Backend Developers  
When working on backend implementation:
1. Check this file for high-priority missing APIs
2. Implement the missing endpoints following existing patterns
3. Move completed APIs to the "Recently Implemented" section
4. Update both BACKEND_POS_PROGRESS.md with completion status

## Template for Adding Missing APIs
```
### [PRIORITY] HTTP_METHOD /api/v1/endpoint/path
- **Frontend Feature**: Which page/component needs this
- **Description**: Brief description of what this endpoint should do
- **Request Body**: Expected request format (if applicable)
- **Response Format**: Expected response format
- **Date Requested**: YYYY-MM-DD
- **Status**: REQUESTED | IN_PROGRESS | COMPLETED
```

---

## Missing APIs

### [HIGH] GET /api/v1/dashboard/stats
- **Frontend Feature**: Dashboard overview page
- **Description**: Get overall system statistics for dashboard (total products, customers, low stock count, recent activities)
- **Request Body**: None (GET request)
- **Response Format**: 
  ```json
  {
    "total_products": 150,
    "total_customers": 45,
    "low_stock_items": 12,
    "zero_stock_items": 3,
    "recent_sales_count": 25,
    "total_inventory_value": 15000.50
  }
  ```
- **Date Requested**: 2025-09-02
- **Status**: REQUESTED

### [HIGH] GET /api/v1/products/low-stock
- **Frontend Feature**: Products page low stock filtering
- **Description**: Get products with stock levels below their reorder point (alternative to existing /api/v1/inventory/low-stock which might have different response format)
- **Request Body**: None (GET request, optional query parameters for pagination)
- **Response Format**: Standard product list with inventory information
- **Date Requested**: 2025-09-02
- **Status**: REQUESTED
- **Note**: Consider if existing `/api/v1/inventory/low-stock` endpoint can be used instead

---

## Recently Implemented APIs
*APIs that were requested and have been implemented*

---

## Integration Notes

### Frontend Development Workflow
1. During `/frontend-next` development, if an API call fails with 404 or endpoint not found:
   - Add the missing API to this file using the template above
   - Continue with mock data or placeholder implementation
   - Mark the frontend feature as "pending backend API"

### Backend Development Workflow  
1. During `/backend-pos-next` development:
   - Check this file first for high-priority missing APIs
   - Implement missing APIs before adding new features
   - Update progress files when APIs are completed
   - Move completed APIs to "Recently Implemented" section

### Priority Guidelines
- **HIGH**: APIs needed for core functionality (login, product listing, sales processing)
- **MEDIUM**: APIs for enhanced features (search filters, reports, analytics)  
- **LOW**: APIs for nice-to-have features (advanced reports, export functions)

## Related Files to Update
When APIs are requested or implemented, also update:
- `FRONTEND_PROGRESS.md` - Mark frontend features as blocked/unblocked
- `BACKEND_POS_PROGRESS.md` - Track API implementation progress
- `.claude/commands/frontend-next.md` - Update with latest API status
- `.claude/commands/backend-pos-next.md` - Update with prioritization logic
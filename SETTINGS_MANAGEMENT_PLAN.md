# Settings Management System Implementation Plan

**Created:** September 24, 2025
**Status:** In Progress
**Priority:** High

## Overview

Create a comprehensive settings management system to handle global POS configurations including tax settings, with both frontend and backend implementation. This will replace hardcoded values (like the current 8% tax rate) with dynamic, user-configurable settings.

## Current State Analysis

### Issues Identified
- ❌ Tax rate is hardcoded at 8% (0.08) throughout the POS system
- ❌ No centralized configuration management
- ❌ Business settings require code changes to modify
- ❌ No UI for administrators to manage store settings

### Current Tax Implementation Locations
- `frontend/src/stores/pos/posCartStore.ts:42` - `taxRate: 0.08`
- `frontend/src/components/pos/Discounts/DiscountPanel.tsx:25` - `const taxRate = 0.08`
- Multiple hardcoded references to `0.08` in discount and transaction components

---

## Implementation Plan

## Phase 1: Backend Core Infrastructure ⏳

### 1.1 Database Layer
**Status:** 🔄 Not Started
**Files to Create:**
- `internal/repository/models/settings.go`
- `migrations/xxx_create_settings_table.sql`

**Settings Model Structure:**
```go
type Setting struct {
    ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
    Key         string         `gorm:"uniqueIndex;not null;size:100" json:"key"`
    Value       string         `gorm:"not null;size:1000" json:"value"`
    Description string         `gorm:"size:500" json:"description"`
    Category    string         `gorm:"size:50;index" json:"category"`
    DataType    string         `gorm:"size:20" json:"data_type"` // string, number, boolean, json
    IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
}
```

**Initial Settings to Seed:**
- `tax_enabled` (boolean) → "true"
- `tax_percentage` (number) → "8.0"
- `tax_name` (string) → "GST"
- `tax_inclusive` (boolean) → "false"

### 1.2 Repository Layer
**Status:** 🔄 Not Started
**File to Create:** `internal/repository/settings_repository.go`

**Required Methods:**
- `GetAllSettings() ([]models.Setting, error)`
- `GetSettingByKey(key string) (*models.Setting, error)`
- `GetSettingsByCategory(category string) ([]models.Setting, error)`
- `CreateSetting(setting *models.Setting) error`
- `UpdateSetting(key string, value string) error`
- `DeleteSetting(key string) error`

### 1.3 Business Layer
**Status:** 🔄 Not Started
**File to Create:** `internal/business/settings/service.go`

**Business Logic:**
- Setting validation (e.g., tax percentage 0-100%)
- Type conversion and parsing
- Default settings initialization
- Settings caching for performance

### 1.4 API Layer
**Status:** 🔄 Not Started
**Files to Create:**
- `internal/api/handlers/settings_handler.go`
- `internal/api/dto/settings.go`

**API Endpoints:**
- `GET /api/v1/settings` - Get all settings
- `GET /api/v1/settings/:key` - Get specific setting
- `PUT /api/v1/settings/:key` - Update setting
- `POST /api/v1/settings` - Create setting
- `DELETE /api/v1/settings/:key` - Delete setting

---

## Phase 2: Frontend Foundation ⏳

### 2.1 Settings Service Layer
**Status:** 🔄 Not Started
**Files to Create:**
- `frontend/src/services/settingsService.ts`
- `frontend/src/types/settings.ts`

### 2.2 Settings Store/Context
**Status:** 🔄 Not Started
**Files to Create:**
- `frontend/src/stores/settingsStore.ts`
- `frontend/src/contexts/SettingsContext.tsx`

### 2.3 Settings Page
**Status:** 🔄 Not Started
**File to Create:** `frontend/src/pages/Settings.tsx`

**Page Sections:**
- Tax Configuration
- General Settings
- POS Settings
- Future extensibility structure

### 2.4 Navigation Integration
**Status:** 🔄 Not Started
**Files to Update:**
- `frontend/src/components/layout/Sidebar.tsx` - Add Settings link
- `frontend/src/App.tsx` - Add /settings route

---

## Phase 3: POS System Integration ⏳

### 3.1 Dynamic Tax Rate Implementation
**Status:** 🔄 Not Started
**Files to Update:**
- `frontend/src/stores/pos/posCartStore.ts` - Remove hardcoded `taxRate: 0.08`
- `frontend/src/components/pos/Discounts/DiscountPanel.tsx` - Remove hardcoded `taxRate = 0.08`
- All discount and transaction components with hardcoded tax rates

### 3.2 Real-time Settings Updates
**Status:** 🔄 Not Started
- Settings change listeners
- POS system refresh when tax settings change
- Cart recalculation on tax rate changes

---

## Phase 4: Testing & Validation ⏳

### 4.1 Backend Testing
**Status:** 🔄 Not Started
- Unit tests for settings service
- API endpoint testing
- Database migration testing

### 4.2 Frontend Testing
**Status:** 🔄 Not Started
- Settings page functionality
- Tax calculation accuracy
- POS system integration testing

### 4.3 End-to-End Testing
**Status:** 🔄 Not Started
- Complete settings workflow
- Tax calculation scenarios
- Business validation testing

---

## Proposed Settings Structure

### Tax Settings Category
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `tax_enabled` | boolean | true | Enable/disable tax calculation |
| `tax_percentage` | number | 8.0 | Tax rate percentage (0-100) |
| `tax_name` | string | "GST" | Display name for tax |
| `tax_inclusive` | boolean | false | Whether prices include tax |

### Future Settings Categories

#### General Settings
- `store_name` - Business name
- `store_currency` - Currency code (MYR, USD, etc.)
- `store_timezone` - Timezone setting

#### POS Settings
- `receipt_template` - Receipt layout
- `payment_methods` - Enabled payment methods
- `auto_print_receipt` - Auto-print setting

#### Inventory Settings
- `low_stock_threshold` - Default low stock warning level
- `auto_reorder_enabled` - Enable automatic reordering

---

## Task Tracking

### 🔄 Current Sprint Tasks
1. **Create Settings Model** - Not Started
2. **Create Database Migration** - Not Started
3. **Implement Settings Repository** - Not Started

### 📅 Next Sprint Tasks
1. **Implement Settings Business Service** - Planned
2. **Create Settings API Endpoints** - Planned
3. **Build Settings Frontend Service** - Planned

### ✅ Completed Tasks
- [x] Research current tax implementation
- [x] Analyze codebase structure
- [x] Design settings system architecture
- [x] Create implementation plan

---

## Benefits

### Immediate Benefits
- **Dynamic Tax Management** - Change tax rates without code deployment
- **Centralized Configuration** - All global settings in one place
- **Business Flexibility** - Adapt to different tax requirements quickly

### Long-term Benefits
- **Extensible Architecture** - Easy to add new settings categories
- **Multi-tenant Ready** - Foundation for multiple store configurations
- **User-Friendly Management** - Settings through web interface
- **Audit Trail** - Track when and who changed settings

---

## Risk Assessment

### Technical Risks
- **Performance Impact** - Settings queries on every transaction
  - *Mitigation:* Implement caching strategy
- **Data Migration** - Existing hardcoded values to dynamic settings
  - *Mitigation:* Gradual migration with backward compatibility

### Business Risks
- **Tax Calculation Errors** - Incorrect tax calculations during transition
  - *Mitigation:* Extensive testing and validation
- **User Training** - Staff need to learn new settings management
  - *Mitigation:* Intuitive UI and documentation

---

## Success Criteria

### Phase 1 Success
- [ ] Settings can be stored and retrieved from database
- [ ] API endpoints respond correctly
- [ ] Basic settings validation works

### Phase 2 Success
- [ ] Settings page loads and displays current values
- [ ] Settings can be updated through UI
- [ ] Navigation integration complete

### Phase 3 Success
- [ ] Tax calculations use dynamic rate from settings
- [ ] POS system reflects tax changes immediately
- [ ] All hardcoded tax rates removed

### Final Success
- [ ] Complete tax management through settings UI
- [ ] No business logic hardcoded in frontend
- [ ] System ready for additional setting categories
- [ ] Full test coverage achieved

---

**Last Updated:** September 24, 2025
**Next Review:** Weekly during implementation
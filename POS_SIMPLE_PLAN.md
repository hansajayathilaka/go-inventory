# Simplified Frontend POS System Plan

## Project Overview

This plan outlines the development of a simplified Point of Sale (POS) frontend for a single vehicle spare parts shop. The system will be deployed as a single executable with embedded frontend code, focusing on speed, simplicity, and multi-session support.

## System Requirements

### Deployment
- **Single executable** - Frontend embedded in Go binary
- **Single shop** - No multi-location complexity
- **Local database** - PostgreSQL or SQLite
- **No external dependencies** - Fully self-contained

### Functional Requirements
- Fast product search with barcode support
- Multi-session tab interface for concurrent customers
- Simple payment recording (no actual processing)
- Basic inventory integration
- Receipt generation and display
- Simple role-based access (Admin/Manager/Staff)

## Current Frontend Analysis

### Existing Structure
```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui components ✅
│   ├── forms/           # Form components ✅
│   └── layout/          # Layout components ✅
├── pages/               # Business pages ✅
├── stores/              # Zustand state management ✅
├── services/            # API services ✅
└── types/               # TypeScript definitions ✅
```

### Existing Components to Leverage
- ✅ Authentication system with role-based access
- ✅ shadcn/ui design system
- ✅ Product management pages and forms
- ✅ Customer management
- ✅ Barcode scanner components
- ✅ API service layer with React Query

## Implementation Plan

### Phase 1: Core POS Interface (Week 1)
**Duration**: 5 days
**Goal**: Build the fundamental POS interface components

#### 1.1 POS Layout Architecture
**Tasks**:
- Create dedicated POS layout (`components/pos/POSLayout.tsx`)
- Add POS navigation in sidebar
- Design distraction-free POS interface
- Implement responsive design for different screen sizes

**Components to Create**:
```typescript
// components/pos/POSLayout.tsx
interface POSLayoutProps {
  children: React.ReactNode;
}

// pages/POS.tsx  
interface POSPageProps {
  sessionId?: string;
}
```

#### 1.2 Product Search System
**Tasks**:
- Build fast product search component with debouncing
- Integrate existing barcode scanner
- Add product quick-select by category
- Implement keyboard navigation (Enter, Escape, Arrows)

**Components to Create**:
```typescript
// components/pos/ProductSearch.tsx
interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  onBarcodeScanned?: (barcode: string) => void;
}

// hooks/usePOSProductSearch.ts
interface ProductSearchResult {
  products: Product[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}
```

#### 1.3 Shopping Cart Component
**Tasks**:
- Create shopping cart with add/remove/quantity controls
- Add real-time price calculations
- Implement tax and discount calculations
- Add cart persistence in session storage

**Components to Create**:
```typescript
// components/pos/ShoppingCart.tsx
interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

// stores/posCartStore.ts
interface POSCartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}
```

#### 1.4 Customer Selection
**Tasks**:
- Add customer search and selection
- Support for walk-in customers (no customer record)
- Quick customer creation form
- Customer purchase history display

**Components to Create**:
```typescript
// components/pos/CustomerSelect.tsx
interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}
```

---

### Phase 2: Multi-Session Support (Week 1-2)
**Duration**: 3 days
**Goal**: Enable handling multiple customers simultaneously

#### 2.1 Session Management System
**Tasks**:
- Create session store with unique identifiers
- Implement tab-based interface for multiple sessions
- Add session switching without data loss
- Session persistence in localStorage

**Components to Create**:
```typescript
// stores/posSessionStore.ts
interface POSSession {
  id: string;
  customerId?: string;
  customerName?: string;
  cart: CartItem[];
  createdAt: Date;
  lastActivity: Date;
}

interface POSSessionState {
  sessions: POSSession[];
  activeSessionId: string | null;
  createSession: () => string;
  switchSession: (sessionId: string) => void;
  closeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<POSSession>) => void;
}

// components/pos/SessionTabs.tsx
interface SessionTabsProps {
  sessions: POSSession[];
  activeSessionId: string | null;
  onSessionSwitch: (sessionId: string) => void;
  onSessionClose: (sessionId: string) => void;
  onNewSession: () => void;
}
```

#### 2.2 Session Isolation
**Tasks**:
- Ensure cart data is session-specific
- Customer selection per session
- Independent calculations per session
- Session cleanup after timeout

---

### Phase 3: Checkout Flow (Week 2)
**Duration**: 4 days
**Goal**: Complete the sales transaction process

#### 3.1 Payment Recording
**Tasks**:
- Create payment method selection (Cash, Card, Bank Transfer)
- Add payment amount input with change calculation
- Support split payments (multiple payment methods)
- Simple payment validation

**Components to Create**:
```typescript
// components/pos/PaymentForm.tsx
interface PaymentMethod {
  type: 'cash' | 'card' | 'bank_transfer';
  amount: number;
  reference?: string;
}

interface PaymentFormProps {
  totalAmount: number;
  onPaymentComplete: (payments: PaymentMethod[]) => void;
}

// components/pos/ChangeCalculator.tsx
interface ChangeCalculatorProps {
  totalAmount: number;
  paidAmount: number;
}
```

#### 3.2 Transaction Completion
**Tasks**:
- Create sale completion workflow
- Integrate with backend sales API
- Update inventory automatically
- Clear session after successful sale

#### 3.3 Receipt System
**Tasks**:
- Design receipt display component
- Add print functionality (if printer available)
- Receipt data formatting
- Save receipt for reprinting

**Components to Create**:
```typescript
// components/pos/Receipt.tsx
interface ReceiptProps {
  sale: Sale;
  customer?: Customer;
  onPrint?: () => void;
  onClose: () => void;
}

// components/pos/ReceiptPreview.tsx
interface ReceiptData {
  saleId: string;
  billNumber: string;
  items: CartItem[];
  payments: PaymentMethod[];
  customer?: Customer;
  cashier: User;
  timestamp: Date;
}
```

---

### Phase 4: Role-Based Features (Week 2-3)
**Duration**: 3 days
**Goal**: Implement simple role-based interface differences

#### 4.1 Staff Interface
**Tasks**:
- POS operations only (no settings/reports)
- Limited customer management
- Basic product search and checkout
- View own sales history

#### 4.2 Manager Interface
**Tasks**:
- All staff features plus:
- Daily sales reporting
- Inventory levels overview
- Customer management
- User activity monitoring

**Components to Create**:
```typescript
// components/pos/POSReports.tsx
interface DailySalesReport {
  date: Date;
  totalSales: number;
  totalTransactions: number;
  topProducts: Product[];
  paymentMethods: { method: string; amount: number }[];
}

// components/pos/ManagerDashboard.tsx
interface ManagerDashboardProps {
  user: User;
}
```

#### 4.3 Admin Interface
**Tasks**:
- All manager features plus:
- User management
- System settings
- Full audit access
- Data export capabilities

---

### Phase 5: Performance & Polish (Week 3)
**Duration**: 3 days
**Goal**: Optimize performance and user experience

#### 5.1 Performance Optimization
**Tasks**:
- Implement product search debouncing (300ms)
- Add virtual scrolling for large product lists
- Optimize cart calculations
- Lazy load components

#### 5.2 Keyboard Shortcuts
**Tasks**:
- F1: New session
- F2: Customer search
- F3: Product search
- F4: Process payment
- Esc: Cancel current action
- Enter: Confirm actions

**Components to Create**:
```typescript
// hooks/useKeyboardShortcuts.ts
interface KeyboardShortcuts {
  'F1': () => void;  // New session
  'F2': () => void;  // Customer search
  'F3': () => void;  // Product search
  'F4': () => void;  // Process payment
  'Escape': () => void;  // Cancel
}
```

#### 5.3 Error Handling & Validation
**Tasks**:
- Add form validation with Zod schemas
- Implement error boundaries
- User-friendly error messages
- Network error handling

#### 5.4 Testing & Bug Fixes
**Tasks**:
- Component testing with React Testing Library
- Integration testing for POS workflows
- User acceptance testing
- Performance testing with large product catalogs

---

## Technical Implementation Details

### State Management Strategy
```typescript
// Zustand stores organization
stores/
├── authStore.ts         # Existing auth state ✅
├── posSessionStore.ts   # Multi-session management
├── posCartStore.ts      # Shopping cart state
└── posSettingsStore.ts  # POS configuration
```

### API Integration
```typescript
// services/posService.ts
export const posService = {
  searchProducts: (query: string, barcode?: string) => Promise<Product[]>,
  validateStock: (items: CartItem[]) => Promise<StockValidation>,
  calculateTotals: (items: CartItem[], customerId?: string) => Promise<TotalCalculation>,
  processSale: (saleData: SaleRequest) => Promise<Sale>,
  generateReceipt: (saleId: string) => Promise<ReceiptData>
};
```

### Component Architecture
```
components/pos/
├── POSLayout.tsx           # Main POS layout
├── SessionTabs.tsx         # Multi-session tabs
├── ProductSearch.tsx       # Product search with barcode
├── ShoppingCart.tsx        # Cart with calculations
├── CustomerSelect.tsx      # Customer selection
├── PaymentForm.tsx         # Payment recording
├── Receipt.tsx             # Receipt display/print
├── POSReports.tsx          # Basic sales reports
└── KeyboardShortcuts.tsx   # Keyboard navigation
```

### Data Flow
```
User Action → Component → Store → API Service → Backend
                ↓
            UI Update ← Store Update ← API Response
```

## Integration Points

### Existing Components to Extend
- **BarcodeScanner**: Integrate into product search
- **ProductForm**: Use for quick product creation
- **CustomerForm**: Use for quick customer creation
- **Button/Input/Dialog**: Use throughout POS interface

### New Routes to Add
```typescript
// App.tsx routes
<Route path="/pos" element={<POSLayout />}>
  <Route index element={<POS />} />
  <Route path="session/:sessionId" element={<POS />} />
</Route>
```

### Backend API Requirements
```typescript
// Expected API endpoints (for backend team)
GET    /api/v1/pos/products/search?q={query}&barcode={barcode}
POST   /api/v1/pos/sales                    # Create sale
GET    /api/v1/pos/sales/daily             # Daily sales report
POST   /api/v1/pos/validate-stock          # Validate cart items
```

## User Experience Considerations

### Performance Targets
- Product search response: < 200ms
- Cart updates: < 50ms
- Transaction completion: < 1s
- Receipt generation: < 500ms

### Accessibility
- Full keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Large text options for visibility

### Error Prevention
- Stock validation before checkout
- Duplicate item detection
- Customer selection validation
- Payment amount validation

## Security Considerations

### Session Security
- Session IDs are not security tokens (frontend only)
- User authentication remains required
- All transactions logged with user ID
- No sensitive payment data stored

### Data Validation
- Client-side validation for UX
- Server-side validation for security
- Input sanitization for search queries
- Amount validation for payments

## Deployment Considerations

### Build Integration
- Frontend builds into `dist/` folder
- Go embeds frontend files
- Static assets served by Go server
- Single executable deployment

### Configuration
```typescript
// config/pos.ts
export const posConfig = {
  maxSessions: 10,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  searchDebounce: 300,
  autoSaveInterval: 5000,
  receiptPrinter: {
    enabled: false, // Configure based on hardware
    paperWidth: 80 // mm
  }
};
```

This plan provides a comprehensive roadmap for implementing a simplified, high-performance POS system that leverages your existing frontend architecture while adding the specific functionality needed for point-of-sale operations.
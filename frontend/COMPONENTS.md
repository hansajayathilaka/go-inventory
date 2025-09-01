# Component Documentation

This document provides an overview of the shadcn/ui component system implemented in the Vehicle Spare Parts Shop frontend.

## Component Architecture

### Core shadcn/ui Components

The project uses **24+ shadcn/ui components** for consistent design and accessibility:

#### Form Components
- **Button**: Primary, secondary, destructive, outline, ghost variants
- **Input**: Text inputs with validation states
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection with search
- **Checkbox**: Checkbox with intermediate state
- **Switch**: Toggle switch component
- **RadioGroup**: Radio button groups

#### Layout Components
- **Card**: Content containers with header/body/footer
- **Dialog**: Modal dialogs replacing legacy modals
- **AlertDialog**: Confirmation dialogs for destructive actions
- **Popover**: Floating content containers
- **Dropdown Menu**: Context menus and action menus
- **Tabs**: Tabbed content organization
- **Separator**: Visual content separation

#### Data Display
- **Table**: Data tables with sorting and pagination
- **Badge**: Status indicators and tags
- **Alert**: Notification and warning messages
- **Progress**: Progress bars and loading indicators

#### Navigation
- **Command**: Command palette and search
- **Breadcrumb**: Navigation breadcrumbs

#### Feedback
- **Toast**: Non-intrusive notifications via useToast hook
- **Skeleton**: Loading state placeholders

#### Utility
- **ScrollArea**: Custom scrollable areas
- **Collapsible**: Expandable/collapsible content

### Custom Component Wrappers

#### PageHeader
```typescript
interface PageHeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}
```
Standardized page header with breadcrumb navigation.

#### DataTable
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
}
```
Enhanced table component with built-in search, filtering, and pagination.

#### FormModal
```typescript
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
}
```
Wrapper for CRUD operation modals with consistent styling.

#### SearchInput
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}
```
Debounced search input for real-time filtering.

#### StatusBadge
```typescript
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed';
  variant?: 'default' | 'secondary' | 'destructive';
}
```
Consistent status indication across the application.

### Enhanced Components

#### SearchableTreeSelect
Advanced hierarchical category selection component:
- Tree-based category navigation
- Search functionality with highlighting
- Icon mapping for visual hierarchy
- Multi-level category support
- Keyboard navigation support

#### CategoryTree
Hierarchical category display:
- Expandable/collapsible tree structure
- Product count indicators
- Icon-based category identification
- Drag-and-drop support (planned)

## Component Usage Patterns

### Standard CRUD Page Pattern
```typescript
const StandardCRUDPage = () => {
  return (
    <>
      <PageHeader title="Page Title" breadcrumbs={breadcrumbs}>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <SearchInput value={search} onChange={setSearch} />
        </CardHeader>
        <CardContent>
          <DataTable data={data} columns={columns} />
        </CardContent>
      </Card>
    </>
  );
};
```

### Modal Pattern
```typescript
const ModalPattern = () => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form content */}
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### Confirmation Pattern
```typescript
const ConfirmationPattern = () => {
  return (
    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

## Performance Components

### Loading States
- **LoadingCard**: Card-based loading placeholder
- **LoadingTable**: Table skeleton loading
- **LoadingGrid**: Grid layout loading states
- **LoadingForm**: Form field loading placeholders
- **LoadingSearch**: Search input loading state

### Error Handling
- **ErrorBoundary**: React error boundary for graceful error handling
- **ErrorDisplay**: Standardized error message display

### Optimization
- **VirtualizedList**: Efficient rendering for large datasets
- **Memoized components**: React.memo for performance optimization

## Accessibility Features

All components include:
- **ARIA labels** and descriptions
- **Keyboard navigation** support
- **Focus management** for modals and dropdowns
- **Screen reader** compatibility
- **High contrast** theme support
- **Semantic HTML** structure

## Migration Status

### ✅ Migrated Components
- Authentication pages (LoginPage)
- Layout components (Sidebar, Header)
- Core business pages (Dashboard, Products, Purchase Receipts)
- CRUD pages (Customers, Brands, Suppliers, Users, etc.)

### 🚧 Remaining Theme Fixes
16 components require hardcoded color token replacement:
- 8 modal components (VehicleModelModal, SupplierModal, etc.)
- 6 specialized components (POSLookup, SearchableTreeSelect)
- 2 pages (AuditPage, VehicleManagementPage)

See `THEME_FIXES_REMAINING.md` for detailed migration plan.

## Best Practices

### Component Creation
1. Use shadcn/ui components as building blocks
2. Create custom wrappers for common patterns
3. Implement proper TypeScript interfaces
4. Add loading and error states
5. Include accessibility attributes

### Styling
1. Use shadcn/ui design tokens exclusively
2. Avoid hardcoded colors (bg-white, text-gray-*)
3. Use theme-aware color variables
4. Implement proper dark/light mode support

### State Management
1. Use React hooks for local state
2. Implement proper error boundaries
3. Add loading states for async operations
4. Use toast notifications for user feedback

## Future Enhancements

1. **Storybook Integration**: Component documentation and testing
2. **Design Tokens**: Extended color and spacing system
3. **Animation System**: Consistent motion design
4. **Advanced Components**: Data visualization, charts
5. **Performance Monitoring**: Component render optimization
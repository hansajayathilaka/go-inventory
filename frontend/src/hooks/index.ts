// Query hooks exports
export {
  QUERY_KEYS,
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCategories,
  useCreateCategory,
  useBrands,
  useCreateBrand,
  useSuppliers,
  useCreateSupplier,
  usePurchaseReceipts,
  usePurchaseReceipt,
  useDashboardStats,
  useLowStockProducts,
  useStockAdjustment,
  useCategoryHierarchy,
} from './useInventoryQueries';

// Utility hooks
export { useDebounce } from './useDebounce';

// POS-specific hooks
export { 
  useKeyboardShortcuts, 
  useShortcutDisplay,
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CONTEXTS,
  ShortcutUtils,
  type ShortcutHandlers,
  type UseKeyboardShortcutsOptions,
  type ShortcutContextType,
  type KeyboardShortcut
} from './useKeyboardShortcuts';
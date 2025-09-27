import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Customer } from '@/services/customerService';

interface SelectedCustomer {
  id: number | string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_purchases?: number;
  last_purchase_date?: string;
  // Additional POS-specific customer data
  sessionId?: string;
  selectedAt?: Date;
}

interface WalkInCustomer {
  id: 'walk-in';
  name: 'Walk-in Customer';
  code: 'WALK-IN';
  is_active: true;
  created_at: string;
  updated_at: string;
}

interface QuickCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  isQuickCustomer: true;
}

type POSCustomer = SelectedCustomer | WalkInCustomer | QuickCustomer;

interface CustomerState {
  // Session-specific customer selections
  sessionCustomers: Record<string, POSCustomer | null>;

  // Recently selected customers for quick access
  recentCustomers: Customer[];

  // Search and selection state
  searchResults: Customer[];
  isSearching: boolean;
  searchError: string | null;

  // Walk-in customer instance
  walkInCustomer: WalkInCustomer;
}

interface CustomerActions {
  // Customer selection for sessions
  selectCustomer: (sessionId: string, customer: Customer | WalkInCustomer | QuickCustomer) => void;
  clearCustomer: (sessionId: string) => void;
  getSessionCustomer: (sessionId: string) => POSCustomer | null;

  // Search functionality
  searchCustomers: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Recent customers management
  addToRecent: (customer: Customer) => void;
  clearRecent: () => void;
  loadRecentCustomers: () => Promise<void>;

  // Quick customer creation
  createQuickCustomer: (sessionId: string, name: string, phone?: string, email?: string) => void;

  // Walk-in customer
  selectWalkInCustomer: (sessionId: string) => void;
}

interface POSCustomerStore extends CustomerState, CustomerActions {}

const createWalkInCustomer = (): WalkInCustomer => ({
  id: 'walk-in',
  name: 'Walk-in Customer',
  code: 'WALK-IN',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const usePOSCustomerStore = create<POSCustomerStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessionCustomers: {},
        recentCustomers: [],
        searchResults: [],
        isSearching: false,
        searchError: null,
        walkInCustomer: createWalkInCustomer(),

        // Customer selection actions
        selectCustomer: (sessionId: string, customer: Customer | WalkInCustomer | QuickCustomer) => {
          set((state) => {
            let selectedCustomer: POSCustomer;

            if (customer.id === 'walk-in') {
              selectedCustomer = customer as WalkInCustomer;
            } else if ('isQuickCustomer' in customer && customer.isQuickCustomer) {
              selectedCustomer = customer as QuickCustomer;
            } else {
              // Full customer
              selectedCustomer = {
                ...(customer as Customer),
                sessionId,
                selectedAt: new Date(),
              } as SelectedCustomer;

              // Add to recent
              get().addToRecent(customer as Customer);
            }

            return {
              sessionCustomers: {
                ...state.sessionCustomers,
                [sessionId]: selectedCustomer,
              },
            };
          });
        },

        clearCustomer: (sessionId: string) => {
          set((state) => ({
            sessionCustomers: {
              ...state.sessionCustomers,
              [sessionId]: null,
            },
          }));
        },

        getSessionCustomer: (sessionId: string) => {
          return get().sessionCustomers[sessionId] || null;
        },

        // Search functionality
        searchCustomers: async (query: string) => {
          if (!query.trim()) {
            set({ searchResults: [], searchError: null });
            return;
          }

          set({ isSearching: true, searchError: null });

          try {
            // Import here to avoid circular dependencies
            const { customerService } = await import('@/services/customerService');

            const response = await customerService.searchCustomers({
              search: query,
              is_active: true,
              limit: 20,
            });

            set({
              searchResults: response.customers,
              isSearching: false,
              searchError: null,
            });
          } catch (error) {
            console.error('Customer search failed:', error);
            set({
              searchResults: [],
              isSearching: false,
              searchError: error instanceof Error ? error.message : 'Search failed',
            });
          }
        },

        clearSearch: () => {
          set({
            searchResults: [],
            searchError: null,
          });
        },

        // Quick customer creation
        createQuickCustomer: (sessionId: string, name: string, phone?: string, email?: string) => {
          const quickCustomer: QuickCustomer = {
            id: `quick-${Date.now()}`,
            name,
            phone,
            email,
            isQuickCustomer: true,
          };

          get().selectCustomer(sessionId, quickCustomer);
        },

        // Recent customers management
        addToRecent: (customer: Customer) => {
          set((state) => {
            // Fix: Compare IDs as strings to handle both numeric and UUID IDs
            const existingIndex = state.recentCustomers.findIndex(c => String(c.id) === String(customer.id));
            let updatedRecent = [...state.recentCustomers];

            if (existingIndex !== -1) {
              // Move to front if already exists
              updatedRecent.splice(existingIndex, 1);
            }

            // Add to front and limit to 10 recent customers
            updatedRecent.unshift(customer);
            updatedRecent = updatedRecent.slice(0, 10);

            return {
              recentCustomers: updatedRecent,
            };
          });
        },

        clearRecent: () => {
          set({ recentCustomers: [] });
        },

        // Load recent customers from API
        loadRecentCustomers: async () => {
          try {
            // Import here to avoid circular dependencies
            const { customerService } = await import('@/services/customerService');

            const customers = await customerService.getActiveCustomers(10);

            set({
              recentCustomers: customers,
            });
          } catch (error) {
            console.error('Failed to load recent customers:', error);
            // Don't set error state for recent customers, just keep empty array
          }
        },

        // Walk-in customer
        selectWalkInCustomer: (sessionId: string) => {
          get().selectCustomer(sessionId, get().walkInCustomer);
        },
      }),
      {
        name: 'pos-customer-store',
        partialize: (state) => ({
          sessionCustomers: state.sessionCustomers,
          recentCustomers: state.recentCustomers,
        }),
      }
    ),
    {
      name: 'pos-customer-store',
    }
  )
);
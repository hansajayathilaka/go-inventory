import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { SessionTabs } from './SessionTabs'
import { RoleBasedPOSAccess, RoleIndicator, useUserRole } from './RoleBasedPOSAccess'
import { initializePOSSession } from '@/stores/posSessionStore'
import { initializeCartSessionSync } from '@/stores/posCartStore'
import { 
  Store,
  LogOut,
  User,
  Settings,
  ArrowLeft,
  BarChart3,
  Users,
  Package
} from 'lucide-react'

interface StaffPOSLayoutProps {
  children?: React.ReactNode
  restrictedFeatures?: string[]
}

export function StaffPOSLayout({ children, restrictedFeatures = [] }: StaffPOSLayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { hasRole, isStaff, roleDisplayName } = useUserRole()

  // Initialize POS session system and cart synchronization
  useEffect(() => {
    const cleanupSession = initializePOSSession()
    const cleanupSync = initializeCartSessionSync()
    
    return () => {
      cleanupSession()
      cleanupSync()
    }
  }, [])

  // Get available features based on role
  const getAvailableFeatures = () => {
    const baseFeatures = ['transactions', 'product_search', 'checkout']
    
    if (hasRole('manager')) {
      return [...baseFeatures, 'reports', 'customer_management', 'settings', 'inventory_view']
    }
    
    if (hasRole('staff')) {
      return [...baseFeatures, 'basic_customer_management', 'personal_history']
    }
    
    return baseFeatures // viewer role
  }

  const availableFeatures = getAvailableFeatures()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Enhanced Header Bar with Role Information */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-2 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
          {/* Left side - App branding and back button */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-semibold text-sm sm:text-lg hidden sm:block">Hardware Store POS</span>
              <span className="font-semibold text-sm sm:hidden">POS</span>
            </div>
            
            {/* Role-based back button */}
            <RoleBasedPOSAccess requiredRole="manager" showFallback={false}>
              {location.pathname !== '/' && (
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Admin
                  </Link>
                </Button>
              )}
              
              {/* Mobile back button */}
              {location.pathname !== '/' && (
                <Button variant="ghost" size="sm" asChild className="sm:hidden p-1">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </RoleBasedPOSAccess>

            {/* Staff users get a simplified navigation */}
            {isStaff && (
              <div className="text-xs text-gray-500 hidden sm:block">
                Point of Sale Terminal
              </div>
            )}
          </div>

          {/* Right side - User info and controls */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Enhanced user info with role indicator */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-gray-100 rounded-md">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                <span className="text-xs sm:text-sm font-medium hidden sm:block">{user.username}</span>
                <RoleIndicator />
              </div>
            )}

            {/* Role-based action buttons */}
            <div className="flex items-center space-x-1">
              {/* Settings - Manager and Admin only */}
              <RoleBasedPOSAccess requiredRole="manager" showFallback={false}>
                <Button variant="ghost" size="sm" className="p-1 sm:p-2" title="Settings">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </RoleBasedPOSAccess>

              {/* Manager Interface - Manager and Admin only */}
              <RoleBasedPOSAccess requiredRole="manager" showFallback={false}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 sm:p-2" 
                  title="Manager Interface"
                  asChild
                >
                  <Link to="/pos/manager">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </RoleBasedPOSAccess>

              {/* Customer Management - Different access levels */}
              {availableFeatures.includes('customer_management') && (
                <Button variant="ghost" size="sm" className="p-1 sm:p-2" title="Customer Management">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}

              {/* Inventory View - Manager and Admin only */}
              <RoleBasedPOSAccess requiredRole="manager" showFallback={false}>
                <Button variant="ghost" size="sm" className="p-1 sm:p-2" title="Inventory">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </RoleBasedPOSAccess>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1 sm:p-2"
                title="Logout"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Staff-specific notification bar */}
      {isStaff && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="text-blue-800">
              <strong>{roleDisplayName} Mode:</strong> Access to POS operations and basic customer management
            </div>
            <div className="text-blue-600 text-xs">
              ID: {user?.id} | Session Active
            </div>
          </div>
        </div>
      )}

      {/* Session Tabs - Only show when on POS pages */}
      {location.pathname.startsWith('/pos') && (
        <SessionTabs className={`sticky z-40 ${isStaff ? 'top-20' : 'top-12 sm:top-14'}`} />
      )}

      {/* Main Content Area with role-based restrictions */}
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Enhanced Footer with role and feature information */}
      <footer className="bg-white border-t px-2 sm:px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block">POS System v1.0</span>
            <span className="sm:hidden">v1.0</span>
            {isStaff && (
              <span className="hidden sm:block text-blue-600">
                Staff Terminal • Limited Access
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <span className="text-xs">
                {user.username} • {roleDisplayName}
              </span>
            )}
            <span className="text-xs">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Export a factory function for creating role-specific layouts
export const createRoleSpecificLayout = (role: 'staff' | 'manager' | 'admin') => {
  return function RoleSpecificLayout({ children }: { children?: React.ReactNode }) {
    const { hasRole } = useUserRole()
    
    // If user doesn't have the required role, show access denied
    if (!hasRole(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <Settings className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              This area requires {role} privileges or higher.
            </p>
          </div>
        </div>
      )
    }
    
    return <StaffPOSLayout>{children}</StaffPOSLayout>
  }
}

// Pre-configured layouts for different roles
export const StaffOnlyLayout = createRoleSpecificLayout('staff')
export const ManagerOnlyLayout = createRoleSpecificLayout('manager') 
export const AdminOnlyLayout = createRoleSpecificLayout('admin')
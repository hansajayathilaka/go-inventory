import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AlertTriangle, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type UserRole = 'viewer' | 'staff' | 'manager' | 'admin'

interface RoleBasedPOSAccessProps {
  children: ReactNode
  requiredRole: UserRole
  fallbackComponent?: ReactNode
  showFallback?: boolean
  className?: string
}

// Define role hierarchy - higher numbers have more access
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  staff: 2,
  manager: 3,
  admin: 4
}

// Helper function to check if user has sufficient role
const hasRequiredRole = (userRole: string, requiredRole: UserRole): boolean => {
  const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

// Helper function to get role display name
const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    viewer: 'Viewer',
    staff: 'Staff',
    manager: 'Manager', 
    admin: 'Administrator'
  }
  return roleNames[role] || role
}

export function RoleBasedPOSAccess({
  children,
  requiredRole,
  fallbackComponent,
  showFallback = true,
  className
}: RoleBasedPOSAccessProps) {
  const { user, isAuthenticated } = useAuthStore()

  // If not authenticated, show nothing or fallback
  if (!isAuthenticated || !user) {
    if (showFallback && fallbackComponent) {
      return <div className={className}>{fallbackComponent}</div>
    }
    return null
  }

  // Check if user has required role
  const hasAccess = hasRequiredRole(user.role, requiredRole)

  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  // User doesn't have access - show fallback or nothing
  if (showFallback) {
    if (fallbackComponent) {
      return <div className={className}>{fallbackComponent}</div>
    }

    // Default fallback - show access denied message
    return (
      <div className={className}>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Access Restricted</strong>
            <br />
            This feature requires {getRoleDisplayName(requiredRole)} role or higher. 
            Your current role: {getRoleDisplayName(user.role)}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return null
}

// Hook for getting current user role information
export const useUserRole = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  return {
    user,
    isAuthenticated,
    role: user?.role as UserRole,
    hasRole: (requiredRole: UserRole) => {
      if (!user) return false
      return hasRequiredRole(user.role, requiredRole)
    },
    isStaff: user?.role === 'staff',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    roleDisplayName: user ? getRoleDisplayName(user.role) : 'Guest'
  }
}

// Component for showing role-specific navigation or UI elements
export function RoleIndicator({ className }: { className?: string }) {
  const { user, roleDisplayName, isAuthenticated } = useUserRole()

  if (!isAuthenticated || !user) {
    return null
  }

  const roleColorClass = {
    viewer: 'bg-gray-100 text-gray-800',
    staff: 'bg-blue-100 text-blue-800', 
    manager: 'bg-green-100 text-green-800',
    admin: 'bg-purple-100 text-purple-800'
  }[user.role as UserRole] || 'bg-gray-100 text-gray-800'

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${roleColorClass} ${className}`}>
      <span>{roleDisplayName}</span>
    </div>
  )
}

// Higher-order component for wrapping entire sections with role-based access
export function withRoleAccess<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  requiredRole: UserRole,
  fallbackComponent?: ReactNode
) {
  return function RoleProtectedComponent(props: T) {
    return (
      <RoleBasedPOSAccess requiredRole={requiredRole} fallbackComponent={fallbackComponent}>
        <Component {...props} />
      </RoleBasedPOSAccess>
    )
  }
}
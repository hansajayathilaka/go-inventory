import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { 
  Store,
  LogOut,
  User,
  Settings,
  ArrowLeft
} from 'lucide-react'

interface POSLayoutProps {
  children?: React.ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header Bar - Responsive */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-2 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
          {/* Left side - App branding and back button */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-semibold text-sm sm:text-lg hidden sm:block">Hardware Store POS</span>
              <span className="font-semibold text-sm sm:hidden">POS</span>
            </div>
            
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
          </div>

          {/* Right side - User info and controls - Responsive */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Current user info */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-gray-100 rounded-md">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                <span className="text-xs sm:text-sm font-medium hidden sm:block">{user.username}</span>
                <span className="text-xs text-gray-500 bg-white px-1 sm:px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1 sm:p-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Full width, distraction-free */}
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Optional Footer for system info - Responsive */}
      <footer className="bg-white border-t px-2 sm:px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="hidden sm:block">POS System v1.0</span>
          <span className="sm:hidden">v1.0</span>
          <span className="text-xs">{new Date().toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  )
}
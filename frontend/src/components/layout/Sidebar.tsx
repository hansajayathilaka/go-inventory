import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Building2,
  UserCog,
  LogOut,
  User,
  Store
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'POS System',
    href: '/pos',
    icon: Store,
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Categories',
    href: '/categories',
    icon: FolderTree,
  },
  {
    name: 'Purchase Receipts',
    href: '/purchase-receipts',
    icon: ShoppingCart,
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    icon: Building2,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserCog,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className={cn("pb-12 w-64 flex flex-col", className)}>
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Hardware Store
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-muted font-medium"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* User info and logout section */}
      <div className="px-3 py-2 border-t">
        {user && (
          <div className="mb-2 px-3 py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4" />
              <span className="font-medium text-foreground">{user.username}</span>
            </div>
            <div className="text-xs">
              Role: {user.role}
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
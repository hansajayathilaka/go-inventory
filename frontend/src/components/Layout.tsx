import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Warehouse, 
  Truck, 
  Users, 
  FileText, 
  Menu, 
  X,
  LogOut,
  User,
  Car,
  FileCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Categories', href: '/categories', icon: FolderTree },
    { name: 'Inventory', href: '/inventory', icon: Warehouse },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Vehicle Management', href: '/vehicle-management', icon: Car },
    { name: 'Purchase Receipts', href: '/purchase-receipts', icon: FileCheck },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Admin', href: '/users', icon: User },
    { name: 'Audit Logs', href: '/audit', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-3 text-2xl font-semibold text-foreground md:ml-0">
                Vehicle Spare Parts Inventory
              </h1>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-foreground">
                <User className="h-5 w-5 mr-2" />
                <span>Shop Owner</span>
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar content component
const SidebarContent: React.FC<{
  navigation: Array<{ name: string; href: string; icon: LucideIcon; badge?: string }>;
  currentPath: string;
}> = ({ navigation, currentPath }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-blue-800">
        <Warehouse className="h-8 w-8 text-white mr-3" />
        <span className="text-xl font-bold text-white">Inventory Pro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 bg-background overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground'
                    }`}
                  />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="ml-auto px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 bg-muted/50 p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Vehicle Spare Parts Inventory v2.0<br />
          <span className="text-primary">Comprehensive Management</span> • Single Location
        </div>
      </div>
    </div>
  );
};

export default Layout;
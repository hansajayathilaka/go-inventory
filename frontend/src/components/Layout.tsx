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
  LogOut,
  User,
  Car,
  FileCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
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
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-border">
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              {/* Mobile menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent navigation={navigation} currentPath={location.pathname} />
                </SheetContent>
              </Sheet>
              
              <h1 className="ml-3 text-2xl font-semibold text-foreground md:ml-0">
                Vehicle Spare Parts Inventory
              </h1>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center text-sm text-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>Shop Owner</span>
              </div>
              <ThemeToggle />
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
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
    <div className="flex flex-col h-full bg-background">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-primary">
        <Warehouse className="h-8 w-8 text-primary-foreground mr-3" />
        <span className="text-xl font-bold text-primary-foreground">Inventory Pro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start h-10 px-3 ${
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>

      <Separator />
      
      {/* Footer */}
      <div className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          <div className="font-medium mb-1">Vehicle Spare Parts Inventory</div>
          <div className="text-primary">v2.0 • Comprehensive Management</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
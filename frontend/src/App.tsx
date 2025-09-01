import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import BrandsPage from './pages/BrandsPage';
import VehicleBrandsPage from './pages/VehicleBrandsPage';
import VehicleModelsPage from './pages/VehicleModelsPage';
import CompatibilitiesPage from './pages/CompatibilitiesPage';
import VehicleManagementPage from './pages/VehicleManagementPage';
import PurchaseReceiptsPage from './pages/PurchaseReceiptsPage';
import CreatePurchaseReceiptPage from './pages/CreatePurchaseReceiptPage';
import AuditPage from './pages/AuditPage';

// Demo Components
import CategoryIconDemo from './components/SearchableTreeSelect/CategoryIconDemo';

// Layout
import Layout from './components/Layout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Auth check helper
const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
        <Router>
          <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoriesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuppliersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CustomersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/brands"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BrandsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/vehicle-brands"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleBrandsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/vehicle-models"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleModelsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/compatibilities"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CompatibilitiesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/purchase-receipts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseReceiptsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/purchase-receipts/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePurchaseReceiptPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/purchase-receipts/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePurchaseReceiptPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/purchase-receipts/view/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePurchaseReceiptPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/purchase-receipts/receive/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePurchaseReceiptPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/vehicle-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VehicleManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AuditPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/category-demo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryIconDemo />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
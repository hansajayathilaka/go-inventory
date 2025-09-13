import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { POSLayout } from './components/pos/POSLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { PurchaseReceipts } from './pages/PurchaseReceipts';
import { Suppliers } from './pages/Suppliers';
import { Customers } from './pages/Customers';
import { Users } from './pages/Users';
import { POS } from './pages/POS';
import { POSSimple } from './pages/POSSimple';
import { POSMinimal } from './pages/POSMinimal';
import { POSWorking } from './pages/POSWorking';
import { POSBasic } from './pages/POSBasic';
import { POSManagerInterface } from './components/pos/POSManagerInterface';
import { Login } from './pages/Login';
import { QueryProvider } from './providers/QueryProvider';
import { useAuthStore } from './stores/authStore';
import { initializeAuth } from './stores/authStore';

function AuthenticatedApp() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/purchase-receipts" element={<PurchaseReceipts />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/users" element={<Users />} />
        </Route>
        <Route path="/pos" element={<POSLayout />}>
          <Route index element={<POSBasic />} />
          <Route path="working" element={<POSWorking />} />
          <Route path="minimal" element={<POSMinimal />} />
          <Route path="full" element={<POS />} />
          <Route path="simple" element={<POSSimple />} />
          <Route path="manager" element={<POSManagerInterface />} />
          <Route path="session/:sessionId" element={<POS />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeAuth().finally(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
      <AuthenticatedApp />
    </QueryProvider>
  );
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { PurchaseReceipts } from './pages/PurchaseReceipts'
import { Suppliers } from './pages/Suppliers'
import { Customers } from './pages/Customers'
import { Vehicles } from './pages/Vehicles'
import { Users } from './pages/Users'
import { Login } from './pages/Login'

function App() {
  // TODO: Add authentication check
  const isAuthenticated = true

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchase-receipts" element={<PurchaseReceipts />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/users" element={<Users />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App

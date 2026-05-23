import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useState } from 'react'

// Layout
import Layout from './components/layout/Layout'
import SplashScreen from './components/layout/SplashScreen'

// Storefront pages
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Wishlist from './pages/Wishlist'
import About from './pages/About'
import Policies from './pages/Policies'
import NotFound from './pages/NotFound'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminInventory from './pages/admin/Inventory'
import AdminCustomers from './pages/admin/Customers'
import AdminAnalytics from './pages/admin/Analytics'
import AdminCoupons from './pages/admin/Coupons'
import AdminReturns from './pages/admin/Returns'
import AdminReviews from './pages/admin/Reviews'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'
import AdminAuditLog from './pages/admin/AuditLog'
import AdminGuard from './components/admin/AdminGuard'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <AuthProvider>
      <CartProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: '#1a1a1a', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600 },
            duration: 3000
          }}
        />
        <Routes>
          {/* Public storefront */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="account" element={<Account />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="about" element={<About />} />
            <Route path="policies" element={<Policies />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin panel — all routes protected */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAuditLog />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}

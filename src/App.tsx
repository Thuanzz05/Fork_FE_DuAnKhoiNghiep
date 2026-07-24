import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import CartToast from './components/CartToast'
import CustomerChatWidget from './components/CustomerChatWidget'
import BackToTopButton from './components/BackToTopButton'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import ContactPage from './pages/ContactPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import AccountPage from './pages/AccountPage'
import ShippingPolicyPage from './pages/ShippingPolicyPage'
import ReturnPolicyPage from './pages/ReturnPolicyPage'
import SalesPolicyPage from './pages/SalesPolicyPage'
import CustomerAccountPage from './pages/CustomerAccountPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import CustomerOrdersPage from './pages/CustomerOrdersPage'
import CheckoutPage from './pages/CheckoutPage'
import SePayPaymentPage from './pages/SePayPaymentPage'
import ScrollToTop from './components/ScrollToTop'
import ProductDetailPage from './pages/ProductDetailPage'
import AboutPage from './pages/AboutPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminAccountsPage from './pages/admin/AdminAccountsPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import AdminArticlesPage from './pages/admin/AdminArticlesPage'
import AdminArticleCommentsPage from './pages/admin/AdminArticleCommentsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminMessagesPage from './pages/admin/AdminMessagesPage'
import NotFoundPage from './pages/NotFoundPage'
import { useStoreSettings } from './utils/storeSettings'
import { getCurrentUser } from './utils/auth'

function AdminGuard({ children }: { children: ReactNode }) {
  const user = getCurrentUser()
  return user?.role === 'ADMIN' ? children : <Navigate to="/tai-khoan?che-do=dang-nhap" replace />
}

function AppContent() {
  const [, setAuthVersion] = useState(0)
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const storeSettings = useStoreSettings()

  useEffect(() => {
    document.title = isAdminRoute ? `Quản trị | ${storeSettings.storeName}` : storeSettings.storeName
  }, [isAdminRoute, storeSettings.storeName])

  useEffect(() => {
    const updateAuth = () => setAuthVersion((version) => version + 1)
    window.addEventListener('auth-updated', updateAuth)
    return () => window.removeEventListener('auth-updated', updateAuth)
  }, [])

  if (storeSettings.maintenanceMode && !isAdminRoute) {
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}><div><h1>Rubeanora đang bảo trì</h1><p>Chúng tôi sẽ hoạt động trở lại trong thời gian sớm nhất.</p></div></main>
  }

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <CartToast />}
      {!isAdminRoute && <CustomerChatWidget />}
      {!isAdminRoute && <BackToTopButton />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/san-pham" element={<ProductsPage />} />
        <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="/yeu-thich" element={<WishlistPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/tin-tuc" element={<NewsPage />} />
        <Route path="/tin-tuc/:id" element={<NewsDetailPage />} />
        <Route path="/tai-khoan" element={<AccountPage />} />
        <Route path="/chinh-sach-giao-hang" element={<ShippingPolicyPage />} />
        <Route path="/chinh-sach-doi-tra" element={<ReturnPolicyPage />} />
        <Route path="/chinh-sach-ban-hang" element={<SalesPolicyPage />} />
        <Route path="/tai-khoan/thong-tin" element={<CustomerAccountPage />} />
        <Route path="/tai-khoan/doi-mat-khau" element={<ChangePasswordPage />} />
        <Route path="/tai-khoan/don-hang" element={<CustomerOrdersPage />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/thanh-toan/chuyen-khoan/:orderId" element={<SePayPaymentPage />} />
        <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
        <Route path="/admin/san-pham" element={<AdminGuard><AdminProductsPage /></AdminGuard>} />
        <Route path="/admin/danh-muc" element={<AdminGuard><AdminCategoriesPage /></AdminGuard>} />
        <Route path="/admin/tai-khoan" element={<AdminGuard><AdminAccountsPage /></AdminGuard>} />
        <Route path="/admin/khuyen-mai" element={<AdminGuard><AdminPromotionsPage /></AdminGuard>} />
        <Route path="/admin/don-hang" element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
        <Route path="/admin/kho" element={<AdminGuard><AdminInventoryPage /></AdminGuard>} />
        <Route path="/admin/bai-viet" element={<AdminGuard><AdminArticlesPage /></AdminGuard>} />
        <Route path="/admin/binh-luan-bai-viet" element={<AdminGuard><AdminArticleCommentsPage /></AdminGuard>} />
        <Route path="/admin/danh-gia" element={<AdminGuard><AdminReviewsPage /></AdminGuard>} />
        <Route path="/admin/tin-nhan" element={<AdminGuard><AdminMessagesPage /></AdminGuard>} />
        <Route path="/admin/bao-cao" element={<AdminGuard><AdminReportsPage /></AdminGuard>} />
        <Route path="/admin/cai-dat" element={<AdminGuard><AdminSettingsPage /></AdminGuard>} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App

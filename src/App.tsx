import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import CartToast from './components/CartToast'
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
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import NotFoundPage from './pages/NotFoundPage'
import { useStoreSettings } from './utils/storeSettings'

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const storeSettings = useStoreSettings()

  useEffect(() => {
    document.title = isAdminRoute ? `Quản trị | ${storeSettings.storeName}` : storeSettings.storeName
  }, [isAdminRoute, storeSettings.storeName])

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <CartToast />}

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
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/san-pham" element={<AdminProductsPage />} />
        <Route path="/admin/danh-muc" element={<AdminCategoriesPage />} />
        <Route path="/admin/tai-khoan" element={<AdminAccountsPage />} />
        <Route path="/admin/khuyen-mai" element={<AdminPromotionsPage />} />
        <Route path="/admin/don-hang" element={<AdminOrdersPage />} />
        <Route path="/admin/kho" element={<AdminInventoryPage />} />
        <Route path="/admin/bai-viet" element={<AdminArticlesPage />} />
        <Route path="/admin/danh-gia" element={<AdminReviewsPage />} />
        <Route path="/admin/bao-cao" element={<AdminReportsPage />} />
        <Route path="/admin/cai-dat" element={<AdminSettingsPage />} />
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

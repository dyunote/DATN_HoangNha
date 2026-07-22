import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'

import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import CartPage from '@/pages/CartPage'
import Checkout from '@/pages/Checkout'
import NotFound from '@/pages/NotFound'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

import AccountLayout from '@/pages/account/AccountLayout'
import Dashboard from '@/pages/account/Dashboard'
import ProfileInfo from '@/pages/account/ProfileInfo'
import ChangePassword from '@/pages/account/ChangePassword'
import Addresses from '@/pages/account/Addresses'
import Orders from '@/pages/account/Orders'
import WishlistPage from '@/pages/account/WishlistPage'
import Vouchers from '@/pages/account/Vouchers'
import Notifications from '@/pages/account/Notifications'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminVouchers from '@/pages/admin/AdminVouchers'
import AdminBanners from '@/pages/admin/AdminBanners'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminStats from '@/pages/admin/AdminStats'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  return (
    // BrowserRouter phải bao NGOÀI các Provider: CartProvider cần useNavigate()
    // để chuyển hướng sang trang đăng nhập khi khách chưa đăng nhập bấm mua hàng.
    // Hook của react-router chỉ hoạt động bên trong Router.
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Routes>
                  {/* Storefront */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/danh-muc" element={<Shop />} />
                    <Route path="/san-pham/:id" element={<ProductDetail />} />
                    <Route path="/gio-hang" element={<CartPage />} />
                    <Route path="/thanh-toan" element={<Checkout />} />

                    {/* Account */}
                    <Route path="/tai-khoan" element={<AccountLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="thong-tin" element={<ProfileInfo />} />
                      <Route path="mat-khau" element={<ChangePassword />} />
                      <Route path="dia-chi" element={<Addresses />} />
                      <Route path="don-hang" element={<Orders />} />
                      <Route path="yeu-thich" element={<WishlistPage />} />
                      <Route path="voucher" element={<Vouchers />} />
                      <Route path="thong-bao" element={<Notifications />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Auth */}
                  <Route path="/dang-nhap" element={<Login />} />
                  <Route path="/dang-ky" element={<Register />} />
                  <Route path="/quen-mat-khau" element={<ForgotPassword />} />

                  {/* Admin */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="san-pham" element={<AdminProducts />} />
                    <Route path="danh-muc" element={<AdminCategories />} />
                    <Route path="don-hang" element={<AdminOrders />} />
                    <Route path="khach-hang" element={<AdminCustomers />} />
                    <Route path="voucher" element={<AdminVouchers />} />
                    <Route path="banner" element={<AdminBanners />} />
                    <Route path="danh-gia" element={<AdminReviews />} />
                    <Route path="thong-ke" element={<AdminStats />} />
                    <Route path="cai-dat" element={<AdminSettings />} />
                  </Route>
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

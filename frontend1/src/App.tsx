import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// --- Trang khach hay dung: nap san (eager) de vao nhanh ---
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import VouchersPage from './pages/VouchersPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import NotFoundPage from './pages/NotFoundPage';

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminVouchersPage = lazy(() => import('./pages/admin/AdminVouchersPage'));

const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Fallback khi cac trang lazy dang tai
const PageLoading = () => <div className="py-20 text-center text-ink-soft">Đang tải...</div>;

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/vouchers" element={<VouchersPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Trang tinh (cong khai) */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/stores" element={<StoresPage />} />
                    <Route path="/careers" element={<CareersPage />} />
                    <Route path="/returns" element={<ReturnsPage />} />
                    <Route path="/size-guide" element={<SizeGuidePage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    <Route element={<PrivateRoute />}>
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-success/:id" element={<OrderSuccessPage />} />
                      <Route path="/account" element={<AccountPage />} />
                      {/* Don hang da gop vao trang tai khoan (tab orders) */}
                      <Route path="/orders" element={<Navigate to="/account?tab=orders" replace />} />
                      <Route path="/orders/:id" element={<OrderDetailPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Route>

                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="products/new" element={<AdminProductFormPage />} />
                      <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                      <Route path="categories" element={<AdminCategoriesPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                      <Route path="vouchers" element={<AdminVouchersPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

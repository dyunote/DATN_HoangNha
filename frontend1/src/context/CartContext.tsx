import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import type { ApiResponse, Cart } from '../types';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  voucherCode: string;
  addToCart: (variantId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  selectItem: (itemId: number, selected: boolean) => Promise<void>;
  selectAll: (selected: boolean) => Promise<void>;
  applyVoucher: (code: string) => Promise<void>;
  refreshCart: (code?: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(
    async (code: string = voucherCode) => {
      if (!user) {
        setCart(null);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<Cart>>('/cart', { params: code ? { voucher_code: code } : {} });
        setCart(res.data.data);
      } finally {
        setLoading(false);
      }
    },
    [user, voucherCode]
  );

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addToCart = async (variant_id: number, quantity: number) => {
    const res = await api.post<ApiResponse<Cart>>('/cart/items', { variant_id, quantity });
    setCart(res.data.data);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    const res = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
    setCart(res.data.data);
  };

  const removeFromCart = async (itemId: number) => {
    const res = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    setCart(res.data.data);
  };

  const selectItem = async (itemId: number, selected: boolean) => {
    const res = await api.patch<ApiResponse<Cart>>(`/cart/items/${itemId}/select`, { selected });
    setCart(res.data.data);
  };

  const selectAll = async (selected: boolean) => {
    const res = await api.patch<ApiResponse<Cart>>(`/cart/select-all`, { selected });
    setCart(res.data.data);
  };

  const applyVoucher = async (code: string) => {
    setVoucherCode(code);
    await refreshCart(code);
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, voucherCode, addToCart, updateQuantity, removeFromCart, selectItem, selectAll, applyVoucher, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

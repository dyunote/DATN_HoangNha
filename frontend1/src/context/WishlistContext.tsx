import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import type { ApiResponse, ProductListItem } from '../types';

/**
 * Wishlist (luot thich) dong bo voi backend qua API /wishlist.
 * Chi user da dang nhap moi co wishlist. Khi chua dang nhap, danh sach rong
 * va toggle() tra ve false de UI dieu huong sang trang dang nhap.
 */
interface WishlistContextValue {
  ids: number[];
  count: number;
  loading: boolean;
  enabled: boolean; // co dang nhap khong
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<boolean>; // tra ve trang thai sau khi toggle (true = da thich)
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<ProductListItem[]>>('/wishlist');
      setIds(res.data.data.map((p) => p.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const has = useCallback((id: number) => ids.includes(id), [ids]);

  const toggle = useCallback(
    async (id: number): Promise<boolean> => {
      if (!user) return false;
      // Optimistic: cap nhat UI ngay
      const wasLiked = ids.includes(id);
      setIds((prev) => (wasLiked ? prev.filter((x) => x !== id) : [...prev, id]));
      try {
        const res = await api.post<ApiResponse<{ product_id: number; wished: boolean }>>('/wishlist/toggle', {
          product_id: id,
        });
        return res.data.data.wished;
      } catch {
        // Loi -> hoan tac
        setIds((prev) => (wasLiked ? [...prev, id] : prev.filter((x) => x !== id)));
        return wasLiked;
      }
    },
    [user, ids]
  );

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, loading, enabled: !!user, has, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}

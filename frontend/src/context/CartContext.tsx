import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CartItem, Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getVariantPrice } from '@/lib/variant'

interface CartCtx {
  items: CartItem[]
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void
  /** Thêm vào giỏ. Trả về false nếu bị chặn do chưa đăng nhập (đã tự chuyển trang). */
  add: (product: Product, quantity?: number, size?: string, color?: string) => boolean
  remove: (productId: number, size: string, color: string) => void
  updateQuantity: (productId: number, size: string, color: string, quantity: number) => void
  clear: () => void
  subtotal: number
  count: number
}

const CartContext = createContext<CartCtx | null>(null)

/** Giỏ hàng lưu riêng theo email để 2 tài khoản trên cùng máy không thấy giỏ của nhau */
const cartKey = (email?: string) => (email ? `hn-cart:${email}` : 'hn-cart:guest')

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Đổi tài khoản (đăng nhập / đăng xuất) → nạp đúng giỏ của tài khoản đó.
  // Không làm bước này thì giỏ của người dùng trước sẽ "dính" sang người sau.
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(cartKey(user?.email)) || '[]'))
    } catch {
      setItems([])
    }
  }, [user?.email])

  // Lưu lại mỗi khi giỏ đổi. Chỉ lưu khi đã đăng nhập — khách vãng lai
  // không thêm được hàng nên không có gì để lưu.
  useEffect(() => {
    if (user?.email) localStorage.setItem(cartKey(user.email), JSON.stringify(items))
  }, [items, user?.email])

  const add: CartCtx['add'] = (product, quantity = 1, size, color) => {
    // CHẶN Ở ĐÂY — một điểm duy nhất. Mọi nút "Thêm vào giỏ" trong app
    // đều đi qua hàm này, nên không cần lặp lại kiểm tra ở từng component.
    if (!user) {
      toast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning')
      // Ghi nhớ trang hiện tại để đăng nhập xong quay lại đúng chỗ
      navigate('/dang-nhap', { state: { from: location.pathname } })
      return false
    }

    const s = size ?? product.sizes[0]
    const c = color ?? product.colors[0].name
    // Chốt giá theo đúng biến thể size × màu — mỗi tổ hợp có thể một giá khác nhau
    const unitPrice = getVariantPrice(product, s, c)
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id && i.size === s && i.color === c)
      if (found) return prev.map((i) => (i === found ? { ...i, quantity: i.quantity + quantity } : i))
      return [...prev, { product, quantity, size: s, color: c, unitPrice }]
    })
    return true
  }

  const remove = (productId: number, size: string, color: string) =>
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size && i.color === color)))

  const updateQuantity = (productId: number, size: string, color: string, quantity: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size && i.color === color
          ? { ...i, quantity: Math.max(1, quantity) }
          : i,
      ),
    )

  // Dùng unitPrice (giá biến thể) chứ không phải product.price — sản phẩm có
  // giá khác nhau theo size/màu thì product.price chỉ là giá thấp nhất
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.unitPrice ?? i.product.price) * i.quantity, 0),
    [items],
  )
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, drawerOpen, setDrawerOpen, add, remove, updateQuantity, clear: () => setItems([]), subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

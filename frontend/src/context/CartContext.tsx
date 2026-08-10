import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CartItem, Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getVariantPrice } from '@/lib/variant'

/** Mã giảm giá khách đã áp ở giỏ hàng — backend đã kiểm tra và tính sẵn số tiền */
export interface AppliedVoucher {
  code: string
  type: string // percent | fixed | freeship
  discount: number
}

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
  /** Voucher đang áp — dùng chung giữa trang Giỏ hàng và trang Thanh toán */
  voucher: AppliedVoucher | null
  setVoucher: (v: AppliedVoucher | null) => void
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
  // Voucher phải nằm ở đây chứ không phải state riêng của trang Giỏ hàng:
  // LỖI CŨ — khách áp mã ở giỏ, sang trang Thanh toán mã biến mất, đơn gửi lên
  // server không kèm voucherCode → khách bị tính đủ tiền dù màn hình giỏ đã
  // trừ giảm giá. Để chung ở context thì hai trang luôn thấy cùng một mã.
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null)

  // Đổi tài khoản (đăng nhập / đăng xuất) → nạp đúng giỏ của tài khoản đó.
  // Không làm bước này thì giỏ của người dùng trước sẽ "dính" sang người sau.
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(cartKey(user?.email)) || '[]'))
    } catch {
      setItems([])
    }
    // Đổi tài khoản thì bỏ luôn mã đang áp — "mỗi khách 1 lần / mã", giữ lại
    // là người sau dùng nhầm lượt của người trước rồi bị server từ chối.
    setVoucher(null)
  }, [user?.email])

  // Giỏ đổi (thêm/xóa/sửa số lượng) → bỏ mã đã áp: số tiền giảm và điều kiện
  // "đơn tối thiểu" tính theo tạm tính CŨ, giữ nguyên là hiển thị sai.
  // Khách chỉ cần bấm "Áp dụng" lại, backend tính lại theo tạm tính mới.
  useEffect(() => {
    setVoucher(null)
  }, [items])

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
      value={{
        items, drawerOpen, setDrawerOpen, add, remove, updateQuantity,
        clear: () => {
          setItems([])
          setVoucher(null)
        },
        subtotal, count, voucher, setVoucher,
      }}
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

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import type { CartItem, Product } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cartApi, type ApiCartItem } from '@/api/services'
import { apiMessage } from '@/api/error'
import { getVariantPrice, getVariantStock } from '@/lib/variant'

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

/* ---------------- Hai tầng lưu trữ ----------------
 * CHƯA ĐĂNG NHẬP: localStorage là nguồn sự thật. Shop BẮT ĐĂNG NHẬP mới được
 *                 thêm hàng nên tầng này gần như luôn rỗng; nó tồn tại để hứng
 *                 giỏ của bản cũ (lưu theo email) và làm phao khi mất mạng.
 * ĐÃ ĐĂNG NHẬP:   DB là nguồn sự thật duy nhất — mở máy nào cũng thấy cùng giỏ.
 *                 localStorage lúc này chỉ còn là BẢN SAO để cứu khi mất mạng.
 * Trước đây giỏ chỉ nằm ở localStorage theo email, nên cùng một tài khoản mở ở
 * cửa sổ thường và cửa sổ ẩn danh lại thấy hai giỏ khác nhau.
 */

/** Giỏ khi chưa đăng nhập (phiên hết hạn giữa chừng, hoặc dữ liệu bản cũ) */
const GUEST_KEY = 'hn-cart:guest'
/** Bản sao giỏ DB trên máy này — CHỈ đọc khi gọi API thất bại */
const mirrorKey = (email: string) => `hn-cart:mirror:${email}`
/**
 * Khóa của BẢN CŨ (giỏ lưu thẳng theo email). Deploy xong, giỏ đang nằm ở đây
 * của khách sẽ được gộp lên DB đúng một lần rồi xóa — không thì họ mở web lên
 * là thấy giỏ trống dù chưa xóa gì.
 */
const legacyKey = (email: string) => `hn-cart:${email}`

/** Đọc giỏ từ localStorage, bỏ qua dòng hỏng thay vì làm vỡ cả giỏ */
const readLocal = (key: string): CartItem[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(raw)) return []
    return (raw as CartItem[]).filter(
      (i) => !!i?.product && typeof i.product.id === 'number' && typeof i.quantity === 'number' && i.quantity > 0,
    )
  } catch {
    return []
  }
}

/** Một dòng giỏ được định danh bằng sản phẩm + size + màu (đúng một biến thể) */
const isSame = (i: CartItem, productId: number, size: string, color: string) =>
  i.product.id === productId && i.size === size && i.color === color

/**
 * Gộp hai giỏ theo quy tắc LẤY SỐ LƯỢNG LỚN HƠN (không cộng dồn) — cùng quy tắc
 * mà backend dùng ở POST /me/cart/merge, để kết quả offline và online giống nhau.
 */
const mergeLists = (base: CartItem[], extra: CartItem[]): CartItem[] => {
  const out = [...base]
  for (const item of extra) {
    const at = out.findIndex((i) => isSame(i, item.product.id, item.size, item.color))
    if (at === -1) out.push(item)
    else if (item.quantity > out[at].quantity) out[at] = { ...out[at], quantity: item.quantity }
  }
  return out
}

const fromApi = (i: ApiCartItem): CartItem => ({
  product: i.product,
  quantity: i.quantity,
  size: i.size,
  color: i.color,
  unitPrice: i.unitPrice,
})

const toPayload = (items: CartItem[]) =>
  items.map((i) => ({ productId: i.product.id, color: i.color, size: i.size, quantity: i.quantity }))

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

  /**
   * Bản sao đồng bộ của `items`.
   * setState là bất đồng bộ: bấm "Thêm vào giỏ" ba lần thật nhanh thì cả ba lần
   * đều đọc `items` của cùng một lần render → lần sau ghi đè lần trước và kiểm
   * tồn kho cũng sai. Đọc/ghi qua ref thì mỗi lần bấm luôn thấy giỏ mới nhất.
   */
  const itemsRef = useRef<CartItem[]>([])

  /**
   * Hàng đợi để MỌI lệnh ghi lên server chạy TUẦN TỰ.
   * Bắn song song thì thứ tự server xử lý không đảm bảo, mà POST /me/cart là
   * cộng dồn còn PUT là gán đè — trộn hai loại đó lại thì số lượng trong DB
   * lệch với số đang hiện trên màn hình.
   */
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  /** Tăng mỗi lần đổi tài khoản — kết quả API của phiên cũ về muộn sẽ bị bỏ */
  const sessionRef = useRef(0)
  /** Có lệnh ghi từng hỏng → lần gọi kế tiếp phải đẩy lại toàn bộ giỏ */
  const needsResyncRef = useRef(false)
  /** Chỉ cảnh báo mất kết nối một lần cho mỗi đợt hỏng, tránh spam toast */
  const offlineWarnedRef = useRef(false)

  /** Ghi state + lưu localStorage cho ĐÚNG tài khoản đang mở */
  const applyItems = (next: CartItem[], email: string | undefined) => {
    itemsRef.current = next
    setItems(next)
    try {
      localStorage.setItem(email ? mirrorKey(email) : GUEST_KEY, JSON.stringify(next))
    } catch {
      // Hết dung lượng hoặc trình duyệt chặn — state vẫn đúng, chỉ mất bản sao
    }
  }

  /** Nối một việc vào cuối hàng đợi; lỗi của việc này không chặn việc sau */
  const enqueue = (task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(() => task()).catch(() => {})
  }

  /**
   * Đẩy một thay đổi lên server. Hai kiểu hỏng, xử lý KHÁC HẲN nhau:
   *
   * 1. Server TRẢ LỜI nhưng từ chối (409 hết hàng, 400 biến thể đã xóa...):
   *    server mới là đúng → tải lại giỏ thật từ DB và nói rõ lý do cho khách.
   * 2. KHÔNG có phản hồi (mất mạng, server chết): không rollback — khách vẫn
   *    thấy thứ vừa thêm, giỏ vẫn nằm trong localStorage, và cờ resync sẽ đẩy
   *    lại toàn bộ giỏ ở lần thao tác kế tiếp.
   *
   * Lưu ý ở (2): đẩy lại bằng merge (lấy max) nên chỉ khôi phục được phần
   * THÊM/TĂNG; một lệnh xóa bị rớt mạng có thể quay lại sau khi tải lại giỏ —
   * chấp nhận được, vì hướng an toàn là thừa món chứ không phải mất giỏ.
   */
  const syncWrite = (email: string, task: () => Promise<unknown>) => {
    enqueue(async () => {
      const session = sessionRef.current
      try {
        if (needsResyncRef.current) {
          await cartApi.merge(toPayload(itemsRef.current))
          needsResyncRef.current = false
        }
        await task()
        offlineWarnedRef.current = false
      } catch (err) {
        // Phiên đã đổi (đăng xuất giữa chừng) thì bỏ qua, không đụng vào giỏ mới
        if (session !== sessionRef.current) return
        if (isAxiosError(err) && err.response) {
          toast(apiMessage(err, 'Không cập nhật được giỏ hàng'), 'error')
          try {
            const server = await cartApi.list()
            if (session === sessionRef.current) applyItems(server.map(fromApi), email)
          } catch {
            // Đọc lại cũng hỏng nốt → coi như mất mạng, để lần sau đẩy lại
            needsResyncRef.current = true
          }
          return
        }
        needsResyncRef.current = true
        if (!offlineWarnedRef.current) {
          offlineWarnedRef.current = true
          toast('Chưa đồng bộ được giỏ hàng lên máy chủ — giỏ vẫn được lưu trên máy này', 'warning')
        }
      }
    })
  }

  // Đổi tài khoản (đăng nhập / đăng xuất) → nạp lại đúng giỏ của tài khoản đó
  useEffect(() => {
    const email = user?.email
    const session = ++sessionRef.current
    needsResyncRef.current = false
    offlineWarnedRef.current = false
    // Đổi tài khoản thì bỏ luôn mã đang áp — "mỗi khách 1 lần / mã", giữ lại
    // là người sau dùng nhầm lượt của người trước rồi bị server từ chối.
    setVoucher(null)

    // ĐĂNG XUẤT / chưa đăng nhập: state chỉ được phép chứa giỏ khách vãng lai.
    // Đây cũng chính là bước xóa giỏ khi đăng xuất — giỏ của người vừa thoát
    // nằm dưới DB, không còn sót lại gì trong state để lộ sang phiên sau.
    if (!email) {
      applyItems(readLocal(GUEST_KEY), undefined)
      return
    }

    // ĐĂNG NHẬP: gộp giỏ local (giỏ khách vãng lai + giỏ theo email của bản cũ)
    // vào DB, rồi lấy giỏ DB làm nguồn sự thật duy nhất.
    const local = mergeLists(readLocal(GUEST_KEY), readLocal(legacyKey(email)))
    enqueue(async () => {
      // Gộp thêm itemsRef: nếu khách kịp thêm hàng trong lúc request đang bay,
      // món đó cũng phải vào lần gộp — không thì nó bị giỏ DB ghi đè mất.
      const pending = mergeLists(itemsRef.current, local)
      try {
        const server = pending.length ? (await cartApi.merge(toPayload(pending))).items : await cartApi.list()
        if (session !== sessionRef.current) return
        applyItems(server.map(fromApi), email)
        // Gộp XONG mới xóa giỏ local. Xóa trước mà request hỏng là mất giỏ thật.
        localStorage.removeItem(GUEST_KEY)
        localStorage.removeItem(legacyKey(email))
      } catch {
        if (session !== sessionRef.current) return
        // Mất mạng / server lỗi → tuyệt đối không để trắng giỏ: dùng bản sao
        // gần nhất trên máy này, gộp thêm giỏ local, và hẹn đẩy lại sau.
        needsResyncRef.current = true
        applyItems(mergeLists(readLocal(mirrorKey(email)), pending), email)
        toast('Không tải được giỏ hàng từ máy chủ — đang dùng giỏ lưu trên máy này', 'warning')
      }
    })
    // Chỉ chạy lại khi ĐỔI TÀI KHOẢN; thêm toast/applyItems vào deps sẽ nạp lại
    // giỏ ở mọi lần render và ghi đè thao tác đang chờ đồng bộ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // Giỏ đổi (thêm/xóa/sửa số lượng) → bỏ mã đã áp: số tiền giảm và điều kiện
  // "đơn tối thiểu" tính theo tạm tính CŨ, giữ nguyên là hiển thị sai.
  // Khách chỉ cần bấm "Áp dụng" lại, backend tính lại theo tạm tính mới.
  useEffect(() => {
    setVoucher(null)
  }, [items])

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

    // CHẶN VƯỢT TỒN KHO ngay ở giỏ, theo đúng BIẾN THỂ (không phải tổng sản
    // phẩm). Backend vẫn kiểm lại lần nữa khi đặt hàng — đây chỉ là để khách
    // biết ngay thay vì tới bước cuối mới bị từ chối.
    const stock = getVariantStock(product, s, c)
    if (stock <= 0) {
      toast(`"${product.name}" (${c} / ${s}) đã hết hàng`, 'warning')
      return false
    }
    const current = itemsRef.current
    const found = current.find((i) => isSame(i, product.id, s, c))
    const inCart = found?.quantity ?? 0
    if (inCart + quantity > stock) {
      toast(
        inCart > 0
          ? `Chỉ còn ${stock} sản phẩm cho ${c} / ${s} — giỏ của bạn đang có ${inCart}`
          : `Chỉ còn ${stock} sản phẩm cho ${c} / ${s}`,
        'warning',
      )
      return false
    }

    applyItems(
      found
        ? current.map((i) => (i === found ? { ...i, quantity: i.quantity + quantity } : i))
        : [...current, { product, quantity, size: s, color: c, unitPrice }],
      user.email,
    )
    syncWrite(user.email, () => cartApi.add({ productId: product.id, color: c, size: s, quantity }))
    return true
  }

  const remove = (productId: number, size: string, color: string) => {
    applyItems(
      itemsRef.current.filter((i) => !isSame(i, productId, size, color)),
      user?.email,
    )
    if (user) syncWrite(user.email, () => cartApi.remove({ productId, color, size }))
  }

  // Sửa số lượng cũng phải kẹp trong [1, tồn kho biến thể] — trước đây chỉ
  // chặn cận dưới nên khách gõ 999 là giỏ hiện 999.
  const updateQuantity = (productId: number, size: string, color: string, quantity: number) => {
    const target = itemsRef.current.find((i) => isSame(i, productId, size, color))
    if (!target) return
    const stock = getVariantStock(target.product, size, color)
    if (quantity > stock) toast(`Chỉ còn ${stock} sản phẩm cho ${color} / ${size}`, 'warning')
    const next = Math.min(Math.max(1, quantity), Math.max(1, stock))
    // Số lượng không đổi (vd: gõ 999 hai lần, cả hai lần đều bị kẹp về tồn kho)
    // thì không gọi API — bớt một request và một lần xếp hàng vô ích.
    if (next === target.quantity) return

    applyItems(
      itemsRef.current.map((i) => (i === target ? { ...i, quantity: next } : i)),
      user?.email,
    )
    if (user) syncWrite(user.email, () => cartApi.setQuantity({ productId, color, size, quantity: next }))
  }

  const clear = () => {
    applyItems([], user?.email)
    setVoucher(null)
    // Đặt hàng xong backend đã tự dọn giỏ trong cùng transaction tạo đơn; gọi
    // thêm ở đây là để phủ các trường hợp còn lại (khách tự xóa sạch giỏ).
    if (user) syncWrite(user.email, () => cartApi.clear())
  }

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
        items, drawerOpen, setDrawerOpen, add, remove, updateQuantity, clear,
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

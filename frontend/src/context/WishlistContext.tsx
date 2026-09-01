import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { wishlistApi } from '@/api/services'
import { apiMessage } from '@/api/error'

interface WishlistCtx {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => boolean
}

const WishlistContext = createContext<WishlistCtx>({ ids: [], has: () => false, toggle: () => false })

/* ---------------- Hai tầng lưu trữ, giống hệt giỏ hàng ----------------
 * CHƯA ĐĂNG NHẬP: localStorage (khách vãng lai vẫn thích được).
 * ĐÃ ĐĂNG NHẬP:   cột JSON `users.wishlist` là nguồn sự thật — mở máy nào cũng
 *                 thấy cùng danh sách; localStorage chỉ còn là bản sao dự phòng.
 *
 * LỖI CŨ: cả app dùng chung MỘT khóa 'hn-wishlist' không gắn với tài khoản nào.
 * A thoát ra, B đăng nhập trên cùng trình duyệt là thấy nguyên danh sách yêu
 * thích của A — cùng một loại lỗi với giỏ hàng, chỉ khác là nó im lặng hơn.
 */

/** Danh sách khi chưa đăng nhập */
const GUEST_KEY = 'hn-wishlist:guest'
/** Bản sao danh sách trên server — CHỈ đọc khi gọi API thất bại */
const mirrorKey = (email: string) => `hn-wishlist:mirror:${email}`
/**
 * Khóa của BẢN CŨ (dùng chung cho mọi tài khoản). Đọc đúng một lần rồi xóa:
 * đang đăng nhập thì gộp vào tài khoản đó (gần như chắc chắn là chủ máy), chưa
 * đăng nhập thì coi như danh sách của khách vãng lai. Xóa thẳng thì khách mất
 * hết đồ đã thích sau khi deploy.
 */
const LEGACY_KEY = 'hn-wishlist'

const readLocal = (key: string): number[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((v): v is number => typeof v === 'number')
  } catch {
    return []
  }
}

const writeLocal = (key: string, ids: number[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // Hết dung lượng hoặc trình duyệt chặn — state vẫn đúng, chỉ mất bản sao
  }
}

/** Phép hợp, giữ nguyên thứ tự đã có rồi mới nối phần mới */
const union = (a: number[], b: number[]): number[] => [...new Set([...a, ...b])]

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [ids, setIds] = useState<number[]>([])

  /** Bản đồng bộ của `ids` — bấm tim liên tiếp thật nhanh vẫn đọc được giá trị mới nhất */
  const idsRef = useRef<number[]>([])
  /** Mọi lệnh ghi lên server chạy tuần tự, không bắn song song */
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  /** Tăng mỗi lần đổi tài khoản — kết quả API của phiên cũ về muộn sẽ bị bỏ */
  const sessionRef = useRef(0)
  /** Có lệnh ghi từng hỏng → lần sau phải đẩy lại bằng phép HỢP cho an toàn */
  const needsResyncRef = useRef(false)
  /** Chuỗi danh sách đã đẩy thành công gần nhất — trùng thì khỏi gọi lại */
  const lastPushedRef = useRef('')
  const offlineWarnedRef = useRef(false)

  const applyIds = (next: number[], email: string | undefined) => {
    idsRef.current = next
    setIds(next)
    writeLocal(email ? mirrorKey(email) : GUEST_KEY, next)
  }

  const enqueue = (task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(() => task()).catch(() => {})
  }

  /**
   * Đẩy TOÀN BỘ danh sách hiện tại lên server.
   *
   * Vì sao ghi đè cả danh sách thay vì "thêm/xóa từng id": danh sách chỉ là vài
   * chục con số, gửi nguyên trạng thái mới thì bấm tim nhanh bao nhiêu lần cũng
   * hội tụ về đúng thứ đang hiện trên màn hình, không cần khớp thứ tự request.
   *
   * KHÔNG lấy kết quả trả về đắp ngược vào state: response của lệnh ghi trước
   * là ảnh chụp CŨ, đắp vào sẽ xóa mất cái tim khách vừa bấm trong lúc chờ.
   */
  const push = (email: string) => {
    enqueue(async () => {
      const session = sessionRef.current
      const snapshot = idsRef.current
      const key = JSON.stringify(snapshot)
      // Đã đẩy đúng danh sách này rồi (nhiều lần bấm dồn lại) → bỏ qua
      if (key === lastPushedRef.current && !needsResyncRef.current) return
      try {
        // Lần trước hỏng → dùng phép HỢP: chưa chắc ta đang thấy bản mới nhất
        // của server, ghi đè lúc này có thể xóa mất thứ vừa thích ở máy khác.
        if (needsResyncRef.current) {
          const server = await wishlistApi.merge(snapshot)
          needsResyncRef.current = false
          if (session === sessionRef.current) applyIds(server, email)
        } else {
          await wishlistApi.replace(snapshot)
        }
        lastPushedRef.current = JSON.stringify(idsRef.current)
        offlineWarnedRef.current = false
      } catch (err) {
        if (session !== sessionRef.current) return
        needsResyncRef.current = true
        // Server trả lời mà từ chối thì nói rõ lý do; mất mạng thì chỉ nhắc một lần
        if (isAxiosError(err) && err.response) {
          toast(apiMessage(err, 'Không lưu được danh sách yêu thích'), 'error')
        } else if (!offlineWarnedRef.current) {
          offlineWarnedRef.current = true
          toast('Chưa đồng bộ được danh sách yêu thích — vẫn lưu trên máy này', 'warning')
        }
      }
    })
  }

  // Đổi tài khoản (đăng nhập / đăng xuất) → nạp lại đúng danh sách của tài khoản đó
  useEffect(() => {
    const email = user?.email
    const session = ++sessionRef.current
    needsResyncRef.current = false
    offlineWarnedRef.current = false
    lastPushedRef.current = ''

    const local = union(readLocal(GUEST_KEY), readLocal(LEGACY_KEY))

    // ĐĂNG XUẤT / chưa đăng nhập: chỉ giữ danh sách của khách vãng lai, không
    // để sót đồ của người vừa thoát trong state.
    if (!email) {
      applyIds(local, undefined)
      // Gom khóa cũ về khóa guest rồi bỏ hẳn khóa dùng chung
      localStorage.removeItem(LEGACY_KEY)
      return
    }

    // ĐĂNG NHẬP: gộp (phép hợp) rồi lấy server làm nguồn sự thật
    enqueue(async () => {
      const pending = union(idsRef.current, local)
      try {
        const server = pending.length ? await wishlistApi.merge(pending) : await wishlistApi.list()
        if (session !== sessionRef.current) return
        applyIds(server, email)
        lastPushedRef.current = JSON.stringify(server)
        // Gộp XONG mới xóa bản local
        localStorage.removeItem(GUEST_KEY)
        localStorage.removeItem(LEGACY_KEY)
      } catch {
        if (session !== sessionRef.current) return
        // Mất mạng → dùng bản sao gần nhất + bản local, hẹn đẩy lại sau
        needsResyncRef.current = true
        applyIds(union(readLocal(mirrorKey(email)), pending), email)
      }
    })
    // Chỉ chạy lại khi ĐỔI TÀI KHOẢN
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const has = (id: number) => ids.includes(id)

  const toggle = (id: number) => {
    const current = idsRef.current
    const adding = !current.includes(id)
    applyIds(adding ? [...current, id] : current.filter((x) => x !== id), user?.email)
    // Chưa đăng nhập thì dừng ở localStorage — đăng nhập sẽ gộp lên sau
    if (user) push(user.email)
    return adding
  }

  return <WishlistContext.Provider value={{ ids, has, toggle }}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => useContext(WishlistContext)

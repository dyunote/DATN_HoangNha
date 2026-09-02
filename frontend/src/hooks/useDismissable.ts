import { useEffect, useRef } from 'react'

/**
 * Các phần tử có thể nhận focus bằng phím Tab.
 * `:not([disabled])` để nút đang khóa (vd nút Lưu lúc đang gửi) không bị nhảy vào.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * HÀNH VI CHUẨN CỦA MỘT LỚP PHỦ (modal / ngăn kéo) — dùng chung cho
 * `ui/Modal`, giỏ hàng, ngăn kéo chi tiết đơn ở khu quản trị.
 *
 * Gồm 4 việc mà trước đây KHÔNG chỗ nào làm:
 *  1. Bấm `Esc` là đóng — phản xạ ai cũng có, thiếu nó người dùng phải đi tìm
 *     nút X hoặc bấm ra ngoài nền mờ.
 *  2. BẪY FOCUS: Tab chỉ chạy vòng trong hộp thoại. Trước đây Tab đi thẳng ra
 *     các nút phía sau nền mờ — người dùng bàn phím bấm phải nút mình không
 *     nhìn thấy.
 *  3. Khóa cuộn trang nền: mở modal mà lăn chuột thì trang phía sau chạy.
 *  4. Trả focus về đúng nút đã mở hộp thoại khi đóng, để đi tiếp bằng phím
 *     không bị văng về đầu trang.
 *
 * @param open   hộp thoại đang mở hay không
 * @param onClose hàm đóng — KHÔNG cần bọc `useCallback`, xem ghi chú bên dưới
 * @returns ref gắn vào KHUNG hộp thoại (phần tử chứa nội dung, không phải nền mờ)
 */
export function useDismissable<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const boxRef = useRef<T>(null)

  // Giữ `onClose` trong ref: nơi gọi thường truyền hàm mũi tên viết thẳng
  // (`onClose={() => setOpen(false)}`) nên mỗi lần render là một hàm MỚI.
  // Nếu để nó trong mảng phụ thuộc, effect sẽ dọn dẹp rồi chạy lại sau mỗi
  // render — focus bị giật liên tục và cuộn trang bị mở khóa nhầm lúc.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    // Nút/liên kết đã mở hộp thoại — cuối cùng trả focus về đây
    const opener = document.activeElement as HTMLElement | null

    // Khóa cuộn nền. Lưu giá trị cũ để khi có hai lớp phủ lồng nhau
    // (ngăn kéo đơn hàng + hộp thoại xác nhận) lớp trong đóng lại không
    // mở khóa cuộn của lớp ngoài.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const box = boxRef.current
      if (!box) return
      // offsetParent === null: phần tử đang bị ẩn (display:none) → bỏ qua
      const nodes = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (nodes.length === 0) {
        e.preventDefault()
        box.focus()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      const outside = !box.contains(active)

      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    // Đợi một nhịp cho hiệu ứng mở của framer-motion gắn xong phần tử vào DOM
    const timer = window.setTimeout(() => {
      const box = boxRef.current
      if (!box) return
      const target = box.querySelector<HTMLElement>(FOCUSABLE)
      ;(target ?? box).focus()
    }, 60)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open])

  return boxRef
}

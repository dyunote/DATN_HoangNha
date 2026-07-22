/**
 * Một số môi trường nhúng (webview, preview pane) không fire callback của
 * IntersectionObserver — khi đó mọi animation "reveal khi cuộn tới" (framer
 * whileInView) sẽ kẹt ở trạng thái ẩn. Guard này phát hiện tình huống đó và
 * gắn class `no-io` lên <html> để CSS buộc nội dung hiển thị.
 *
 * Lưu ý: tab nền (document.hidden) cũng tạm dừng IO theo chuẩn trình duyệt,
 * nên chỉ kiểm tra khi tab đang hiển thị để tránh tắt nhầm animation.
 */
export function installIOGuard() {
  const check = () => {
    try {
      let fired = false
      const io = new IntersectionObserver(() => {
        fired = true
        io.disconnect()
      })
      io.observe(document.documentElement)
      setTimeout(() => {
        io.disconnect()
        if (!fired && !document.hidden) document.documentElement.classList.add('no-io')
      }, 1000)
    } catch {
      document.documentElement.classList.add('no-io')
    }
  }

  if (document.hidden) {
    document.addEventListener('visibilitychange', () => !document.hidden && check(), { once: true })
  } else {
    check()
  }
}

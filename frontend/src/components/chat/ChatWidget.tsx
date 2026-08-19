import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { API_URL } from '@/api/client'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** Tin nhắn chỉ hiển thị ở UI (lời chào), KHÔNG gửi lên API — API yêu cầu lượt đầu là user */
  localOnly?: boolean
}

const GREETING: ChatMessage = {
  role: 'assistant',
  localOnly: true,
  content:
    'Xin chào! Mình là trợ lý ảo của Hoàng Nha Fashion. Mình có thể giúp bạn tìm sản phẩm, tra cứu đơn hàng, voucher hay giải đáp về vận chuyển, thanh toán, đổi trả. Bạn cần hỗ trợ gì ạ?',
}

const SUGGESTIONS = [
  'Phí vận chuyển thế nào?',
  'Đơn hàng của tôi đang ở đâu?',
  'Shop có voucher nào không?',
  'Gợi ý cho tôi sản phẩm bán chạy',
]

// Biến các đường dẫn /san-pham/123 trong câu trả lời thành link bấm được
function renderContent(text: string) {
  const parts = text.split(/(\/san-pham\/\d+)/g)
  return parts.map((part, i) =>
    /^\/san-pham\/\d+$/.test(part) ? (
      <Link key={i} to={part} className="font-semibold underline underline-offset-2 hover:text-accent-dark">
        {part}
      </Link>
    ) : (
      part
    ),
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Luôn cuộn xuống tin mới nhất
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send(text: string) {
    const question = text.trim()
    if (!question || sending) return
    setInput('')
    setSending(true)

    const history = [...messages, { role: 'user' as const, content: question }]
    // Chèn sẵn ô trả lời rỗng của trợ lý để đổ dần văn bản stream vào
    setMessages([...history, { role: 'assistant', content: '' }])

    const updateLast = (content: string) =>
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content }
        return next
      })

    try {
      const token = localStorage.getItem('hn-token')
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.filter((m) => !m.localOnly).map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'Không kết nối được máy chủ')
      }

      // Đọc stream SSE: từng dòng "data: {json}" → nối dần vào câu trả lời
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let answer = ''
      let done = false
      while (!done) {
        const chunk = await reader.read()
        done = chunk.done
        buffer += decoder.decode(chunk.value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? '' // giữ lại phần chưa trọn vẹn
        for (const event of events) {
          const line = event.trim()
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          const parsed = JSON.parse(payload) as { text?: string; error?: string }
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.text) {
            answer += parsed.text
            updateLast(answer)
          }
        }
      }
      if (!answer) updateLast('Xin lỗi, mình chưa trả lời được. Bạn thử hỏi lại nhé.')
    } catch (err) {
      updateLast(err instanceof Error ? err.message : 'Có lỗi xảy ra, bạn thử lại nhé.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send(input)
  }

  const showSuggestions = messages.filter((m) => m.role === 'user').length === 0

  return (
    <>
      {/* Nút nổi mở chat */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow-xl shadow-ink/25 dark:bg-white dark:text-ink"
        aria-label={open ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      {/* Khung chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-5 bottom-22 z-50 flex h-[min(560px,calc(100dvh-120px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-card border border-ink/10 bg-white shadow-2xl shadow-ink/20 dark:border-white/10 dark:bg-[#161618]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-ink/10 bg-ink px-5 py-4 text-white dark:border-white/10">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink">
                <Sparkles size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold">Trợ lý Hoàng Nha</p>
                <p className="text-[11px] text-white/60">Phản hồi tức thì 24/7</p>
              </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-ink text-white dark:bg-white dark:text-ink'
                        : 'rounded-bl-md bg-ink/5 text-ink dark:bg-white/10 dark:text-white'
                    }`}
                  >
                    {m.content ? (
                      renderContent(m.content)
                    ) : (
                      // Đang chờ token đầu tiên → 3 chấm nhấp nháy
                      <span className="flex gap-1 py-1">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                            className="h-1.5 w-1.5 rounded-full bg-current"
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="cursor-pointer rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/80 transition-colors hover:border-ink hover:bg-ink hover:text-white dark:border-white/20 dark:text-white/80 dark:hover:bg-white dark:hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ô nhập */}
            <div className="flex items-center gap-2 border-t border-ink/10 px-3 py-3 dark:border-white/10">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-input border border-ink/15 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-ink dark:border-white/15 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white"
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-white transition-opacity disabled:opacity-40 dark:bg-white dark:text-ink"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

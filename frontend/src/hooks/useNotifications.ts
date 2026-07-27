import { useCallback, useEffect, useState } from 'react'
import type { Notification } from '@/types'
import { meApi } from '@/api/services'
import { useAuth } from '@/context/AuthContext'

interface ApiNotification {
  id: number
  title: string
  content: string
  type: 'order' | 'promo' | 'system'
  read: boolean
  createdAt: string
}

/**
 * UC-22: thông báo của CHÍNH user đang đăng nhập.
 * Chưa đăng nhập → luôn trả về mảng rỗng, không gọi API, không fallback mock.
 */
export function useNotifications() {
  const { user } = useAuth()
  const [list, setList] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    // Không có user thì dọn sạch state (tránh dữ liệu còn sót sau khi logout)
    if (!user) {
      setList([])
      return
    }
    setLoading(true)
    meApi
      .notifications()
      .then((data: ApiNotification[]) =>
        setList(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            type: n.type,
            read: n.read,
            time: new Date(n.createdAt).toLocaleString('vi-VN'),
          })),
        ),
      )
      // Backend lỗi/chưa chạy: để rỗng, thà không hiện còn hơn hiện dữ liệu giả
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(load, [load])

  const unread = list.filter((n) => !n.read).length

  return { list, unread, loading, reload: load }
}

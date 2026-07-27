import { useEffect, useState } from 'react'
import type { Order } from '@/types'
import { orderApi, mapApiOrder } from '@/api/services'
import { useAuth } from '@/context/AuthContext'

/**
 * Đơn hàng của người dùng đang đăng nhập (UC-14), lấy từ database.
 * Chưa đăng nhập → danh sách rỗng. Không fallback mock.
 */
export function useMyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(!!user)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(false)
    orderApi
      .list()
      .then((list) => mounted && setOrders(list.map(mapApiOrder)))
      .catch(() => mounted && setError(true))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [user])

  return { orders, loading, error }
}

import { useEffect, useState } from 'react'
import type { Order } from '@/types'
import { ORDERS } from '@/data'
import { orderApi, mapApiOrder } from '@/api/services'

/**
 * Đơn hàng của người dùng: lấy từ backend (UC-14), fallback mock khi
 * backend chưa chạy hoặc chưa đăng nhập bằng JWT.
 */
export function useMyOrders() {
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [source, setSource] = useState<'api' | 'mock'>('mock')

  useEffect(() => {
    let mounted = true
    orderApi
      .list()
      .then((list) => {
        if (mounted) {
          setOrders(list.map(mapApiOrder))
          setSource('api')
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return { orders, source }
}

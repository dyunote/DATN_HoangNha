import { useEffect, useState } from 'react'
import type { Product } from '@/types'
import { productApi } from '@/api/services'

interface Loaded {
  products: Product[]
  error: boolean
}

// Cache module-level: chỉ gọi API một lần cho cả phiên
let cache: Loaded | null = null
let pending: Promise<Loaded> | null = null
// Các hook đang mounted, để báo cho chúng khi cache bị xóa
const subscribers = new Set<(v: Loaded) => void>()

/** Số sản phẩm lấy mỗi lần gọi API — backend chặn trần ở 48 (products.ts) */
const PAGE_SIZE = 48

/**
 * Nạp TOÀN BỘ sản phẩm, đi hết các trang.
 *
 * BUG CŨ: chỉ gọi đúng một lần `list({ limit: 48 })` rồi coi đó là tất cả.
 * Backend cap `take = Math.min(48, limit)` nên khi shop vượt 48 sản phẩm,
 * những sản phẩm mới thêm (id lớn nhất, xếp cuối theo `id ASC`) rơi ra ngoài
 * trang 1 và BIẾN MẤT khỏi mọi màn hình — admin lẫn trang khách — dù DB có đủ.
 */
async function fetchAllProducts(): Promise<Product[]> {
  const first = await productApi.list({ limit: PAGE_SIZE, page: 1 })
  if (first.totalPages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) =>
      productApi.list({ limit: PAGE_SIZE, page: i + 2 }).then((r) => r.items),
    ),
  )
  return [...first.items, ...rest.flat()]
}

async function load(): Promise<Loaded> {
  if (cache) return cache
  pending ??= fetchAllProducts()
    .then((products) => (cache = { products, error: false }))
    .catch(() => {
      pending = null // không cache lỗi — lần mount sau được thử lại
      return { products: [], error: true }
    })
  return pending
}

/**
 * Xóa cache và tải lại từ API — gọi sau khi admin thêm/sửa/xóa sản phẩm
 * để mọi màn hình đang mở thấy dữ liệu mới mà không cần F5.
 */
export async function refreshProducts() {
  cache = null
  pending = null
  const result = await load()
  subscribers.forEach((fn) => fn(result))
  return result
}

/**
 * Nguồn sản phẩm duy nhất: database qua API.
 * Không fallback mock — backend chưa chạy thì `error = true` và danh sách rỗng,
 * để UI nói thật là "không tải được" thay vì hiện hàng giả.
 */
export function useProducts() {
  const [state, setState] = useState<Loaded & { loading: boolean }>(
    cache ? { ...cache, loading: false } : { products: [], error: false, loading: true },
  )

  useEffect(() => {
    let mounted = true
    const onRefresh = (result: Loaded) => mounted && setState({ ...result, loading: false })
    subscribers.add(onRefresh)
    load().then(onRefresh)
    return () => {
      mounted = false
      subscribers.delete(onRefresh)
    }
  }, [])

  return state
}

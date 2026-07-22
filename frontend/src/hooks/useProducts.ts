import { useEffect, useState } from 'react'
import type { Product } from '@/types'
import { PRODUCTS } from '@/data'
import { productApi } from '@/api/services'

// Cache module-level: chỉ gọi API một lần cho cả phiên
type Loaded = { products: Product[]; source: 'api' | 'mock' }
let cache: Loaded | null = null
let pending: Promise<Loaded> | null = null

async function load() {
  if (cache) return cache
  pending ??= productApi
    .list({ limit: 48 })
    .then((res) => (cache = { products: res.items, source: 'api' as const }))
    .catch(() => (cache = { products: PRODUCTS, source: 'mock' as const }))
  return pending
}

/**
 * Nguồn sản phẩm hợp nhất: ưu tiên backend API (http://localhost:4000),
 * tự động fallback sang mock data khi backend chưa chạy — website luôn hoạt động.
 */
export function useProducts() {
  const [state, setState] = useState<{ products: Product[]; source: 'api' | 'mock'; loading: boolean }>(
    cache ? { ...cache, loading: false } : { products: PRODUCTS, source: 'mock', loading: true },
  )

  useEffect(() => {
    let mounted = true
    load().then((result) => {
      if (mounted && result) setState({ ...result, loading: false })
    })
    return () => {
      mounted = false
    }
  }, [])

  return state
}

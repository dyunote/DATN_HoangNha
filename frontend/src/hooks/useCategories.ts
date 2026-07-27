import { useEffect, useState } from 'react'
import type { Category } from '@/types'
import { catalogApi } from '@/api/services'

let cache: Category[] | null = null
let pending: Promise<Category[]> | null = null
const subscribers = new Set<(v: Category[]) => void>()

/** Xóa cache và tải lại — gọi sau khi admin thêm/sửa/xóa danh mục */
export async function refreshCategories() {
  cache = null
  pending = null
  const data = await catalogApi.categories()
  cache = data
  subscribers.forEach((fn) => fn(data))
  return data
}

/**
 * Danh mục lấy từ database. Không còn fallback mock: backend lỗi thì trả mảng
 * rỗng + cờ error để UI báo rõ, thay vì hiện dữ liệu giả trông như thật.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const apply = (data: Category[]) => {
      if (!mounted) return
      setCategories(data)
      setLoading(false)
    }
    subscribers.add(apply)

    if (cache) {
      setLoading(false)
    } else {
      pending ??= catalogApi.categories().then((data) => (cache = data))
      pending
        .then(apply)
        .catch(() => {
          pending = null // cho phép thử lại ở lần mount sau
          if (mounted) {
            setError(true)
            setLoading(false)
          }
        })
    }
    return () => {
      mounted = false
      subscribers.delete(apply)
    }
  }, [])

  return { categories, loading, error }
}

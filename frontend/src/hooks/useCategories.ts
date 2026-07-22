import { useEffect, useState } from 'react'
import type { Category } from '@/types'
import { CATEGORIES } from '@/data'
import { catalogApi } from '@/api/services'

let cache: Category[] | null = null
let pending: Promise<Category[]> | null = null

/** Danh mục từ backend API, fallback mock — dùng cho mega menu và section Categories. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? CATEGORIES)

  useEffect(() => {
    if (cache) return
    pending ??= catalogApi.categories().then((data) => (cache = data))
    let mounted = true
    pending.then((data) => mounted && setCategories(data)).catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return categories
}

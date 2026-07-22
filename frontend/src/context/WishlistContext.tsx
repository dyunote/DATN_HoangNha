import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface WishlistCtx {
  ids: number[]
  has: (id: number) => boolean
  toggle: (id: number) => boolean
}

const WishlistContext = createContext<WishlistCtx>({ ids: [], has: () => false, toggle: () => false })

/**
 * Danh sách yêu thích lưu hoàn toàn ở localStorage (không cần bảng riêng trong DB).
 * Đủ cho một shop bình thường: dữ liệu theo trình duyệt, không mất khi F5.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hn-wishlist') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('hn-wishlist', JSON.stringify(ids))
  }, [ids])

  const has = (id: number) => ids.includes(id)

  const toggle = (id: number) => {
    const adding = !ids.includes(id)
    setIds((prev) => (adding ? [...prev, id] : prev.filter((x) => x !== id)))
    return adding
  }

  return <WishlistContext.Provider value={{ ids, has, toggle }}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => useContext(WishlistContext)

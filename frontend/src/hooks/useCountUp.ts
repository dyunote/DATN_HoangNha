import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [forced, setForced] = useState(false)
  const [value, setValue] = useState(0)

  // Dự phòng: môi trường không fire IntersectionObserver vẫn phải đếm số
  useEffect(() => {
    const t = setTimeout(() => setForced(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!inView && !forced) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, forced, target, duration])

  return { ref, value }
}

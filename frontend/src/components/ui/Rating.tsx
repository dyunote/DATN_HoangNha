import { Star, StarHalf } from 'lucide-react'

export default function Rating({ value, size = 14, showValue = false }: { value: number; size?: number; showValue?: boolean }) {
  const full = Math.floor(value)
  const half = value - full >= 0.4
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} size={size} className="fill-accent text-accent" />
        if (i === full && half) return <StarHalf key={i} size={size} className="fill-accent text-accent" />
        return <Star key={i} size={size} className="text-slate-300 dark:text-slate-600" />
      })}
      {showValue && <span className="ml-1.5 text-xs font-medium text-slate-500">{value.toFixed(1)}</span>}
    </span>
  )
}

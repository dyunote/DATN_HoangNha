import { Minus, Plus } from 'lucide-react'

export default function QuantityStepper({
  value,
  onChange,
  small = false,
}: {
  value: number
  onChange: (v: number) => void
  small?: boolean
}) {
  const btn = `flex cursor-pointer items-center justify-center text-slate-500 transition-colors hover:text-ink dark:hover:text-white disabled:opacity-30 ${small ? 'h-8 w-8' : 'h-11 w-11'}`
  return (
    <div
      className={`inline-flex items-center rounded-btn border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900 ${small ? 'h-8' : 'h-11'}`}
    >
      <button className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Giảm">
        <Minus size={small ? 13 : 15} />
      </button>
      <span className={`text-center font-semibold tabular-nums ${small ? 'w-7 text-xs' : 'w-10 text-sm'}`}>{value}</span>
      <button className={btn} onClick={() => onChange(value + 1)} aria-label="Tăng">
        <Plus size={small ? 13 : 15} />
      </button>
    </div>
  )
}

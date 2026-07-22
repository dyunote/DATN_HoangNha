import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export interface AccordionItem {
  title: string
  content: ReactNode
}

export default function Accordion({ items, defaultOpen = 0 }: { items: AccordionItem[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen)

  return (
    <div className="divide-y divide-slate-200 dark:divide-white/10">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
            >
              <span className="text-sm font-semibold tracking-wide uppercase dark:text-white">{item.title}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}>
                <Plus size={18} className="text-slate-400" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

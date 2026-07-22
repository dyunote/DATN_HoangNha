import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right' | 'scale' | 'blur' | 'none'

const variants = (direction: Direction, distance: number): Variants => {
  const hidden: { opacity: number; x?: number; y?: number; scale?: number; filter?: string } = { opacity: 0 }
  if (direction === 'up') hidden.y = distance
  if (direction === 'left') hidden.x = -distance
  if (direction === 'right') hidden.x = distance
  if (direction === 'scale') hidden.scale = 0.9
  if (direction === 'blur') hidden.filter = 'blur(12px)'
  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
    },
  }
}

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.8,
  distance = 48,
  className = '',
  once = true,
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  distance?: number
  className?: string
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={variants(direction, distance)}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

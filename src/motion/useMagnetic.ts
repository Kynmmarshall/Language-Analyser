import { useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { springSnappy } from './presets'

const MAX_OFFSET = 6

/** Cursor-following translate for buttons. No-ops under reduced motion and on touch. */
export function useMagnetic(maxOffset: number = MAX_OFFSET) {
  const reduced = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, springSnappy)
  const y = useSpring(rawY, springSnappy)

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reduced || event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2)
      const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2)
      rawX.set(Math.max(-1, Math.min(1, offsetX)) * maxOffset)
      rawY.set(Math.max(-1, Math.min(1, offsetY)) * maxOffset)
    },
    [reduced, rawX, rawY, maxOffset],
  )

  const onPointerLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  return { style: { x, y }, onPointerMove, onPointerLeave }
}

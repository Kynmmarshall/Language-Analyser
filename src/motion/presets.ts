import type { Transition, Variants } from 'motion/react'

/** Spring configs. Use these instead of inline stiffness/damping values. */
export const springSnappy: Transition = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }
export const springSmooth: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 1 }
export const springGentle: Transition = { type: 'spring', stiffness: 170, damping: 26, mass: 1.1 }

/** Non-spring durations, in seconds, for opacity-only cross-fades. */
export const duration = { fast: 0.16, base: 0.22, slow: 0.32 } as const

export const easeOutQuint = [0.22, 1, 0.36, 1] as const

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: easeOutQuint } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springSmooth },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: springSmooth },
  exit: { opacity: 0, scale: 0.98, transition: { duration: duration.fast } },
}

/** Parent wrapper for orchestrated lists; children use `fadeInUp`. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const drawerSlide: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: 24, transition: { duration: duration.base } },
}

/** Shared micro-interaction constants so hover/press feel identical everywhere. */
export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: springSnappy,
} as const

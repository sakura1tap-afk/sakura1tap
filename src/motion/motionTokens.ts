export const motionDurations = {
  instant: 0,
  fast: 0.22,
  base: 0.42,
  section: 0.68,
  cinematic: 0.96,
} as const

export const motionEases = {
  standard: 'power2.out',
  emphasis: 'power3.out',
  section: 'power3.inOut',
  ripple: 'sine.out',
  linear: 'none',
} as const

export const motionQueries = {
  desktop: '(min-width: 800px)',
  mobile: '(max-width: 799px)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const

export const mainMotionTiming = {
  inputLockMs: 680,
  leave: motionDurations.fast,
  transit: motionDurations.section,
  enter: motionDurations.base,
  detail: motionDurations.section,
} as const

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(motionQueries.reducedMotion).matches
}

/**
 * Resolved once at module load, outside render, so components can branch on it
 * without calling an impure API mid-render.
 */
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

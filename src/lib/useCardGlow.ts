import { useEffect } from 'react'
import { prefersReducedMotion } from './motion'

/**
 * Lights the glass card under the pointer from where the pointer actually is.
 *
 * One listener for the whole page rather than a handler per card: there are
 * forty-odd of them, and none of this should cost a React render. The card
 * reads the position out of two custom properties, so the effect itself is
 * pure CSS.
 */
export function useCardGlow() {
  useEffect(() => {
    if (prefersReducedMotion) return

    let raf = 0
    let lit: HTMLElement | null = null

    const clear = (el: HTMLElement | null) => {
      el?.style.removeProperty('--mx')
      el?.style.removeProperty('--my')
    }

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const target = e.target as HTMLElement | null
        const card = target?.closest?.('.glass-card-hover') as HTMLElement | null
        if (card !== lit) {
          clear(lit)
          lit = card
        }
        if (!card) return
        const box = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${(e.clientX - box.left).toFixed(0)}px`)
        card.style.setProperty('--my', `${(e.clientY - box.top).toFixed(0)}px`)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      clear(lit)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])
}

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

/**
 * A soft light that follows the pointer across its parent. Written straight to
 * CSS custom properties so nothing re-renders while the pointer moves.
 */
export function Spotlight() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return

    let raf = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = host.getBoundingClientRect()
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        el.style.setProperty('--my', `${event.clientY - rect.top}px`)
        el.style.opacity = '1'
      })
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }

    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <span ref={ref} aria-hidden className="spotlight" style={{ opacity: 0 }} />
}

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

/**
 * A booster under a landing burn, riding the scroll.
 *
 * Nose up, engine lit beneath it, descent trail above — so travelling down the
 * page is something the vehicle is actually doing rather than a sprite being
 * dragged. Position is written straight to a transform on each frame; nothing
 * re-renders while you scroll.
 */
export function ScrollRocket() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    const el = ref.current
    if (!el) return

    let raf = 0
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      // Travels the height of the viewport, with room at both ends.
      const y = 8 + p * 68
      el.style.transform = `translate3d(0, ${y}vh, 0)`
      // The trail is the descent already flown.
      el.style.setProperty('--trail', `${18 + p * 46}vh`)
      el.style.opacity = p > 0.985 ? '0' : '1'
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div aria-hidden className="rocket-layer">
      <div ref={ref} className="rocket-rig">
        <span className="rocket-trail" />

        <svg className="rocket-body" viewBox="0 0 44 132" width="44" height="132" fill="none">
          {/* Nose */}
          <path d="M22 2 L30 26 L14 26 Z" className="fill-ink" />
          {/* Fuselage */}
          <rect x="14" y="26" width="16" height="76" rx="2" className="fill-ink" />
          {/* Interstage band, in the accent */}
          <rect x="14" y="52" width="16" height="7" className="fill-beam" />
          {/* Grid fins, stowed high on the body */}
          <path d="M14 32 L7 37 L7 45 L14 42 Z" className="fill-ink-muted" />
          <path d="M30 32 L37 37 L37 45 L30 42 Z" className="fill-ink-muted" />
          {/* Landing legs, deployed for the burn */}
          <path d="M14 96 L5 118 L9 119 L16 100 Z" className="fill-ink-muted" />
          <path d="M30 96 L39 118 L35 119 L28 100 Z" className="fill-ink-muted" />
          {/* Engine bell */}
          <path d="M17 102 L14 112 L30 112 L27 102 Z" className="fill-ink-faint" />
        </svg>

        <span className="rocket-flame" />
        <span className="rocket-glow" />
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

/**
 * A booster under a landing burn, riding the scroll.
 *
 * Nose up, engine lit beneath it, descent trail above — so travelling down the
 * page is something the vehicle is actually doing rather than a sprite being
 * dragged. Position is written straight to a transform on each frame; nothing
 * re-renders while you scroll.
 *
 * The livery is the flag and an orbit mark, the way a launch vehicle carries
 * them: national colours on the tank, agency mark below the nose.
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

        <svg className="rocket-body" viewBox="0 0 60 182" width="60" height="182" fill="none">
          {/* Nose */}
          <path d="M30 2 L41 36 L19 36 Z" className="fill-ink" />
          {/* Fuselage */}
          <rect x="19" y="36" width="22" height="104" rx="2" className="fill-ink" />

          {/* Agency mark: an ascending vehicle inside its orbit. */}
          <g transform="translate(30 46)">
            <circle r="6.4" className="fill-paper" />
            <ellipse
              rx="5.3"
              ry="2.3"
              transform="rotate(-30)"
              className="stroke-beam"
              strokeWidth="0.9"
              fill="none"
            />
            <path d="M-2.9 3 L0 -4.2 L2.9 3 L0 1 Z" className="fill-beam" />
          </g>

          {/* The national colours. Literal hex on purpose: these are the flag's
              values, not the product's palette, so they are not tokens. */}
          <rect x="19" y="58" width="22" height="6" fill="#FF9933" />
          <rect x="19" y="64" width="22" height="6" fill="#FFFFFF" />
          <rect x="19" y="70" width="22" height="6" fill="#138808" />
          <circle
            cx="30"
            cy="67"
            r="2.2"
            fill="none"
            stroke="#000080"
            strokeWidth="0.7"
          />
          <circle cx="30" cy="67" r="0.55" fill="#000080" />
          {/* The band is a decal, so it needs an edge — the white stripe would
              otherwise dissolve into the white tank. */}
          <rect
            x="19"
            y="58"
            width="22"
            height="18"
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="0.6"
          />

          {/* Painted down the tank, as it is on the real vehicles. */}
          <text
            x="30"
            y="104"
            transform="rotate(90 30 104)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="700"
            letterSpacing="2.4"
            className="fill-paper font-mono"
          >
            ISRO
          </text>

          {/* Grid fins, stowed high on the body */}
          <path d="M19 41 L10 47 L10 57 L19 53 Z" className="fill-ink-muted" />
          <path d="M41 41 L50 47 L50 57 L41 53 Z" className="fill-ink-muted" />
          {/* Landing legs, deployed for the burn */}
          <path d="M19 128 L7 160 L12 161 L21 132 Z" className="fill-ink-muted" />
          <path d="M41 128 L53 160 L48 161 L39 132 Z" className="fill-ink-muted" />
          {/* Engine bell */}
          <path d="M23 140 L19 156 L41 156 L37 140 Z" className="fill-ink-faint" />
        </svg>

        <span className="rocket-flame" />
        <span className="rocket-glow" />
      </div>
    </div>
  )
}

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

        <svg className="rocket-body" viewBox="0 0 76 226" width="76" height="226" fill="none">
          {/* Nose */}
          <path d="M38 3 L52 46 L24 46 Z" className="fill-ink" />
          {/* Fuselage */}
          <rect x="24" y="46" width="28" height="128" rx="2.5" className="fill-ink" />

          {/* Agency mark. Drawn, not the official asset: an ascending vehicle
              inside its orbit, in ISRO's vermillion. Swap in the real file from
              isro.gov.in when you have it — see the note in README. */}
          <g transform="translate(38 63)">
            <circle r="10.5" fill="#0b0b12" />
            <circle r="10.5" fill="none" stroke="#FF6D00" strokeWidth="0.7" opacity="0.5" />
            <ellipse
              rx="8.6"
              ry="3.5"
              transform="rotate(-26)"
              fill="none"
              stroke="#FF6D00"
              strokeWidth="0.85"
            />
            <ellipse
              rx="8.6"
              ry="3.5"
              transform="rotate(26)"
              fill="none"
              stroke="#FF6D00"
              strokeWidth="0.85"
              opacity="0.55"
            />
            {/* Satellite riding the near orbit */}
            <rect x="6.4" y="-4.6" width="2.1" height="2.1" fill="#FF6D00" />
            {/* The vehicle, ascending */}
            <path d="M0 -8.6 L2.4 -1.6 L2.4 3 L-2.4 3 L-2.4 -1.6 Z" fill="#FF6D00" />
            <path d="M-2.4 0.4 L-4.6 3.4 L-2.4 3 Z" fill="#FF6D00" />
            <path d="M2.4 0.4 L4.6 3.4 L2.4 3 Z" fill="#FF6D00" />
            <path d="M-2.4 3 L0 8.4 L2.4 3 Z" fill="#FF9933" />
          </g>

          {/* The national colours. Literal hex on purpose: these are the flag's
              values, not the product's palette, so they are not tokens. */}
          <rect x="24" y="80" width="28" height="8" fill="#FF9933" />
          <rect x="24" y="88" width="28" height="8" fill="#FFFFFF" />
          <rect x="24" y="96" width="28" height="8" fill="#138808" />
          <circle cx="38" cy="92" r="3" fill="none" stroke="#000080" strokeWidth="0.8" />
          <circle cx="38" cy="92" r="0.7" fill="#000080" />
          {/* The band is a decal, so it needs an edge — the white stripe would
              otherwise dissolve into the white tank. */}
          <rect
            x="24"
            y="80"
            width="28"
            height="24"
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="0.7"
          />

          {/* Painted down the tank, as it is on the real vehicles. */}
          <text
            x="38"
            y="138"
            transform="rotate(90 38 138)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10.5"
            fontWeight="700"
            letterSpacing="3"
            className="fill-paper font-mono"
          >
            ISRO
          </text>

          {/* Grid fins, stowed high on the body */}
          <path d="M24 54 L12 62 L12 74 L24 68 Z" className="fill-ink-muted" />
          <path d="M52 54 L64 62 L64 74 L52 68 Z" className="fill-ink-muted" />
          {/* Landing legs, deployed for the burn */}
          <path d="M24 160 L9 199 L15 200 L27 165 Z" className="fill-ink-muted" />
          <path d="M52 160 L67 199 L61 200 L49 165 Z" className="fill-ink-muted" />
          {/* Engine bell */}
          <path d="M29 174 L24 194 L52 194 L47 174 Z" className="fill-ink-faint" />
        </svg>

        <span className="rocket-flame" />
        <span className="rocket-glow" />
      </div>
    </div>
  )
}

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
 * Shaped after LVM3: an ogive fairing wider than the stage beneath it, a
 * ribbed cryogenic core, and two solid boosters strapped either side — which
 * is the silhouette, more than any decal, that reads as Indian. Stencilled the
 * way the real one is: LVM3 on the core, ISRO and INDIA down the boosters.
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

        <svg className="rocket-body" viewBox="0 0 50 222" width="70" height="311" fill="none">
          {/* ---- Payload fairing. Ogive, and wider than the stage under it:
                  that step is the silhouette that reads as a launch vehicle
                  rather than a cartoon rocket. ---- */}
          <path
            d="M25 2 C 21.5 9, 14 20, 14 32 L14 62 L36 62 L36 32 C 36 20, 28.5 9, 25 2 Z"
            className="fill-ink"
          />
          <path d="M14 62 L36 62 L33 74 L17 74 Z" className="fill-ink" />

          {/* ---- Equipment bay ---- */}
          <rect x="17" y="74" width="16" height="11" fill="#b4b4c2" />

          {/* ---- L110 / C25 core ---- */}
          <rect x="17" y="85" width="16" height="113" className="fill-ink" />
          {/* The cryogenic section runs a shade colder than the rest */}
          <rect x="17" y="120" width="16" height="42" fill="#dcdce4" />
          <g stroke="rgba(0,0,0,0.16)" strokeWidth="0.55">
            <path d="M17 126 H33 M17 133 H33 M17 140 H33 M17 147 H33 M17 154 H33 M17 161 H33" />
          </g>
          <path d="M20 198 L16.5 216 L33.5 216 L30 198 Z" className="fill-ink-faint" />

          {/* ---- S200 solid boosters, strapped tight to the core ---- */}
          <path
            d="M9 96 C 6.5 103, 2 112, 2 121 L2 202 L16 202 L16 121 C 16 112, 11.5 103, 9 96 Z"
            className="fill-ink"
          />
          <path
            d="M41 96 C 43.5 103, 48 112, 48 121 L48 202 L34 202 L34 121 C 34 112, 38.5 103, 41 96 Z"
            className="fill-ink"
          />
          <path d="M4.5 202 L2 219 L15 219 L13 202 Z" className="fill-ink-faint" />
          <path d="M45.5 202 L48 219 L35 219 L37 202 Z" className="fill-ink-faint" />
          {/* Segment joints */}
          <g stroke="rgba(0,0,0,0.18)" strokeWidth="0.55">
            <path d="M2 140 H16 M2 174 H16 M34 140 H48 M34 174 H48" />
          </g>

          {/* ---- Fairing decals ---- */}
          {/* The national colours. Literal hex on purpose: these are the flag's
              values, not the product's palette, so they are not tokens. */}
          <rect x="16.5" y="38" width="8" height="1.8" fill="#FF9933" />
          <rect x="16.5" y="39.8" width="8" height="1.8" fill="#FFFFFF" />
          <rect x="16.5" y="41.6" width="8" height="1.8" fill="#138808" />
          <circle cx="20.5" cy="40.7" r="0.7" fill="none" stroke="#000080" strokeWidth="0.3" />
          <rect
            x="16.5"
            y="38"
            width="8"
            height="5.4"
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.35"
          />

          {/* Agency mark. Drawn, not the official asset: an ascending vehicle
              inside its orbit, in ISRO's vermillion. Drop the real file into
              public/ and this swaps out in one line. */}
          <g transform="translate(30.5 40.7)">
            <circle r="3.8" fill="#0b0b12" />
            <ellipse
              rx="3.1"
              ry="1.3"
              transform="rotate(-26)"
              fill="none"
              stroke="#FF6D00"
              strokeWidth="0.45"
            />
            <path d="M0 -3.1 L0.9 -0.6 L0.9 1.1 L-0.9 1.1 L-0.9 -0.6 Z" fill="#FF6D00" />
            <path d="M-0.9 1.1 L0 3 L0.9 1.1 Z" fill="#FF9933" />
          </g>

          {/* ---- Stencilling, where the real vehicle carries it ---- */}
          <text
            x="25"
            y="93"
            textAnchor="middle"
            fontSize="4.2"
            fontWeight="700"
            className="fill-paper font-mono"
          >
            LVM3
          </text>
          <text
            x="9"
            y="155"
            transform="rotate(90 9 155)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="6"
            fontWeight="700"
            letterSpacing="1.6"
            className="fill-paper font-mono"
          >
            ISRO
          </text>
          <text
            x="41"
            y="155"
            transform="rotate(90 41 155)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="5.5"
            fontWeight="700"
            letterSpacing="1.3"
            className="fill-paper font-mono"
          >
            INDIA
          </text>
        </svg>

        {/* Three plumes: the two solid boosters, and the core between them. */}
        <span className="rocket-flame rocket-flame--left" />
        <span className="rocket-flame rocket-flame--right" />
        <span className="rocket-flame rocket-flame--core" />
        <span className="rocket-glow" />
      </div>
    </div>
  )
}

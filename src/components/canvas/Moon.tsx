import { useEffect, useRef } from 'react'

type Feature = {
  /** Position in unit-disc coordinates, so the same moon redraws at any size. */
  x: number
  y: number
  r: number
  /** Maria are broad and soft; craters are small, shadowed and rimmed. */
  mare: boolean
  tone: number
}

/** Light arrives from the upper left, and every shadow on the disc agrees. */
const LIGHT_X = -0.55
const LIGHT_Y = -0.83

/** Deterministic, so the moon is the same one on every resize and every visit. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildFeatures(): Feature[] {
  const rand = mulberry32(0x5eed)
  const out: Feature[] = []

  const place = (maxR: number) => {
    const bound = 0.9 - maxR
    while (true) {
      const x = rand() * 2 - 1
      const y = rand() * 2 - 1
      if (Math.hypot(x, y) <= bound) return { x, y }
    }
  }

  // The dark seas first — big, soft, and low contrast.
  for (let i = 0; i < 6; i += 1) {
    const r = 0.16 + rand() * 0.16
    out.push({ ...place(r), r, mare: true, tone: 0.4 + rand() * 0.35 })
  }

  // Then craters. Small ones far outnumber large ones, as on the real thing.
  for (let i = 0; i < 62; i += 1) {
    const r = 0.018 + Math.pow(rand(), 2.2) * 0.12
    out.push({ ...place(r), r, mare: false, tone: 0.5 + rand() * 0.5 })
  }

  return out
}

/**
 * The moon over the landing page.
 *
 * Drawn once per resize rather than per frame: scrolling only changes an
 * opacity and a transform, so the whole thing costs nothing while you read.
 * It climbs and fades as the page moves, which is what clears the sky for the
 * content below — by the time the first section arrives it has gone.
 */
export function Moon() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const features = buildFeatures()
    const TAU = Math.PI * 2

    let lastW = 0
    let lastH = 0

    const draw = () => {
      // Measured off the root element rather than window.innerWidth, which a
      // backgrounded tab reports as zero — and never off this canvas, whose own
      // box follows its intrinsic size, so measuring it feeds each draw back
      // into the next one. The CSS size is pinned for the same reason.
      const w = document.documentElement.clientWidth
      const h = document.documentElement.clientHeight
      if (w < 2 || h < 2) return
      if (w === lastW && h === lastH) return
      lastW = w
      lastH = h

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Wide screens get it cropped by the top edge — we are looking up at
      // it. Only a quarter of the disc is hidden: crop much more than that and
      // all that is left on screen is the limb, where foreshortening and limb
      // darkening between them erase every crater.
      //
      // A phone has no room for that. Its header takes the top 132px and the
      // headline starts at 272, so there the moon is whole, hangs just under
      // the header, and is drawn at half strength — the eyebrow line crosses
      // it, and that line has to stay readable.
      const narrow = w < 700
      const R = narrow
        ? w * 0.3
        : Math.min(Math.max(w * 0.34, h * 0.34), h * 0.4, 460)
      const cx = w * 0.5
      const cy = narrow ? 132 + R * 0.55 : -R * 0.25
      ctx.globalAlpha = narrow ? 0.5 : 1

      // The halo it throws into the surrounding sky.
      const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 2)
      halo.addColorStop(0, 'rgba(206, 216, 255, 0.1)')
      halo.addColorStop(0.45, 'rgba(206, 216, 255, 0.04)')
      halo.addColorStop(1, 'rgba(206, 216, 255, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 2, 0, TAU)
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, TAU)
      ctx.clip()

      // Regolith, near-full: bright across the face, darkening only at the
      // limb. Anything more directional loses the cap, which is all we see.
      const base = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, R)
      base.addColorStop(0, '#f4f4f8')
      base.addColorStop(0.62, '#dedee6')
      base.addColorStop(0.88, '#c2c2cf')
      base.addColorStop(1, '#9c9caa')
      ctx.fillStyle = base
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

      for (const f of features) {
        const d = Math.hypot(f.x, f.y)
        // Foreshortening: a feature near the limb is squashed along the radius.
        const k = Math.sqrt(Math.max(0.06, 1 - d * d))
        const a = d === 0 ? 1 : f.x / d
        const b = d === 0 ? 0 : f.y / d
        const m11 = k * a * a + b * b
        const m12 = (k - 1) * a * b
        const m22 = k * b * b + a * a

        ctx.save()
        ctx.transform(m11, m12, m12, m22, cx + f.x * R, cy + f.y * R)
        const rr = f.r * R

        if (f.mare) {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr)
          g.addColorStop(0, `rgba(24, 26, 44, ${0.6 * f.tone})`)
          g.addColorStop(0.6, `rgba(24, 26, 44, ${0.4 * f.tone})`)
          g.addColorStop(1, 'rgba(24, 26, 44, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(0, 0, rr, 0, TAU)
          ctx.fill()
        } else {
          // Bowl: the wall facing the light is in shadow, the far wall is lit.
          const shadow = ctx.createRadialGradient(
            LIGHT_X * rr * 0.34,
            LIGHT_Y * rr * 0.34,
            rr * 0.08,
            0,
            0,
            rr,
          )
          shadow.addColorStop(0, `rgba(22, 24, 38, ${0.44 * f.tone})`)
          shadow.addColorStop(0.75, `rgba(22, 24, 38, ${0.16 * f.tone})`)
          shadow.addColorStop(1, 'rgba(22, 24, 38, 0)')
          ctx.fillStyle = shadow
          ctx.beginPath()
          ctx.arc(0, 0, rr, 0, TAU)
          ctx.fill()

          const lit = ctx.createRadialGradient(
            -LIGHT_X * rr * 0.5,
            -LIGHT_Y * rr * 0.5,
            rr * 0.05,
            -LIGHT_X * rr * 0.5,
            -LIGHT_Y * rr * 0.5,
            rr * 0.75,
          )
          lit.addColorStop(0, `rgba(255, 255, 255, ${0.46 * f.tone})`)
          lit.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = lit
          ctx.beginPath()
          ctx.arc(0, 0, rr, 0, TAU)
          ctx.fill()
        }
        ctx.restore()
      }

      // Limb darkening: the edge turns away from us, so it dims. Centred on
      // the disc, which keeps the visible face evenly lit.
      const limb = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R)
      limb.addColorStop(0, 'rgba(6, 6, 14, 0)')
      limb.addColorStop(0.82, 'rgba(6, 6, 14, 0.1)')
      limb.addColorStop(1, 'rgba(6, 6, 14, 0.36)')
      ctx.fillStyle = limb
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

      // The lower half sets into haze rather than ending at a hard edge. That
      // is what lets the disc be this large: the hero's own type runs across
      // the bottom of it, and by then the moon has gone.
      const haze = ctx.createLinearGradient(0, cy + R * 0.55, 0, cy + R)
      haze.addColorStop(0, 'rgba(6, 6, 10, 0)')
      haze.addColorStop(1, 'rgba(6, 6, 10, 0.94)')
      ctx.fillStyle = haze
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
      ctx.restore()

      // A thin lit edge, so the disc separates from the sky.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      // Only the upper arc, where the disc still has a body behind it.
      ctx.arc(cx, cy, R - 0.5, Math.PI * 0.78, Math.PI * 0.22, true)
      ctx.stroke()

      ctx.globalAlpha = 1

      // The header sits on this sky and carries its own translucent ground.
      // This only takes the top edge down far enough that the ground has
      // something to work against — the disc stays bright underneath it.
      const HEADER = 96
      const cap = ctx.createLinearGradient(0, 0, 0, HEADER)
      cap.addColorStop(0, 'rgba(6, 6, 10, 0.55)')
      cap.addColorStop(0.5, 'rgba(6, 6, 10, 0.3)')
      cap.addColorStop(1, 'rgba(6, 6, 10, 0)')
      ctx.fillStyle = cap
      ctx.fillRect(0, 0, w, HEADER)
    }

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Gone within the first screen — it belongs to the hero, not the page.
        const p = Math.min(1, window.scrollY / Math.max(1, lastH * 0.72))
        canvas.style.opacity = String(Math.max(0, 1 - p * p))
        canvas.style.transform = `translate3d(0, ${-p * 16}vh, 0)`
      })
    }

    const onResize = () => {
      draw()
      onScroll()
    }

    draw()
    onScroll()
    // Covers the case where the viewport only gets a size after mount — the
    // window 'resize' event never fires for that first measurement.
    const observer = new ResizeObserver(onResize)
    observer.observe(document.documentElement)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="moon-layer" />
}

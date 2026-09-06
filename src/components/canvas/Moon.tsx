import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

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
const LIGHT_ANGLE = Math.atan2(LIGHT_Y, LIGHT_X)
const TAU = Math.PI * 2

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
 * The surface — regolith, maria, sixty-eight craters with their foreshortening
 * and their shadows — is drawn once into an offscreen canvas and only redrawn
 * when the viewport changes size. Every frame after that is one image blit and
 * four gradients, which is what makes it affordable to animate at all.
 *
 * What moves: it librates, the way the real one does, so the face turns a few
 * degrees back and forth rather than sitting frozen; the terminator swings, so
 * the light is coming from somewhere that moves; the corona breathes; and it
 * leans a little towards the pointer. Scrolling lifts it, shrinks it and fades
 * it out inside the first screen, which is what clears the sky for the page.
 */
export function Moon() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // The surface lives here, and is repainted only on resize.
    const surface = document.createElement('canvas')
    const sctx = surface.getContext('2d')
    if (!sctx) return

    const features = buildFeatures()
    const animated = !prefersReducedMotion

    let w = 0
    let h = 0
    let R = 0
    let cx = 0
    let cy = 0
    let narrow = false
    let dirty = true

    /** Paints the disc into the offscreen canvas, centred, at radius R. */
    const paintSurface = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const side = Math.max(2, Math.ceil(2 * R))
      surface.width = Math.round(side * dpr)
      surface.height = Math.round(side * dpr)
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sctx.clearRect(0, 0, side, side)

      const o = R // the disc's centre inside its own square

      sctx.save()
      sctx.beginPath()
      sctx.arc(o, o, R, 0, TAU)
      sctx.clip()

      // Regolith, near-full: bright across the face, darkening only at the
      // limb. Anything more directional loses the cap, which is all we see.
      const base = sctx.createRadialGradient(o, o, R * 0.05, o, o, R)
      base.addColorStop(0, '#f4f4f8')
      base.addColorStop(0.62, '#dedee6')
      base.addColorStop(0.88, '#c2c2cf')
      base.addColorStop(1, '#9c9caa')
      sctx.fillStyle = base
      sctx.fillRect(0, 0, side, side)

      for (const f of features) {
        const d = Math.hypot(f.x, f.y)
        // Foreshortening: a feature near the limb is squashed along the radius.
        const k = Math.sqrt(Math.max(0.06, 1 - d * d))
        const a = d === 0 ? 1 : f.x / d
        const b = d === 0 ? 0 : f.y / d
        const m11 = k * a * a + b * b
        const m12 = (k - 1) * a * b
        const m22 = k * b * b + a * a

        sctx.save()
        sctx.transform(m11, m12, m12, m22, o + f.x * R, o + f.y * R)
        const rr = f.r * R

        if (f.mare) {
          const g = sctx.createRadialGradient(0, 0, 0, 0, 0, rr)
          g.addColorStop(0, `rgba(24, 26, 44, ${0.6 * f.tone})`)
          g.addColorStop(0.6, `rgba(24, 26, 44, ${0.4 * f.tone})`)
          g.addColorStop(1, 'rgba(24, 26, 44, 0)')
          sctx.fillStyle = g
          sctx.beginPath()
          sctx.arc(0, 0, rr, 0, TAU)
          sctx.fill()
        } else {
          // Bowl: the wall facing the light is in shadow, the far wall is lit.
          const shadow = sctx.createRadialGradient(
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
          sctx.fillStyle = shadow
          sctx.beginPath()
          sctx.arc(0, 0, rr, 0, TAU)
          sctx.fill()

          const lit = sctx.createRadialGradient(
            -LIGHT_X * rr * 0.5,
            -LIGHT_Y * rr * 0.5,
            rr * 0.05,
            -LIGHT_X * rr * 0.5,
            -LIGHT_Y * rr * 0.5,
            rr * 0.75,
          )
          lit.addColorStop(0, `rgba(255, 255, 255, ${0.46 * f.tone})`)
          lit.addColorStop(1, 'rgba(255, 255, 255, 0)')
          sctx.fillStyle = lit
          sctx.beginPath()
          sctx.arc(0, 0, rr, 0, TAU)
          sctx.fill()
        }
        sctx.restore()
      }

      // Limb darkening: the edge turns away from us, so it dims.
      const limb = sctx.createRadialGradient(o, o, R * 0.5, o, o, R)
      limb.addColorStop(0, 'rgba(6, 6, 14, 0)')
      limb.addColorStop(0.82, 'rgba(6, 6, 14, 0.1)')
      limb.addColorStop(1, 'rgba(6, 6, 14, 0.36)')
      sctx.fillStyle = limb
      sctx.fillRect(0, 0, side, side)
      sctx.restore()

      // A thin lit edge on the upper arc, so the disc separates from the sky.
      sctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      sctx.lineWidth = 1
      sctx.beginPath()
      sctx.arc(o, o, R - 0.5, Math.PI * 0.78, Math.PI * 0.22, true)
      sctx.stroke()
    }

    /** Re-measures the viewport and repaints the surface if it changed. */
    const measure = () => {
      // Measured off the root element rather than window.innerWidth, which a
      // backgrounded tab reports as zero — and never off this canvas, whose own
      // box follows its intrinsic size, so measuring it feeds each draw back
      // into the next one. The CSS size is pinned for the same reason.
      const nw = document.documentElement.clientWidth
      const nh = document.documentElement.clientHeight
      if (nw < 2 || nh < 2) return false
      if (nw === w && nh === h) return false
      w = nw
      h = nh

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Wide screens get it cropped by the top edge — we are looking up at
      // it. Only a quarter of the disc is hidden: crop much more than that and
      // all that is left on screen is the limb, where foreshortening and limb
      // darkening between them erase every crater.
      //
      // A phone has no room for that. Its header takes the top 132px and the
      // headline starts at 272, so there the moon is whole, hangs just under
      // the header, and is drawn at half strength — the eyebrow line crosses
      // it, and that line has to stay readable.
      narrow = w < 700
      R = narrow ? w * 0.3 : Math.min(Math.max(w * 0.34, h * 0.34), h * 0.4, 460)
      cx = w * 0.5
      cy = narrow ? 132 + R * 0.55 : -R * 0.25

      paintSurface()
      dirty = true
      return true
    }

    // Pointer lean, eased towards its target so it glides rather than snaps.
    let targetX = 0
    let targetY = 0
    let leanX = 0
    let leanY = 0
    const onPointer = (e: PointerEvent) => {
      targetX = (e.clientX / Math.max(1, w) - 0.5) * 14
      targetY = (e.clientY / Math.max(1, h) - 0.5) * 9
    }

    let lastTransform = ''
    let lastOpacity = ''
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (R <= 0) return

      // Gone within the first screen — it belongs to the hero, not the page.
      const p = Math.min(1, window.scrollY / Math.max(1, h * 0.72))
      const opacity = Math.max(0, 1 - p * p)

      leanX += (targetX - leanX) * 0.05
      leanY += (targetY - leanY) * 0.05

      const op = opacity.toFixed(3)
      if (op !== lastOpacity) {
        canvas.style.opacity = op
        lastOpacity = op
      }
      // It lifts away and recedes as the page moves under it.
      const tf =
        `translate3d(${leanX.toFixed(1)}px, calc(${(-p * 16).toFixed(2)}vh + ` +
        `${leanY.toFixed(1)}px), 0) scale(${(1 - p * 0.06).toFixed(3)})`
      if (tf !== lastTransform) {
        canvas.style.transform = tf
        lastTransform = tf
      }

      // Nothing below is worth doing once it has faded out, and on a still
      // page with reduced motion nothing below would change anyway.
      if (opacity < 0.01) return
      if (!animated && !dirty) return
      dirty = false

      const t = animated ? now : 0
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = narrow ? 0.5 : 1

      // The corona it throws into the sky, breathing slowly.
      const pulse = 0.5 + 0.5 * Math.sin(t / 4200)
      const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 2)
      halo.addColorStop(0, `rgba(206, 216, 255, ${(0.075 + 0.05 * pulse).toFixed(3)})`)
      halo.addColorStop(0.45, 'rgba(206, 216, 255, 0.035)')
      halo.addColorStop(1, 'rgba(206, 216, 255, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 2, 0, TAU)
      ctx.fill()

      // Libration. The real moon shows us a few degrees around its edges as it
      // rocks through its orbit; this is that, slowed down and shrunk.
      const roll = 0.055 * Math.sin(t / 17000)
      const bob = R * 0.01 * Math.sin(t / 23000)
      const dy = cy + bob

      ctx.save()
      ctx.translate(cx, dy)
      ctx.rotate(roll)
      ctx.drawImage(surface, -R, -R, R * 2, R * 2)
      ctx.restore()

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, dy, R, 0, TAU)
      ctx.clip()

      // The terminator, swinging: the light is coming from somewhere, and that
      // somewhere moves.
      const th = LIGHT_ANGLE + 0.3 * Math.sin(t / 29000)
      const lx = Math.cos(th) * R
      const ly = Math.sin(th) * R
      const term = ctx.createLinearGradient(cx + lx, dy + ly, cx - lx, dy - ly)
      term.addColorStop(0, 'rgba(4, 4, 10, 0)')
      term.addColorStop(0.55, 'rgba(4, 4, 10, 0.08)')
      term.addColorStop(1, 'rgba(4, 4, 10, 0.46)')
      ctx.fillStyle = term
      ctx.fillRect(cx - R, dy - R, R * 2, R * 2)

      // The lower half sets into haze rather than ending at a hard edge. That
      // is what lets the disc be this large: the hero's own type runs across
      // the bottom of it, and by then the moon has gone.
      const haze = ctx.createLinearGradient(0, dy + R * 0.55, 0, dy + R)
      haze.addColorStop(0, 'rgba(6, 6, 10, 0)')
      haze.addColorStop(1, 'rgba(6, 6, 10, 0.94)')
      ctx.fillStyle = haze
      ctx.fillRect(cx - R, dy - R, R * 2, R * 2)
      ctx.restore()

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

    // Measuring reads layout, so it happens when the viewport actually
    // changes — never inside the frame loop, which would flush style sixty
    // times a second for an answer that almost never differs.
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.documentElement)

    raf = requestAnimationFrame(frame)
    if (animated) window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="moon-layer" />
}

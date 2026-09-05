import { useEffect, useRef } from 'react'
import { alpha, token } from '../../lib/tokens'
import { cx } from '../../lib/cx'
import { prefersReducedMotion } from '../../lib/motion'
import type { TrackState } from '../../sim/types'

type Star = { x: number; y: number; r: number; a: number }
type Glyph = { x: number; y: number; size: number; rot: number; spin: number; phase: number }

/**
 * The link, drawn where it actually happens: a ground station on the limb, a
 * satellite crossing overhead, and the beam between them holding, breaking and
 * being reacquired.
 *
 * Line work rather than imagery — on paper an engineering drawing reads as
 * space far better than a rendered planet does, and it stays honest about the
 * fact that this is a model, not a photograph.
 */
export function OrbitalScene({
  onState,
  className,
}: {
  onState?: (s: TrackState) => void
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onStateRef = useRef(onState)
  useEffect(() => {
    onStateRef.current = onState
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let stars: Star[] = []
    let glyphs: Glyph[] = []
    let raf = 0
    let lastState: TrackState | null = null

    const seed = () => {
      stars = Array.from({ length: Math.round((width * height) / 4200) }, () => ({
        x: Math.random(),
        y: Math.random() * 0.72,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.12,
      }))
      glyphs = Array.from({ length: 14 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.7,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.0004,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    /** The same lock / occlusion / reacquire clock the tracker runs on. */
    const linkPhase = (t: number) => {
      const p = t % 13000
      if (p < 8200) return { phase: 'locked' as const, progress: p / 8200 }
      if (p < 9800) return { phase: 'occluded' as const, progress: (p - 8200) / 1600 }
      return { phase: 'reacquire' as const, progress: (p - 9800) / 3200 }
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      // --- Earth ------------------------------------------------------------
      // A limb this shallow needs a circle far larger than the canvas.
      const R = width * 1.35
      const cx0 = width * 0.5
      const cy0 = height + R - height * 0.16

      const ground = ctx.createLinearGradient(0, height * 0.74, 0, height)
      ground.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
      ground.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
      ctx.fillStyle = ground
      ctx.beginPath()
      ctx.arc(cx0, cy0, R, Math.PI, Math.PI * 2)
      ctx.closePath()
      ctx.fill()

      // Atmosphere: the one place the beam colour behaves like light.
      const limbTop = cy0 - R
      const air = ctx.createLinearGradient(0, limbTop - 40, 0, limbTop + 4)
      air.addColorStop(0, alpha('beam', 0))
      air.addColorStop(0.55, alpha('beam', 0.22))
      air.addColorStop(0.9, alpha('beam', 0.6))
      air.addColorStop(1, alpha('beam', 0.15))
      ctx.fillStyle = air
      ctx.fillRect(0, limbTop - 40, width, 46)

      ctx.strokeStyle = alpha('ink', 0.55)
      ctx.lineWidth = 1.25
      ctx.beginPath()
      ctx.arc(cx0, cy0, R, Math.PI, Math.PI * 2)
      ctx.stroke()

      // --- Sky --------------------------------------------------------------
      for (const s of stars) {
        const y = s.y * height
        if (y > limbTop - 8) continue
        ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t * 0.0012 + s.x * 30))
        ctx.fillStyle = token('ink')
        ctx.beginPath()
        ctx.arc(s.x * width, y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Candidates the tracker considers and rejects.
      ctx.lineWidth = 1
      for (const g of glyphs) {
        const gy = g.y * height
        if (gy > limbTop - 20) continue
        g.rot += g.spin * 16
        g.phase += 0.0006 * 16
        ctx.save()
        ctx.translate(g.x * width, gy)
        ctx.rotate(g.rot)
        ctx.beginPath()
        ctx.moveTo(0, -g.size)
        ctx.lineTo(g.size * 0.88, g.size * 0.66)
        ctx.lineTo(-g.size * 0.88, g.size * 0.66)
        ctx.closePath()
        ctx.strokeStyle = alpha('ink', 0.1 + ((Math.sin(g.phase) + 1) / 2) * 0.14)
        ctx.stroke()
        ctx.restore()
      }

      // --- Ground station ---------------------------------------------------
      const stationX = width * 0.2
      const stationY = cy0 - Math.sqrt(Math.max(0, R * R - (stationX - cx0) ** 2))
      ctx.strokeStyle = alpha('ink', 0.75)
      ctx.lineWidth = 1.25
      ctx.beginPath()
      ctx.moveTo(stationX, stationY)
      ctx.lineTo(stationX, stationY - 16)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(stationX - 9, stationY)
      ctx.lineTo(stationX, stationY - 14)
      ctx.lineTo(stationX + 9, stationY)
      ctx.closePath()
      ctx.stroke()

      // --- Satellite --------------------------------------------------------
      // A pass: rises, transits, sets, then the next one begins.
      const pass = ((t % 34000) / 34000) * Math.PI
      const satX = width * (0.08 + (Math.cos(Math.PI - pass) * 0.5 + 0.5) * 0.86)
      const satY = limbTop - Math.sin(pass) * height * 0.3 - height * 0.05

      const { phase, progress } = linkPhase(t)
      const state: TrackState =
        phase === 'locked' ? 'LOCKED' : phase === 'occluded' ? 'TRACK_LOST' : 'SEARCHING'
      if (state !== lastState) {
        lastState = state
        onStateRef.current?.(state)
      }

      // --- Link -------------------------------------------------------------
      ctx.lineWidth = 1.25
      if (phase === 'occluded') {
        const cut = 0.2 + progress * 0.16
        ctx.strokeStyle = alpha('beam', 0.5)
        ctx.beginPath()
        ctx.moveTo(stationX, stationY - 14)
        ctx.lineTo(stationX + (satX - stationX) * cut, stationY - 14 + (satY - stationY + 14) * cut)
        ctx.moveTo(satX, satY)
        ctx.lineTo(satX - (satX - stationX) * cut, satY - (satY - stationY + 14) * cut)
        ctx.stroke()

        ctx.setLineDash([2, 7])
        ctx.strokeStyle = alpha('ink', 0.2)
        ctx.beginPath()
        ctx.moveTo(stationX + (satX - stationX) * cut, stationY - 14 + (satY - stationY + 14) * cut)
        ctx.lineTo(satX - (satX - stationX) * cut, satY - (satY - stationY + 14) * cut)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (phase === 'reacquire') {
        const reach = Math.min(1, progress * 1.4)
        ctx.strokeStyle = alpha('beam', 0.35 + reach * 0.5)
        ctx.beginPath()
        ctx.moveTo(stationX, stationY - 14)
        ctx.lineTo(stationX + (satX - stationX) * reach, stationY - 14 + (satY - stationY + 14) * reach)
        ctx.stroke()
      } else {
        const pulse = 0.55 + ((Math.sin(t * 0.0024) + 1) / 2) * 0.4
        ctx.strokeStyle = alpha('beam', pulse)
        ctx.beginPath()
        ctx.moveTo(stationX, stationY - 14)
        ctx.lineTo(satX, satY)
        ctx.stroke()

        // A packet running the link.
        const travel = (t % 2800) / 2800
        ctx.fillStyle = token('beam')
        ctx.beginPath()
        ctx.arc(
          stationX + (satX - stationX) * travel,
          stationY - 14 + (satY - stationY + 14) * travel,
          2.6,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }

      // Body last, so the link runs behind it.
      ctx.save()
      ctx.translate(satX, satY)
      ctx.rotate(Math.sin(t * 0.0004) * 0.12)
      ctx.fillStyle = token('paper')
      ctx.strokeStyle = alpha('ink', 0.85)
      ctx.lineWidth = 1.25
      ctx.fillRect(-6, -5, 12, 10)
      ctx.strokeRect(-6, -5, 12, 10)
      ctx.strokeRect(-20, -3.5, 13, 7)
      ctx.strokeRect(7, -3.5, 13, 7)
      ctx.restore()

      // Its shadow on the limb, so the pass has somewhere to be.
      ctx.strokeStyle = alpha('ink', 0.2)
      ctx.setLineDash([2, 6])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(satX, satY + 12)
      ctx.lineTo(satX, cy0 - Math.sqrt(Math.max(0, R * R - (satX - cx0) ** 2)))
      ctx.stroke()
      ctx.setLineDash([])
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    resize()
    if (prefersReducedMotion) draw(4000)
    else raf = requestAnimationFrame(loop)

    const observer = new ResizeObserver(() => {
      resize()
      if (prefersReducedMotion) draw(4000)
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className={cx('block size-full', className)} />
}

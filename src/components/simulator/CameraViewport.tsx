import { useEffect, useRef } from 'react'
import type { SimSnapshot } from '../../sim/useTracker'
import { alpha, token } from '../../lib/tokens'

type Props = {
  snapshotRef: React.RefObject<SimSnapshot>
  modeLabel: string
  sceneLabel: string
  frame: number
}

type Star = { x: number; y: number; r: number; a: number }

/**
 * Treated as a cinematic media container: a 10px-radius full-bleed frame with
 * overlays and glass chips floating on top. Elevation comes from the frame
 * itself, never from a shadow.
 */
export function CameraViewport({ snapshotRef, modeLabel, sceneLabel, frame }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let stars: Star[] = []
    let raf = 0

    const seedStars = () => {
      const count = Math.round((width * height) / 5200)
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 0.9 + 0.2,
        a: Math.random() * 0.35 + 0.05,
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
      seedStars()
    }

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      const snap = snapshotRef.current
      if (!snap) return

      const white = token('pure-white')
      ctx.clearRect(0, 0, width, height)

      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 0.001 + s.x * 40))
        ctx.fillStyle = white
        ctx.beginPath()
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const bx = snap.truth.x * width
      const by = snap.truth.y * height

      // The beacon — the sensor seeing a source. Warm, like everything lit here.
      if (!snap.occluded) {
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 28)
        glow.addColorStop(0, alpha('lamp-cream', 0.45))
        glow.addColorStop(1, alpha('lamp-cream', 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(bx, by, 28, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = token('lamp-cream')
        ctx.beginPath()
        ctx.arc(bx, by, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      const dx = snap.detection.x * width
      const dy = snap.detection.y * height

      // Track trail.
      ctx.strokeStyle = alpha('pure-white', 0.28)
      ctx.lineWidth = 1
      ctx.beginPath()
      snap.trail.forEach((point, i) => {
        const tx = point.x * width
        const ty = point.y * height
        if (i === 0) ctx.moveTo(tx, ty)
        else ctx.lineTo(tx, ty)
      })
      ctx.stroke()

      // Detection box, with corner ticks.
      const box = snap.boxSize * Math.min(width, height)
      ctx.strokeStyle = snap.occluded ? token('graphite') : alpha('pure-white', 0.5)
      ctx.strokeRect(dx - box / 2, dy - box / 2, box, box)

      const tick = Math.max(6, box * 0.16)
      ctx.strokeStyle = snap.occluded ? token('smoke') : token('lamp-cream')
      ctx.beginPath()
      for (const [cx, cy, sx, sy] of [
        [dx - box / 2, dy - box / 2, 1, 1],
        [dx + box / 2, dy - box / 2, -1, 1],
        [dx - box / 2, dy + box / 2, 1, -1],
        [dx + box / 2, dy + box / 2, -1, -1],
      ]) {
        ctx.moveTo(cx, cy + sy * tick)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx + sx * tick, cy)
      }
      ctx.stroke()

      // Reticle.
      ctx.strokeStyle = alpha('pure-white', 0.14)
      ctx.beginPath()
      ctx.moveTo(dx, 0)
      ctx.lineTo(dx, dy - box / 2 - 8)
      ctx.moveTo(dx, dy + box / 2 + 8)
      ctx.lineTo(dx, height)
      ctx.moveTo(0, dy)
      ctx.lineTo(dx - box / 2 - 8, dy)
      ctx.moveTo(dx + box / 2 + 8, dy)
      ctx.lineTo(width, dy)
      ctx.stroke()

      // Kalman prediction ghost.
      const gx = snap.prediction.x * width
      const gy = snap.prediction.y * height
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = alpha('smoke', 0.7)
      ctx.strokeRect(gx - box / 2, gy - box / 2, box, box)
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      ctx.lineTo(gx, gy)
      ctx.stroke()
      ctx.setLineDash([])

      // Edge rulers.
      ctx.font = '11px Satoshi, Inter, ui-sans-serif, sans-serif'
      ctx.fillStyle = alpha('pure-white', 0.4)
      ctx.strokeStyle = alpha('pure-white', 0.18)

      ctx.beginPath()
      for (let i = 0; i <= 12; i += 1) {
        const x = (i / 12) * width
        const major = i % 3 === 0
        ctx.moveTo(x, height)
        ctx.lineTo(x, height - (major ? 9 : 4))
        if (major) ctx.fillText((((i / 12) - 0.5) * 24).toFixed(0), x + 4, height - 12)
      }
      for (let i = 0; i <= 8; i += 1) {
        const y = (i / 8) * height
        const major = i % 2 === 0
        ctx.moveTo(0, y)
        ctx.lineTo(major ? 9 : 4, y)
        if (major) ctx.fillText((42 + (0.5 - i / 8) * 16).toFixed(0), 13, y + 4)
      }
      ctx.stroke()
    }

    resize()
    raf = requestAnimationFrame(draw)

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [snapshotRef])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-void-black">
      <canvas ref={canvasRef} className="block size-full" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-16">
        <div className="flex items-start justify-between gap-16">
          <span className="text-label-sm font-medium uppercase text-smoke">Netra · EO-Track</span>
          <span className="tabular text-label-sm font-medium uppercase text-smoke">
            Frame {String(frame).padStart(6, '0')}
          </span>
        </div>
        <div className="flex items-end justify-between gap-16">
          <span className="text-label-sm font-medium uppercase text-smoke">{sceneLabel}</span>
          <span className="text-label-sm font-medium uppercase text-smoke">{modeLabel}</span>
        </div>
      </div>
    </div>
  )
}

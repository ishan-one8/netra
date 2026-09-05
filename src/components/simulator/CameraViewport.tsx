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
 * The one bordered surface in the product, and the only place light is emitted.
 * Everything inside is sensor imagery and overlay — outside it, the void.
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

      const bone = token('bone')

      ctx.clearRect(0, 0, width, height)

      // --- Sensor scene ------------------------------------------------------
      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 0.001 + s.x * 40))
        ctx.fillStyle = bone
        ctx.beginPath()
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const bx = snap.truth.x * width
      const by = snap.truth.y * height

      // The beacon itself — diegetic light, the sensor seeing a source.
      if (!snap.occluded) {
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 26)
        glow.addColorStop(0, alpha('bone', 0.5))
        glow.addColorStop(1, alpha('bone', 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(bx, by, 26, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = bone
        ctx.beginPath()
        ctx.arc(bx, by, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // --- Overlays ----------------------------------------------------------
      const dx = snap.detection.x * width
      const dy = snap.detection.y * height

      // Track trail.
      ctx.strokeStyle = alpha('beam', 0.35)
      ctx.lineWidth = 1
      ctx.beginPath()
      snap.trail.forEach((point, i) => {
        const px = point.x * width
        const py = point.y * height
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()

      // Detection bounding box.
      const box = snap.boxSize * Math.min(width, height)
      ctx.strokeStyle = snap.occluded ? alpha('fault', 0.6) : alpha('beam', 0.85)
      ctx.strokeRect(dx - box / 2, dy - box / 2, box, box)

      // Corner ticks on the box read as instrumentation, not a card.
      const tick = Math.max(6, box * 0.16)
      ctx.strokeStyle = snap.occluded ? alpha('fault', 0.9) : alpha('bone', 0.85)
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

      // Crosshair reticle across the full frame.
      ctx.strokeStyle = alpha('bone', 0.18)
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
      const px = snap.prediction.x * width
      const py = snap.prediction.y * height
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = alpha('beam', 0.5)
      ctx.strokeRect(px - box / 2, py - box / 2, box, box)
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      ctx.lineTo(px, py)
      ctx.stroke()
      ctx.setLineDash([])

      // --- Edge rulers -------------------------------------------------------
      ctx.font = '11px "JetBrains Mono", ui-monospace, monospace'
      ctx.fillStyle = alpha('bone', 0.45)
      ctx.strokeStyle = alpha('bone', 0.2)

      ctx.beginPath()
      for (let i = 0; i <= 12; i += 1) {
        const x = (i / 12) * width
        const major = i % 3 === 0
        ctx.moveTo(x, height)
        ctx.lineTo(x, height - (major ? 9 : 4))
        if (major) {
          const az = ((i / 12) - 0.5) * 24
          ctx.fillText(az.toFixed(0), x + 4, height - 12)
        }
      }
      for (let i = 0; i <= 8; i += 1) {
        const y = (i / 8) * height
        const major = i % 2 === 0
        ctx.moveTo(0, y)
        ctx.lineTo(major ? 9 : 4, y)
        if (major) {
          const el = 42 + (0.5 - i / 8) * 16
          ctx.fillText(el.toFixed(0), 13, y + 4)
        }
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
    <div className="relative aspect-video w-full rounded-lg border border-viewport-edge">
      <canvas ref={canvasRef} className="block size-full rounded-lg" />

      <div className="pointer-events-none absolute inset-0 p-18 font-mono text-hud text-bone">
        <div className="flex items-start justify-between">
          <span className="opacity-70">NETRA · EO-TRACK</span>
          <span className="opacity-70">FRAME {String(frame).padStart(6, '0')}</span>
        </div>
        <div className="absolute right-18 bottom-18 left-18 flex items-end justify-between">
          <span className="opacity-70">{sceneLabel.toUpperCase()}</span>
          <span className="opacity-70">{modeLabel.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

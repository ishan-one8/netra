import { useEffect, useRef } from 'react'
import type { SimSnapshot } from '../../sim/useTracker'
import { alpha, token } from '../../lib/tokens'
import { cx } from '../../lib/cx'

type Props = {
  snapshotRef: React.RefObject<SimSnapshot>
  modeLabel: string
  sceneLabel: string
  frame: number
  className?: string
}

type Star = { x: number; y: number; r: number; a: number }

/**
 * The sensor frame — the one dark surface in a light product. Everything the
 * virtual camera sees, and every overlay the tracker draws on top of it.
 */
export function CameraViewport({
  snapshotRef,
  modeLabel,
  sceneLabel,
  frame,
  className,
}: Props) {
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
      const count = Math.round((width * height) / 4200)
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 0.9 + 0.2,
        a: Math.random() * 0.4 + 0.06,
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

      ctx.fillStyle = token('sensor')
      ctx.fillRect(0, 0, width, height)

      // --- Field of view grid, faint, so motion has a reference ------------
      ctx.strokeStyle = 'rgba(255,255,255,0.045)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < 6; i += 1) {
        ctx.moveTo((i / 6) * width, 0)
        ctx.lineTo((i / 6) * width, height)
      }
      for (let i = 1; i < 4; i += 1) {
        ctx.moveTo(0, (i / 4) * height)
        ctx.lineTo(width, (i / 4) * height)
      }
      ctx.stroke()

      // Horizon, at zero elevation. Usually off-frame; when it drifts in, it is
      // the clearest sign of where the camera is actually looking.
      const horizonY = (0.5 + snap.gimbal.tilt / 16) * height
      if (horizonY > -20 && horizonY < height + 20) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.beginPath()
        ctx.moveTo(0, horizonY)
        ctx.lineTo(width, horizonY)
        ctx.stroke()
      }

      // The sky does not move; the camera does. Shifting the field against the
      // gimbal is what makes a slew visible at all — with the target held at
      // boresight, nothing else on screen would tell you the camera is turning.
      const wrap = (v: number) => ((v % 1) + 1) % 1
      const skyX = -(snap.gimbal.pan / 24)
      const skyY = snap.gimbal.tilt / 16
      for (const s of stars) {
        ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 0.001 + s.x * 40))
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(wrap(s.x + skyX) * width, wrap(s.y + skyY) * height, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      for (const c of snap.candidates) {
        if (!c.decoy) continue
        const g = ctx.createRadialGradient(c.x * width, c.y * height, 0, c.x * width, c.y * height, 16)
        g.addColorStop(0, `rgba(255,255,255,${0.16 + c.score * 0.2})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(c.x * width, c.y * height, 16, 0, Math.PI * 2)
        ctx.fill()
      }

      const bx = snap.truth.x * width
      const by = snap.truth.y * height

      // The beacon itself.
      if (!snap.occluded && snap.truth.inFrame) {
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 30)
        glow.addColorStop(0, 'rgba(255,255,255,0.5)')
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(bx, by, 30, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(bx, by, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      const dx = snap.detection.x * width
      const dy = snap.detection.y * height
      const beam = token('beam')

      // --- Boresight: where the gimbal is actually pointed -----------------
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 1
      const bs = 14
      ctx.beginPath()
      ctx.moveTo(width / 2 - bs, height / 2)
      ctx.lineTo(width / 2 - 4, height / 2)
      ctx.moveTo(width / 2 + 4, height / 2)
      ctx.lineTo(width / 2 + bs, height / 2)
      ctx.moveTo(width / 2, height / 2 - bs)
      ctx.lineTo(width / 2, height / 2 - 4)
      ctx.moveTo(width / 2, height / 2 + 4)
      ctx.lineTo(width / 2, height / 2 + bs)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, 26, 0, Math.PI * 2)
      ctx.stroke()

      // --- Rejected candidates ---------------------------------------------
      // Every decoy the detector proposed and the associator threw away.
      for (const c of snap.candidates) {
        if (!c.decoy) continue
        const cx1 = c.x * width
        const cy1 = c.y * height
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath()
        ctx.arc(cx1, cy1, 9, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx1 - 4.5, cy1 - 4.5)
        ctx.lineTo(cx1 + 4.5, cy1 + 4.5)
        ctx.moveTo(cx1 + 4.5, cy1 - 4.5)
        ctx.lineTo(cx1 - 4.5, cy1 + 4.5)
        ctx.stroke()
      }

      // Track trail.
      ctx.strokeStyle = alpha('beam', 0.35)
      ctx.beginPath()
      snap.trail.forEach((p, i) => {
        const px = p.x * width
        const py = p.y * height
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()

      // Detection box with corner ticks.
      const box = snap.boxSize * Math.min(width, height)
      ctx.strokeStyle = snap.occluded ? 'rgba(255,255,255,0.2)' : alpha('beam', 0.6)
      ctx.strokeRect(dx - box / 2, dy - box / 2, box, box)

      const tick = Math.max(7, box * 0.18)
      ctx.strokeStyle = snap.occluded ? 'rgba(255,255,255,0.45)' : beam
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (const [cx0, cy0, sx, sy] of [
        [dx - box / 2, dy - box / 2, 1, 1],
        [dx + box / 2, dy - box / 2, -1, 1],
        [dx - box / 2, dy + box / 2, 1, -1],
        [dx + box / 2, dy + box / 2, -1, -1],
      ]) {
        ctx.moveTo(cx0, cy0 + sy * tick)
        ctx.lineTo(cx0, cy0)
        ctx.lineTo(cx0 + sx * tick, cy0)
      }
      ctx.stroke()
      ctx.lineWidth = 1

      // Reticle.
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
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

      // Predicted position, one step ahead of the platform.
      const gx = snap.prediction.x * width
      const gy = snap.prediction.y * height
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.strokeRect(gx - box / 2, gy - box / 2, box, box)
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      ctx.lineTo(gx, gy)
      ctx.stroke()
      ctx.setLineDash([])

      // Edge rulers.
      ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.42)'
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      for (let i = 0; i <= 12; i += 1) {
        const x = (i / 12) * width
        const major = i % 3 === 0
        ctx.moveTo(x, height)
        ctx.lineTo(x, height - (major ? 8 : 4))
        if (major && i > 0 && i < 12) {
          ctx.fillText((((i / 12) - 0.5) * 24).toFixed(0) + '°', x + 4, height - 11)
        }
      }
      for (let i = 0; i <= 8; i += 1) {
        const y = (i / 8) * height
        const major = i % 2 === 0
        ctx.moveTo(0, y)
        ctx.lineTo(major ? 8 : 4, y)
        if (major && i > 0 && i < 8) {
          ctx.fillText((42 + (0.5 - i / 8) * 16).toFixed(0) + '°', 12, y + 3.5)
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
    <div
      className={cx(
        'relative aspect-video w-full overflow-hidden rounded-md border border-rule-strong bg-sensor shadow-sm',
        className,
      )}
    >
      <canvas ref={canvasRef} className="block size-full" />

      <div className="pointer-events-none absolute inset-0 hidden flex-col justify-between p-16 sm:flex">
        <div className="flex items-start justify-between gap-16">
          <span className="font-mono text-hud uppercase tracking-label text-sensor-ink/60">
            Virtual camera · {sceneLabel}
          </span>
          <span className="font-mono text-hud uppercase tracking-label text-sensor-ink/60">
            Frame {String(frame).padStart(6, '0')}
          </span>
        </div>
        <div className="flex items-end justify-between gap-16">
          <span className="font-mono text-hud uppercase tracking-label text-sensor-ink/60">
            FOV 24° × 16° · 1280 px
          </span>
          <span className="font-mono text-hud uppercase tracking-label text-sensor-ink/60">
            {modeLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

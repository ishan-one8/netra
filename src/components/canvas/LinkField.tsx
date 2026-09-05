import { useEffect, useRef } from 'react'
import { alpha, token } from '../../lib/tokens'
import { cx } from '../../lib/cx'
import { useOnScreen } from '../../lib/useOnScreen'
import { prefersReducedMotion } from '../../lib/motion'

type Glyph = {
  x: number
  y: number
  size: number
  rotation: number
  spin: number
  phase: number
  speed: number
}

const MAX_GLYPHS = 40

/**
 * The brand visual, drawn as a technical sketch: two terminals drifting on
 * paper, joined by a beam that pulses, breaks under occlusion and re-locks.
 * Around them, outlined triangles standing in for candidates the system
 * considers and rejects. Procedural — there is no image asset in this product.
 */
export function LinkField({
  verticalCenter = 0.5,
  className,
}: {
  verticalCenter?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onScreen = useOnScreen(canvasRef)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let glyphs: Glyph[] = []
    let raf = 0

    const seed = () => {
      const count = Math.min(MAX_GLYPHS, Math.round((width * height) / 26000))
      glyphs = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 5 + Math.random() * 9,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.0005,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0005,
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

    const linkPhase = (t: number) => {
      const cycle = 11000
      const p = t % cycle
      if (p < 6800) return { phase: 'locked' as const, progress: p / 6800 }
      if (p < 8600) return { phase: 'occluded' as const, progress: (p - 6800) / 1800 }
      return { phase: 'reacquire' as const, progress: (p - 8600) / 2400 }
    }

    const draw = (t: number) => {
      if (!onScreen.current) return
      ctx.clearRect(0, 0, width, height)

      const ax = width * 0.22 + Math.sin(t * 0.00013) * width * 0.05
      const ay = height * (verticalCenter - 0.08) + Math.cos(t * 0.00017) * height * 0.09
      const bx = width * 0.8 + Math.cos(t * 0.00011) * width * 0.04
      const by = height * (verticalCenter + 0.12) + Math.sin(t * 0.00015) * height * 0.07

      const { phase, progress } = linkPhase(t)

      ctx.lineWidth = 1
      for (const g of glyphs) {
        g.rotation += g.spin * 16
        g.phase += g.speed * 16
        const breath = (Math.sin(g.phase) + 1) / 2
        ctx.save()
        ctx.translate(g.x, g.y)
        ctx.rotate(g.rotation)
        ctx.beginPath()
        ctx.moveTo(0, -g.size)
        ctx.lineTo(g.size * 0.88, g.size * 0.66)
        ctx.lineTo(-g.size * 0.88, g.size * 0.66)
        ctx.closePath()
        ctx.strokeStyle = alpha('ink', 0.10 + breath * 0.14)
        ctx.stroke()
        ctx.restore()
      }

      if (phase === 'occluded') {
        const cut = 0.18 + progress * 0.14
        ctx.strokeStyle = alpha('beam', 0.45)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.moveTo(bx, by)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()

        ctx.setLineDash([2, 7])
        ctx.strokeStyle = alpha('ink', 0.18)
        ctx.beginPath()
        ctx.moveTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (phase === 'reacquire') {
        const reach = Math.min(1, progress * 1.35)
        ctx.strokeStyle = alpha('beam', 0.3 + reach * 0.5)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * reach, ay + (by - ay) * reach)
        ctx.stroke()
      } else {
        const pulse = 0.6 + ((Math.sin(t * 0.0022) + 1) / 2) * 0.4
        ctx.strokeStyle = alpha('beam', pulse)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()

        const travel = (t % 2600) / 2600
        ctx.fillStyle = token('beam')
        ctx.beginPath()
        ctx.arc(ax + (bx - ax) * travel, ay + (by - ay) * travel, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const [x, y] of [
        [ax, ay],
        [bx, by],
      ]) {
        ctx.fillStyle = token('paper')
        ctx.fillRect(x - 6, y - 6, 12, 12)
        ctx.lineWidth = 1.25
        ctx.strokeStyle = alpha('ink', 0.7)
        ctx.strokeRect(x - 6, y - 6, 12, 12)
        ctx.lineWidth = 1
        ctx.fillStyle = phase === 'occluded' ? alpha('ink', 0.3) : token('ink')
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      }
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    resize()
    if (prefersReducedMotion) draw(0)
    else raf = requestAnimationFrame(loop)

    const observer = new ResizeObserver(() => {
      resize()
      if (prefersReducedMotion) draw(0)
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [verticalCenter, onScreen])

  return <canvas ref={canvasRef} aria-hidden className={cx('block size-full', className)} />
}

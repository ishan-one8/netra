import { useEffect, useRef } from 'react'
import { alpha, token } from '../../lib/tokens'
import { cx } from '../../lib/cx'

type Glyph = {
  x: number
  y: number
  size: number
  rotation: number
  spin: number
  tone: 'beam' | 'signal' | 'aqua'
  phase: number
  speed: number
}

type LinkPhase = 'locked' | 'occluded' | 'reacquire'

const GLYPH_DENSITY = 1 / 26000 // sparse by design — candidates, not confetti
const MAX_GLYPHS = 46

/**
 * The brand visual: two terminal nodes drifting in the void, joined by a thin
 * violet beam that pulses, breaks under occlusion and re-locks. Around them a
 * sparse field of 1px outlined triangles — detections the system considered
 * and rejected. Procedural; there is no image asset.
 */
export function LinkField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let glyphs: Glyph[] = []
    let raf = 0

    const tone = () => ({
      beam: token('beam'),
      signal: token('signal'),
      aqua: token('aqua'),
      bone: token('bone'),
      ash: token('ash'),
    })

    const seedGlyphs = () => {
      const count = Math.min(MAX_GLYPHS, Math.round(width * height * GLYPH_DENSITY))
      const tones: Glyph['tone'][] = ['beam', 'signal', 'aqua']
      glyphs = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4 + Math.random() * 7,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.0006,
        tone: tones[i % tones.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.00035 + Math.random() * 0.0006,
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
      seedGlyphs()
    }

    const triangle = (g: Glyph, opacity: number, colour: string) => {
      ctx.save()
      ctx.translate(g.x, g.y)
      ctx.rotate(g.rotation)
      ctx.beginPath()
      ctx.moveTo(0, -g.size)
      ctx.lineTo(g.size * 0.88, g.size * 0.66)
      ctx.lineTo(-g.size * 0.88, g.size * 0.66)
      ctx.closePath()
      ctx.lineWidth = 1
      ctx.globalAlpha = opacity
      ctx.strokeStyle = colour
      ctx.stroke()
      ctx.restore()
      ctx.globalAlpha = 1
    }

    /** The link runs a lock / occlusion / reacquire cycle on a fixed clock. */
    const linkPhase = (t: number): { phase: LinkPhase; progress: number } => {
      const cycle = 11000
      const p = t % cycle
      if (p < 6800) return { phase: 'locked', progress: p / 6800 }
      if (p < 8600) return { phase: 'occluded', progress: (p - 6800) / 1800 }
      return { phase: 'reacquire', progress: (p - 8600) / 2400 }
    }

    const draw = (t: number) => {
      const c = tone()
      ctx.clearRect(0, 0, width, height)

      // Terminal nodes drift on slow, unequal orbits so the link never repeats.
      const ax = width * 0.22 + Math.sin(t * 0.00013) * width * 0.05
      const ay = height * 0.38 + Math.cos(t * 0.00017) * height * 0.12
      const bx = width * 0.79 + Math.cos(t * 0.00011) * width * 0.04
      const by = height * 0.64 + Math.sin(t * 0.00015) * height * 0.1

      const { phase, progress } = linkPhase(t)

      for (const g of glyphs) {
        g.rotation += g.spin * 16
        g.phase += g.speed * 16
        const breath = (Math.sin(g.phase) + 1) / 2
        // Candidates surface, are weighed, and fall away.
        triangle(g, 0.06 + breath * 0.2, c[g.tone])
      }

      ctx.save()
      ctx.lineWidth = 1

      if (phase === 'occluded') {
        // The beam breaks: two stubs and a dashed gap where the link was.
        const cut = 0.18 + progress * 0.14
        ctx.strokeStyle = alpha('beam', 0.5)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.moveTo(bx, by)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()

        ctx.setLineDash([2, 8])
        ctx.strokeStyle = alpha('fault', 0.35)
        ctx.beginPath()
        ctx.moveTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (phase === 'reacquire') {
        // A search sweep closes from A toward B until the line completes.
        const reach = Math.min(1, progress * 1.35)
        ctx.strokeStyle = alpha('beam', 0.35 + reach * 0.5)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * reach, ay + (by - ay) * reach)
        ctx.stroke()
      } else {
        const pulse = 0.42 + ((Math.sin(t * 0.0022) + 1) / 2) * 0.4
        ctx.strokeStyle = alpha('beam', pulse)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()

        // A single photon packet travelling the locked link.
        const travel = (t % 2600) / 2600
        ctx.fillStyle = alpha('beam', 0.9)
        ctx.beginPath()
        ctx.arc(ax + (bx - ax) * travel, ay + (by - ay) * travel, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Terminals: an outlined square with a small filled core.
      for (const [x, y] of [
        [ax, ay],
        [bx, by],
      ]) {
        ctx.strokeStyle = alpha('bone', 0.5)
        ctx.strokeRect(x - 5, y - 5, 10, 10)
        ctx.fillStyle = phase === 'occluded' ? c.ash : c.bone
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      }

      ctx.restore()
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    resize()

    if (reduce) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (reduce) draw(0)
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cx('block h-full w-full', className)}
    />
  )
}

import { useEffect, useRef } from 'react'
import { alpha, token } from '../../lib/tokens'
import { cx } from '../../lib/cx'
import { prefersReducedMotion } from '../../lib/motion'
import type { TrackState } from '../../sim/types'

type Glyph = {
  x: number
  y: number
  size: number
  rotation: number
  spin: number
  tone: 'pure-white' | 'smoke' | 'graphite'
  phase: number
  speed: number
}

type Props = {
  /** Reports the link state so the page can label what the viewer is watching. */
  onState?: (state: TrackState) => void
  /** Nodes lean toward the pointer. */
  parallax?: boolean
  /** Where the link sits vertically, 0-1. The hero lifts it clear of the headline. */
  verticalCenter?: number
  className?: string
}

const MAX_GLYPHS = 64

/**
 * The brand visual: two terminal nodes drifting in the void, joined by a beam
 * that pulses, breaks under occlusion and re-locks. Around them a field of
 * outlined triangles — detections the system considered and rejected.
 * Procedural and animated; there is no image asset in this product.
 */
export function LinkField({
  onState,
  parallax = false,
  verticalCenter = 0.5,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<TrackState>('LOCKED')
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
    let glyphs: Glyph[] = []
    let raf = 0
    const pointer = { x: 0, y: 0, active: false }

    const seedGlyphs = () => {
      const count = Math.min(MAX_GLYPHS, Math.round((width * height) / 21000))
      const tones: Glyph['tone'][] = ['pure-white', 'smoke', 'graphite']
      glyphs = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4 + Math.random() * 8,
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

    const triangle = (g: Glyph, opacity: number) => {
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
      ctx.strokeStyle = token(g.tone)
      ctx.stroke()
      ctx.restore()
      ctx.globalAlpha = 1
    }

    const report = (next: TrackState) => {
      if (stateRef.current === next) return
      stateRef.current = next
      onStateRef.current?.(next)
    }

    /** A fixed lock / occlusion / reacquire clock. */
    const linkPhase = (t: number) => {
      const cycle = 11000
      const p = t % cycle
      if (p < 6800) return { phase: 'locked' as const, progress: p / 6800 }
      if (p < 8600) return { phase: 'occluded' as const, progress: (p - 6800) / 1800 }
      return { phase: 'reacquire' as const, progress: (p - 8600) / 2400 }
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      const lean = parallax && pointer.active ? 1 : 0
      const px = pointer.active ? (pointer.x / width - 0.5) * 26 * lean : 0
      const py = pointer.active ? (pointer.y / height - 0.5) * 26 * lean : 0

      const ax = width * 0.24 + Math.sin(t * 0.00013) * width * 0.05 + px
      const ay = height * (verticalCenter - 0.06) + Math.cos(t * 0.00017) * height * 0.08 + py
      const bx = width * 0.78 + Math.cos(t * 0.00011) * width * 0.04 - px
      const by = height * (verticalCenter + 0.14) + Math.sin(t * 0.00015) * height * 0.06 - py

      const { phase, progress } = linkPhase(t)
      report(phase === 'locked' ? 'LOCKED' : phase === 'occluded' ? 'TRACK_LOST' : 'SEARCHING')

      for (const g of glyphs) {
        g.rotation += g.spin * 16
        g.phase += g.speed * 16
        const breath = (Math.sin(g.phase) + 1) / 2
        triangle(g, 0.08 + breath * 0.22)
      }

      ctx.save()
      ctx.lineWidth = 1

      if (phase === 'occluded') {
        const cut = 0.18 + progress * 0.14
        ctx.strokeStyle = alpha('smoke', 0.5)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.moveTo(bx, by)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()

        ctx.setLineDash([2, 8])
        ctx.strokeStyle = token('graphite')
        ctx.beginPath()
        ctx.moveTo(ax + (bx - ax) * cut, ay + (by - ay) * cut)
        ctx.lineTo(bx - (bx - ax) * cut, by - (by - ay) * cut)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (phase === 'reacquire') {
        const reach = Math.min(1, progress * 1.35)
        ctx.strokeStyle = alpha('smoke', 0.4 + reach * 0.5)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + (bx - ax) * reach, ay + (by - ay) * reach)
        ctx.stroke()
      } else {
        // Lamplight: the held link is the one warm thing on the page.
        const pulse = 0.5 + ((Math.sin(t * 0.0022) + 1) / 2) * 0.4
        ctx.strokeStyle = alpha('lamp-cream', pulse)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()

        const travel = (t % 2600) / 2600
        ctx.fillStyle = token('lamp-cream')
        ctx.beginPath()
        ctx.arc(ax + (bx - ax) * travel, ay + (by - ay) * travel, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const [x, y] of [
        [ax, ay],
        [bx, by],
      ]) {
        ctx.strokeStyle = alpha('pure-white', 0.55)
        ctx.strokeRect(x - 5, y - 5, 10, 10)
        ctx.fillStyle = phase === 'occluded' ? token('smoke') : token('pure-white')
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      }

      ctx.restore()
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    resize()

    if (prefersReducedMotion) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
      if (parallax) {
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerleave', onPointerLeave)
      }
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (prefersReducedMotion) draw(0)
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [parallax, verticalCenter])

  return <canvas ref={canvasRef} aria-hidden className={cx('block size-full', className)} />
}

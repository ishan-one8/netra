import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

type Star = {
  x: number
  y: number
  r: number
  a: number
  /** Drift speed, in fractions of the viewport per second. */
  v: number
  twinkle: number
  phase: number
}

type Streak = { x: number; y: number; len: number; life: number; ttl: number; angle: number }

const LAYERS = [
  // far, mid, near — depth comes from size, brightness and speed together.
  { density: 1 / 5200, r: [0.35, 0.9], a: [0.16, 0.4], v: [0.0016, 0.0032] },
  { density: 1 / 14000, r: [0.7, 1.5], a: [0.3, 0.62], v: [0.004, 0.0072] },
  { density: 1 / 42000, r: [1.1, 2.1], a: [0.5, 0.85], v: [0.009, 0.015] },
] as const

/**
 * The galaxy the whole site sits in.
 *
 * One fixed canvas behind every page, three depth layers drifting at different
 * speeds so the field has parallax rather than sliding as a sheet. Occasionally
 * something crosses it. Everything is drawn in white and left to the sections
 * above to tint — the veils are translucent, so this shows through them.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let stars: Star[] = []
    let streak: Streak | null = null
    let nextStreak = 4000
    let raf = 0
    let last = performance.now()

    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

    const seed = () => {
      stars = []
      for (const layer of LAYERS) {
        const count = Math.round(width * height * layer.density)
        for (let i = 0; i < count; i += 1) {
          stars.push({
            x: Math.random(),
            y: Math.random(),
            r: rand(layer.r[0], layer.r[1]),
            a: rand(layer.a[0], layer.a[1]),
            v: rand(layer.v[0], layer.v[1]),
            twinkle: rand(0.5, 1.6),
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = Math.min(64, now - last)
      last = now
      const t = now

      ctx.clearRect(0, 0, width, height)

      for (const s of stars) {
        // A slow drift down and to the left, like a long exposure.
        s.x -= s.v * (dt / 1000) * 0.35
        s.y += s.v * (dt / 1000)
        if (s.y > 1.02) {
          s.y = -0.02
          s.x = Math.random()
        }
        if (s.x < -0.02) s.x = 1.02

        const flicker = 0.72 + 0.28 * Math.sin(t * 0.001 * s.twinkle + s.phase)
        ctx.globalAlpha = s.a * flicker
        ctx.fillStyle = '#ffffff'
        if (s.r < 0.8) {
          ctx.fillRect(s.x * width, s.y * height, s.r * 2, s.r * 2)
        } else {
          ctx.beginPath()
          ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // Something crosses the field now and then. Rare enough to be a surprise.
      nextStreak -= dt
      if (!streak && nextStreak <= 0) {
        streak = {
          x: rand(0.15, 0.95),
          y: rand(-0.05, 0.4),
          len: rand(90, 190),
          life: 0,
          ttl: rand(650, 1000),
          angle: rand(2.5, 2.9),
        }
        nextStreak = rand(9000, 22000)
      }
      if (streak) {
        streak.life += dt
        const p = streak.life / streak.ttl
        if (p >= 1) {
          streak = null
        } else {
          const fade = Math.sin(p * Math.PI)
          const x = streak.x * width + Math.cos(streak.angle) * p * width * 0.4
          const y = streak.y * height + Math.sin(streak.angle) * p * width * 0.4
          const g = ctx.createLinearGradient(
            x,
            y,
            x - Math.cos(streak.angle) * streak.len,
            y - Math.sin(streak.angle) * streak.len,
          )
          g.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = g
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(
            x - Math.cos(streak.angle) * streak.len,
            y - Math.sin(streak.angle) * streak.len,
          )
          ctx.stroke()
        }
      }
    }

    resize()
    if (prefersReducedMotion) {
      // Draw the field once and leave it still.
      draw(0)
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="starfield" />
}

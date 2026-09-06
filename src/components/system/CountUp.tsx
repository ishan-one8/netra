import { useLayoutEffect } from 'react'
import { useInView } from '../../lib/useInView'
import { prefersReducedMotion } from '../../lib/motion'

type Props = {
  to: number
  decimals?: number
  durationMs?: number
  className?: string
}

/**
 * A number that arrives rather than appearing.
 *
 * Counts once, when it first comes into view, and never again — a figure that
 * re-rolls every time you scroll past reads as decoration.
 *
 * The tween is written straight to the text node instead of held in state:
 * sixty React renders a second to move one number is work nobody asked for.
 * That also means the markup ships the real value, so it is right before any
 * of this runs, right for a screen reader, and right in a background tab where
 * requestAnimationFrame is parked and the count would otherwise sit at zero.
 */
export function CountUp({ to, decimals = 0, durationMs = 900, className }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.5 })

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (prefersReducedMotion || document.hidden) return

    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / durationMs)
      // Ease out, so it decelerates into the value rather than stopping dead.
      node.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(decimals)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    // Zeroed before the browser paints, so the final value never flashes first.
    node.textContent = (0).toFixed(decimals)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      node.textContent = to.toFixed(decimals)
    }
  }, [inView, to, decimals, durationMs, ref])

  return (
    <span ref={ref} className={className}>
      {to.toFixed(decimals)}
    </span>
  )
}

import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

/** How far down the page the reader is, as a hairline of beam across the top. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (prefersReducedMotion) return null

  return (
    <span
      aria-hidden
      className="scroll-progress"
      style={{ transform: `scaleX(${progress})`, opacity: progress > 0.005 ? 1 : 0 }}
    />
  )
}

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

type Options = {
  /** Stop observing after the first entry. */
  once?: boolean
  /** Fraction of the element that must be visible. */
  threshold?: number
  rootMargin?: string
}

/**
 * Reports whether an element is in the viewport. With reduced motion the answer
 * is always yes, so nothing stays hidden behind an animation that never runs.
 */
export function useInView<T extends HTMLElement>({
  once = true,
  threshold = 0.2,
  rootMargin = '0px 0px -10% 0px',
}: Options = {}) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [once, threshold, rootMargin])

  return { ref, inView }
}

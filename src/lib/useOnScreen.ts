import { useEffect, useRef, type RefObject } from 'react'

/**
 * Whether the given element is on screen, reported as a ref.
 *
 * Animation loops read this each frame to decide whether to do any work.
 * Returning state instead would re-render the component every time a canvas
 * scrolled past, which is the opposite of the point.
 */
export function useOnScreen(target: RefObject<Element | null>, margin = '250px') {
  const visible = useRef(true)

  useEffect(() => {
    const el = target.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting
      },
      { rootMargin: margin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, margin])

  return visible
}

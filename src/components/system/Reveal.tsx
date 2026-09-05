import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** Stagger, in milliseconds. */
  delay?: number
  className?: string
}

/**
 * Content rises into place once, on first sight. Opacity and 14px of travel —
 * no scale, no blur, nothing that reads as decoration.
 */
export function Reveal({ children, delay = 0, className }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cx('netra-reveal', inView && 'is-in', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

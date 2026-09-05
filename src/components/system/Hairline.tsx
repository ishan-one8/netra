import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Props = {
  orientation?: 'horizontal' | 'vertical'
  /** Draws itself from the left when the rule comes into view. */
  draw?: boolean
  className?: string
}

/** Graphite, never a white keyline. The only divider in the system. */
export function Hairline({ orientation = 'horizontal', draw = false, className }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0 })

  return (
    <span
      ref={draw ? ref : undefined}
      aria-hidden
      className={cx(
        'block bg-graphite',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        draw && 'netra-rule-draw',
        draw && inView && 'is-in',
        className,
      )}
    />
  )
}

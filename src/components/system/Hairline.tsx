import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Props = {
  orientation?: 'horizontal' | 'vertical'
  /** Draws itself from the left as the region comes into view. */
  draw?: boolean
  className?: string
}

export function Hairline({ orientation = 'horizontal', draw = false, className }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0 })

  return (
    <span
      ref={draw ? ref : undefined}
      aria-hidden
      className={cx(
        'block bg-rule',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        draw && 'rule-draw',
        draw && inView && 'is-in',
        className,
      )}
    />
  )
}

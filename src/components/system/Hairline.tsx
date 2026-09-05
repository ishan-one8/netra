import { cx } from '../../lib/cx'

type Props = {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

/** The only divider in the system. 1px, never heavier. */
export function Hairline({ orientation = 'horizontal', className }: Props) {
  return (
    <span
      aria-hidden
      className={cx(
        'block bg-hairline',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
    />
  )
}

import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** A hairline running to the right edge of the column. The primary structuring
   *  device in a system with no cards. */
  rule?: boolean
  size?: 'sm' | 'md'
  className?: string
  id?: string
}

/**
 * Uppercase amber marker that opens a region. Replaces the card border as the
 * way a group of content announces itself.
 */
export function EyebrowLabel({ children, rule = false, size = 'sm', className, id }: Props) {
  return (
    <div className={cx('flex items-center gap-12', className)} id={id}>
      <span
        className={cx(
          'text-signal font-semibold uppercase tracking-eyebrow whitespace-nowrap',
          size === 'sm' ? 'text-hud' : 'text-label',
        )}
      >
        {children}
      </span>
      {rule ? <span aria-hidden className="h-px flex-1 bg-hairline" /> : null}
    </div>
  )
}

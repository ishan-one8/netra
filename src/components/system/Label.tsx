import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** A graphite rule running to the right edge of the column. */
  rule?: boolean
  tone?: 'smoke' | 'white'
  className?: string
}

/**
 * Uppercase tracked metadata. In a system with no colour, this typographic
 * treatment does the work most interfaces hand to an accent hue.
 */
export function Label({ children, rule = false, tone = 'smoke', className }: Props) {
  return (
    <div className={cx('flex items-center gap-16', className)}>
      <span
        className={cx(
          'text-label-sm font-medium whitespace-nowrap uppercase',
          tone === 'smoke' ? 'text-smoke' : 'text-pure-white',
        )}
      >
        {children}
      </span>
      {rule ? <span aria-hidden className="h-px flex-1 bg-graphite" /> : null}
    </div>
  )
}

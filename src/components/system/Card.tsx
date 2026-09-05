import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** Charcoal lifts one quiet step above the void; void keeps the card flat. */
  surface?: 'charcoal' | 'void'
  className?: string
}

/**
 * A single tone shift implies elevation. Adding a shadow here would break the
 * flat cinematic feel, so there isn't one.
 */
export function Card({ children, surface = 'charcoal', className }: Props) {
  return (
    <div
      className={cx(
        'rounded-card',
        surface === 'charcoal' ? 'bg-charcoal' : 'bg-void-black',
        className,
      )}
    >
      {children}
    </div>
  )
}

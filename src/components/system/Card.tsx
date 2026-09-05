import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  elevation?: 'flat' | 'raised'
  /** Lifts on hover. Only for cards that lead somewhere or invite a pointer. */
  interactive?: boolean
  className?: string
}

export function Card({ children, elevation = 'flat', interactive = false, className }: Props) {
  return (
    <div
      className={cx(
        'rounded-lg border border-rule bg-surface',
        elevation === 'raised' ? 'shadow-md' : 'shadow-xs',
        interactive && 'card-interactive',
        className,
      )}
    >
      {children}
    </div>
  )
}

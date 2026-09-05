import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** Depth comes from the hairline; the shadow only separates it from paper. */
  elevation?: 'flat' | 'raised'
  className?: string
}

export function Card({ children, elevation = 'flat', className }: Props) {
  return (
    <div
      className={cx(
        'rounded-lg border border-rule bg-surface',
        elevation === 'raised' ? 'shadow-md' : 'shadow-xs',
        className,
      )}
    >
      {children}
    </div>
  )
}

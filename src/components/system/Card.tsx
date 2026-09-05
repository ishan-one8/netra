import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** `glass` floats over a section bloom; `solid` sits flat on the ground. */
  variant?: 'glass' | 'solid'
  elevation?: 'flat' | 'raised'
  /** Lifts, and catches the accent along its top edge, on hover. */
  interactive?: boolean
  className?: string
}

export function Card({
  children,
  variant = 'solid',
  elevation = 'flat',
  interactive = false,
  className,
}: Props) {
  return (
    <div
      className={cx(
        'rounded-lg',
        variant === 'glass'
          ? ['glass-card', interactive && 'glass-card-hover']
          : [
              'border border-rule bg-surface',
              elevation === 'raised' ? 'shadow-md' : 'shadow-xs',
              interactive && 'card-interactive',
            ],
        className,
      )}
    >
      {children}
    </div>
  )
}

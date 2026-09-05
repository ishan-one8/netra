import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** A small leading dot, for state rather than category. */
  dot?: 'cream' | 'white' | 'smoke' | 'hollow'
  className?: string
}

const DOT: Record<NonNullable<Props['dot']>, string> = {
  cream: 'bg-lamp-cream',
  white: 'bg-pure-white',
  smoke: 'bg-smoke',
  hollow: 'border border-smoke',
}

/**
 * Frosted chip. The inner white edge in `--shadow-xl` is what makes it read as
 * glass catching light rather than a flat translucent block.
 */
export function GlassBadge({ children, dot, className }: Props) {
  return (
    <span
      className={cx(
        'glass inline-flex items-center gap-8 rounded-full px-16 py-8',
        'text-label-sm font-medium uppercase text-pure-white',
        className,
      )}
    >
      {dot ? <span aria-hidden className={cx('size-[6px] rounded-full', DOT[dot])} /> : null}
      {children}
    </span>
  )
}

import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  label: string
  to?: string
  onClick?: () => void
  className?: string
}

/**
 * A floating glass control, never inside a card. Circular mark, tracked
 * uppercase label beside it.
 */
export function PlayButton({ label, to, onClick, className }: Props) {
  const inner = (
    <>
      <span className="glass flex size-[52px] items-center justify-center rounded-full border border-pure-white">
        <svg viewBox="0 0 10 12" width="10" height="12" aria-hidden focusable="false">
          <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
        </svg>
      </span>
      <span className="text-small font-regular uppercase tracking-small">{label}</span>
    </>
  )

  const classes = cx(
    'inline-flex min-h-[44px] items-center gap-16 text-pure-white transition-opacity',
    'duration-[250ms] ease-sequel hover:opacity-70',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {inner}
    </button>
  )
}

import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  to?: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const base =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg bg-beam px-[22px] py-[14px] ' +
  'text-label font-semibold uppercase tracking-label text-bone transition-opacity duration-200 ' +
  'hover:opacity-80 disabled:opacity-40'

/**
 * The one filled surface outside the viewport. One per view — two filled
 * buttons never sit near each other.
 */
export function PrimaryAction({ children, to, href, onClick, disabled, className }: Props) {
  if (to) {
    return (
      <Link to={to} className={cx(base, className)} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={cx(base, className)} rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={cx(base, className)} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

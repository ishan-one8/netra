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
  'inline-flex min-h-[44px] items-center justify-center rounded-full bg-lamp-cream px-24 ' +
  'text-body font-medium text-void-black shadow-lg transition-opacity duration-[250ms] ' +
  'ease-sequel hover:opacity-90 disabled:opacity-40'

/**
 * The only filled surface in the system. Warm cream against pure black — the
 * single accent, and the only place a drop shadow is allowed.
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

import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  to?: string
  href?: string
  active?: boolean
  className?: string
}

export function NavLink({ children, to, href, active = false, className }: Props) {
  const classes = cx(
    'inline-flex min-h-[44px] items-center text-small font-medium transition-colors duration-200 ease-out',
    active ? 'text-ink' : 'text-ink-muted hover:text-ink',
    className,
  )

  return to ? (
    <Link to={to} className={classes}>
      {children}
    </Link>
  ) : (
    <a href={href} className={classes}>
      {children}
    </a>
  )
}

import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  to?: string
  href?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

/** Plain navigation text. No underline, no border, no background. */
export function GhostLink({ children, to, href, active = false, onClick, className }: Props) {
  const classes = cx(
    'inline-flex min-h-[44px] items-center text-nav font-medium transition-colors duration-[250ms] ease-sequel',
    active ? 'text-pure-white' : 'text-smoke hover:text-pure-white',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

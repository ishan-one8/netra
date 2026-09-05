import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  /** Internal route. */
  to?: string
  /** External destination. */
  href?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

/**
 * No background, no border. Bone when active, ash when not. Every secondary
 * navigation item and inline action in the product.
 */
export function GhostLink({ children, to, href, active = false, onClick, className }: Props) {
  const classes = cx(
    'inline-flex min-h-[44px] items-center text-label font-regular tracking-label transition-colors duration-200',
    active ? 'text-bone' : 'text-ash hover:text-bone',
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

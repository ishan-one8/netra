import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  to?: string
  href?: string
  onClick?: () => void
  className?: string
}

const base =
  'inline-flex min-h-[44px] items-center justify-center rounded-full border border-pure-white ' +
  'px-20 text-body font-medium text-pure-white transition-colors duration-[250ms] ease-sequel ' +
  'hover:bg-pure-white hover:text-void-black'

/** Sits beside the cream button, or recedes into the dark canvas on its own. */
export function GhostButton({ children, to, href, onClick, className }: Props) {
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
    <button type="button" className={cx(base, className)} onClick={onClick}>
      {children}
    </button>
  )
}

import { Link } from 'react-router-dom'
import { cx } from '../../lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = {
  children: React.ReactNode
  variant?: Variant
  size?: 'md' | 'lg'
  to?: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const VARIANT: Record<Variant, string> = {
  // Ink, not accent. The beam colour stays reserved for things that are alive.
  primary:
    'bg-ink text-surface shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-surface text-ink border border-rule shadow-xs hover:border-rule-strong hover:shadow-sm',
  ghost: 'text-ink-muted hover:text-ink',
}

const SIZE = {
  md: 'min-h-[44px] px-20 text-small',
  lg: 'min-h-[52px] px-24 text-body',
} as const

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  disabled,
  className,
}: Props) {
  const classes = cx(
    'inline-flex items-center justify-center gap-8 rounded-full font-medium',
    'transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none',
    VARIANT[variant],
    SIZE[size],
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
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

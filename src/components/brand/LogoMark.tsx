import { cx } from '../../lib/cx'

type Props = {
  wordmark?: boolean
  className?: string
}

/** The angular fragment, drawn in ink with the beam catching one edge. */
export function LogoMark({ wordmark = true, className }: Props) {
  return (
    <span className={cx('inline-flex items-center gap-8', className)}>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        role="img"
        aria-label={wordmark ? undefined : 'NETRA'}
        aria-hidden={wordmark || undefined}
        focusable="false"
      >
        <path d="M13.6 1 L2 13.4 L9.6 13.4 L7.2 23 L22 9.4 L13 9.4 Z" className="fill-ink" />
        <path d="M13.6 1 L2 13.4 L9.6 13.4 Z" className="fill-beam" />
      </svg>
      {wordmark ? (
        <span className="text-body font-bold tracking-tight text-ink">NETRA</span>
      ) : null}
    </span>
  )
}

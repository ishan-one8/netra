import { useId } from 'react'
import { cx } from '../../lib/cx'

type Props = {
  /** The mark alone, or the mark plus the wordmark. */
  wordmark?: boolean
  className?: string
}

/**
 * A sharp angular fragment in a violet-to-aqua gradient beside the NETRA
 * wordmark in bone. The mark and the particle field are the only places a
 * gradient is permitted.
 */
export function LogoMark({ wordmark = true, className }: Props) {
  const id = useId()
  const gradient = `netra-mark-${id.replace(/:/g, '')}`

  return (
    <span className={cx('inline-flex items-center gap-12', className)}>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        role="img"
        aria-label={wordmark ? undefined : 'NETRA'}
        aria-hidden={wordmark || undefined}
        focusable="false"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--color-beam)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-aqua)' }} />
          </linearGradient>
        </defs>
        <path
          d="M13.6 1 L2 13.4 L9.6 13.4 L7.2 23 L22 9.4 L13 9.4 Z"
          fill={`url(#${gradient})`}
        />
      </svg>
      {wordmark ? (
        <span className="text-label font-semibold uppercase tracking-eyebrow text-bone">
          NETRA
        </span>
      ) : null}
    </span>
  )
}

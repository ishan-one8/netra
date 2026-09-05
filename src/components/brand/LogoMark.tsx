import { cx } from '../../lib/cx'

type Props = {
  wordmark?: boolean
  className?: string
}

/**
 * The angular fragment stays — it is the identity. The violet-to-aqua gradient
 * does not: the system carries no chromatic colour, so the mark is drawn in
 * pure white beside the wordmark.
 */
export function LogoMark({ wordmark = true, className }: Props) {
  return (
    <span className={cx('inline-flex items-center gap-12', className)}>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        role="img"
        aria-label={wordmark ? undefined : 'NETRA'}
        aria-hidden={wordmark || undefined}
        focusable="false"
      >
        <path
          d="M13.6 1 L2 13.4 L9.6 13.4 L7.2 23 L22 9.4 L13 9.4 Z"
          fill="currentColor"
          className="text-pure-white"
        />
      </svg>
      {wordmark ? (
        <span className="text-body font-medium uppercase tracking-label text-pure-white">
          Netra
        </span>
      ) : null}
    </span>
  )
}

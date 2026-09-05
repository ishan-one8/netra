import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  tone?: 'faint' | 'muted' | 'beam'
  className?: string
}

const TONE = {
  faint: 'text-ink-faint',
  muted: 'text-ink-muted',
  beam: 'text-beam',
} as const

/** Uppercase tracked metadata. Opens a region in place of a heavier device. */
export function Label({ children, tone = 'faint', className }: Props) {
  return (
    <span
      className={cx('text-label font-medium uppercase tracking-label', TONE[tone], className)}
    >
      {children}
    </span>
  )
}

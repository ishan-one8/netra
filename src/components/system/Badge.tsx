import { cx } from '../../lib/cx'

type Props = {
  children: React.ReactNode
  tone?: 'neutral' | 'beam'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: Props) {
  return (
    <span
      className={cx(
        'inline-flex w-fit self-start items-center gap-8 rounded-full px-12 py-4',
        'text-label font-medium uppercase tracking-label',
        tone === 'beam'
          ? 'bg-beam-wash text-beam'
          : 'border border-rule bg-surface text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

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
          // Its own ground, because on the hero this sits on the moon and a
          // translucent wash over a lit disc leaves nothing to read.
          ? 'border border-beam/30 bg-paper/70 text-beam backdrop-blur-sm'
          : 'border border-rule bg-surface text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

import { cx } from '../../lib/cx'

type Props = {
  index: string
  name: string
  detail: string
  lit: boolean
  className?: string
}

export function PipelineNode({ index, name, detail, lit, className }: Props) {
  return (
    <div className={cx('flex flex-col gap-12', className)}>
      <span
        className={cx(
          'inline-flex size-[32px] items-center justify-center rounded-full border',
          'font-mono text-hud font-medium shadow-xs transition-all duration-500 ease-out',
          lit
            ? 'border-beam bg-beam-wash text-beam scale-110'
            : 'border-rule bg-surface text-ink-faint',
        )}
      >
        {index}
      </span>
      <h3 className="text-title font-medium text-ink">{name}</h3>
      <p className="text-small text-ink-muted">{detail}</p>
    </div>
  )
}

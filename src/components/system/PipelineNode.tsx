import { cx } from '../../lib/cx'

type Props = {
  index: string
  name: string
  detail: string
  /** Illumination is a tone change, never a glow. */
  lit: boolean
  className?: string
}

export function PipelineNode({ index, name, detail, lit, className }: Props) {
  return (
    <div className={cx('flex flex-col gap-12', className)}>
      <span
        className={cx(
          'tabular text-label-sm font-medium uppercase transition-colors duration-[300ms] ease-sequel',
          lit ? 'text-lamp-cream' : 'text-graphite',
        )}
      >
        {index}
      </span>
      <h3
        className={cx(
          'text-card font-medium transition-colors duration-[300ms] ease-sequel',
          lit ? 'text-pure-white' : 'text-smoke',
        )}
      >
        {name}
      </h3>
      <p className="text-body text-smoke">{detail}</p>
    </div>
  )
}

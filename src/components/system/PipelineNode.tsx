import { cx } from '../../lib/cx'

type Props = {
  index: string
  name: string
  detail: string
  /** Illumination means ash text becomes bone. Never a glow. */
  lit: boolean
  className?: string
}

export function PipelineNode({ index, name, detail, lit, className }: Props) {
  return (
    <div className={cx('flex flex-col gap-12', className)}>
      <span
        className={cx(
          'font-mono text-hud tracking-eyebrow transition-colors duration-500',
          lit ? 'text-signal' : 'text-ash',
        )}
      >
        {index}
      </span>
      <h3
        className={cx(
          'text-heading-2xs font-regular transition-colors duration-500',
          lit ? 'text-bone' : 'text-ash',
        )}
      >
        {name}
      </h3>
      <p
        className={cx(
          'text-caption font-extralight transition-colors duration-500',
          lit ? 'text-silver' : 'text-ash',
        )}
      >
        {detail}
      </p>
    </div>
  )
}

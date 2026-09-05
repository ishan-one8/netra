import { useId } from 'react'
import { cx } from '../../lib/cx'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  decimals?: number
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

/**
 * Label left in Switzer ash, live value right in mono bone, a 1px slider
 * beneath. No box around the group — the eyebrow above does that work.
 */
export function ControlRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  decimals = 0,
  disabled = false,
  onChange,
  className,
}: Props) {
  const id = useId()
  const fill = ((value - min) / (max - min)) * 100

  return (
    <div className={cx('flex flex-col', className)}>
      <div className="flex items-baseline justify-between gap-12">
        <label htmlFor={id} className="text-label font-regular tracking-label text-ash">
          {label}
        </label>
        <span className="font-mono text-telemetry text-bone">
          {value.toFixed(decimals)}
          {unit ? <span className="text-ash">{unit}</span> : null}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="control-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
      />
    </div>
  )
}

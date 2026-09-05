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

/** Label left, live value right, a graphite track with a cream fill beneath. */
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
      <div className="flex items-baseline justify-between gap-16">
        <label htmlFor={id} className="text-body text-smoke">
          {label}
        </label>
        <span className="tabular text-body text-pure-white">
          {value.toFixed(decimals)}
          {unit ? <span className="text-smoke">{unit}</span> : null}
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

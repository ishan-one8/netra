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
  /** One line explaining what the parameter actually does. */
  hint?: string
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

export function ControlRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  decimals = 0,
  hint,
  disabled = false,
  onChange,
  className,
}: Props) {
  const id = useId()
  const fill = ((value - min) / (max - min)) * 100

  return (
    <div className={cx('flex flex-col', className)}>
      <div className="flex items-baseline justify-between gap-16">
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
        </label>
        <span className="font-mono text-telemetry text-ink">
          {value.toFixed(decimals)}
          {unit ? <span className="text-ink-faint">{unit}</span> : null}
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
      {hint ? <p className="-mt-4 text-caption text-ink-faint">{hint}</p> : null}
    </div>
  )
}

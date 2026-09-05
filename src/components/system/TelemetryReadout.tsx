import { useEffect, useRef, useState } from 'react'
import { Label } from './Label'
import { cx } from '../../lib/cx'
import { prefersReducedMotion } from '../../lib/motion'

type Props = {
  label: string
  value: number
  unit?: string
  decimals?: number
  size?: 'md' | 'lg'
  /** 0–1. Draws a 2px bar beneath the value. */
  meter?: number
  className?: string
}

const DURATION = 300

/** Counts to a new value so a readout never snaps. */
function useCountUp(value: number) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const start = useRef(0)
  const frame = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion) return

    from.current = shown
    start.current = performance.now()

    const step = (now: number) => {
      const t = Math.min(1, (now - start.current) / DURATION)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from.current + (value - from.current) * eased)
      if (t < 1) frame.current = requestAnimationFrame(step)
    }

    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
    // `shown` is the animation origin only; following it would restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return prefersReducedMotion ? value : shown
}

/**
 * Tracked uppercase label, hairline-weight number, quiet unit. Figures are
 * tabular so the value cannot shift width as it updates.
 */
export function TelemetryReadout({
  label,
  value,
  unit,
  decimals = 2,
  size = 'md',
  meter,
  className,
}: Props) {
  const shown = useCountUp(value)

  return (
    <div className={cx('flex flex-col gap-8', className)}>
      <Label>{label}</Label>
      <div className="flex items-baseline gap-8">
        <span
          className={cx(
            'tabular font-light text-pure-white',
            size === 'lg' ? 'text-heading' : 'text-subheading',
          )}
        >
          {shown.toFixed(decimals)}
        </span>
        {unit ? <span className="text-body text-smoke">{unit}</span> : null}
      </div>
      {meter === undefined ? null : (
        <span aria-hidden className="mt-4 block h-[2px] w-full rounded-full bg-graphite">
          <span
            className="block h-[2px] rounded-full bg-lamp-cream transition-[width] duration-[300ms] ease-sequel"
            style={{ width: `${Math.min(100, Math.max(0, meter * 100))}%` }}
          />
        </span>
      )}
    </div>
  )
}

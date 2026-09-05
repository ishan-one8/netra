import { useEffect, useRef, useState } from 'react'
import { EyebrowLabel } from './EyebrowLabel'
import { cx } from '../../lib/cx'
import { prefersReducedMotion } from '../../lib/motion'

type Props = {
  label: string
  value: number
  unit?: string
  decimals?: number
  size?: 'md' | 'xl'
  /** 0–1. Draws a 1px bar beneath, filling outward from centre. */
  error?: number
  errorTone?: 'beam' | 'signal' | 'fault' | 'lock'
  className?: string
}

const DURATION = 300

/** Counts to a new value over 300ms so a readout never snaps. */
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
    // `shown` is read as the animation origin only; following it would restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return prefersReducedMotion ? value : shown
}

const ERROR_TONE = {
  beam: 'bg-beam',
  signal: 'bg-signal',
  fault: 'bg-fault',
  lock: 'bg-lock',
} as const

/**
 * Amber eyebrow, mono value, ash unit. Optionally a 1px error bar filling
 * outward from centre.
 */
export function TelemetryReadout({
  label,
  value,
  unit,
  decimals = 2,
  size = 'md',
  error,
  errorTone = 'beam',
  className,
}: Props) {
  const shown = useCountUp(value)

  return (
    <div className={cx('flex flex-col gap-6', className)}>
      <EyebrowLabel>{label}</EyebrowLabel>
      <div className="flex items-baseline gap-6">
        <span
          className={cx(
            'font-mono text-bone',
            size === 'xl' ? 'text-readout-xl font-medium' : 'text-readout',
          )}
        >
          {shown.toFixed(decimals)}
        </span>
        {unit ? <span className="font-mono text-log text-ash">{unit}</span> : null}
      </div>
      {error === undefined ? null : (
        <span aria-hidden className="relative mt-6 block h-px w-full bg-hairline">
          <span
            className={cx(
              'absolute top-0 left-1/2 h-px -translate-x-1/2 transition-[width] duration-300',
              ERROR_TONE[errorTone],
            )}
            style={{ width: `${Math.min(100, Math.max(0, error * 100))}%` }}
          />
        </span>
      )}
    </div>
  )
}

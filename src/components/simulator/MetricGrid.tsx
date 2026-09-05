import type { Telemetry } from '../../sim/types'
import { MRAD_PER_PX } from '../../sim/camera'
import { Label } from '../system'
import { cx } from '../../lib/cx'

type Props = { telemetry: Telemetry; className?: string }

/**
 * The evidence layer. Six numbers that answer "is it actually working?" —
 * error, how long it took to lock, how much of the run stayed locked, and what
 * the loop costs to run.
 */
export function MetricGrid({ telemetry: t, className }: Props) {
  const metrics = [
    {
      label: 'Pointing error',
      value: t.errorMrad.toFixed(1),
      unit: 'mrad',
      note: `${t.errorPx.toFixed(1)} px · ${MRAD_PER_PX.toFixed(2)} mrad/px`,
    },
    {
      label: 'Peak error',
      value: t.peakErrorMrad.toFixed(1),
      unit: 'mrad',
      note: 'worst of the run',
    },
    {
      label: 'Lock retention',
      value: t.lockRetention.toFixed(0),
      unit: '%',
      note: 'session rolling',
    },
    {
      label: 'Acquisition',
      value: t.acquisitionS.toFixed(2),
      unit: 's',
      note: 'search to first lock',
    },
    {
      label: 'Re-acquisition',
      value: t.reacquisitionS.toFixed(2),
      unit: 's',
      note: 'after target loss',
    },
    {
      label: 'Frame budget',
      value: t.processingMs.toFixed(1),
      unit: 'ms',
      note: `${t.fps.toFixed(0)} fps · ${t.candidates} candidates`,
    },
  ]

  return (
    <div className={cx('grid grid-cols-2 gap-16 sm:grid-cols-3', className)}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col gap-4">
          <Label>{m.label}</Label>
          <span className="font-mono text-readout font-medium text-ink">
            {m.value}
            <span className="text-caption text-ink-faint"> {m.unit}</span>
          </span>
          <span className="font-mono text-hud text-ink-faint">{m.note}</span>
        </div>
      ))}
    </div>
  )
}

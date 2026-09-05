import { CameraViewport } from '../simulator/CameraViewport'
import { Label, StatusChip } from '../system'
import { useTracker } from '../../sim/useTracker'

/**
 * The hero image is the product, running. Same tracker the simulator uses —
 * no screenshot, no mockup.
 */
export function LivePanel() {
  const { state, telemetry, snapshotRef } = useTracker({
    pattern: 'orbital',
    speed: 1,
    turbulence: 30,
    vibration: 18,
    noise: 15,
    brightness: 88,
    decoys: true,
    dropouts: true,
    mode: 'kalman',
    running: true,
  })

  const readouts = [
    { label: 'Pan', value: telemetry.pan.toFixed(2), unit: '°' },
    { label: 'Tilt', value: telemetry.tilt.toFixed(2), unit: '°' },
    { label: 'Pointing error', value: telemetry.errorMrad.toFixed(1), unit: 'mrad' },
    { label: 'Lock retention', value: telemetry.lockRetention.toFixed(0), unit: '%' },
  ]

  return (
    <div className="glass overflow-hidden rounded-xl p-12 text-left sm:p-16">
      <div className="flex flex-wrap items-center justify-between gap-12 px-4 pb-12">
        <StatusChip state={state} />
        <span className="font-mono text-hud uppercase tracking-label text-ink-faint">
          LEO pass · Kalman · decoys and dropouts on
        </span>
      </div>

      <CameraViewport
        snapshotRef={snapshotRef}
        modeLabel="Kalman"
        sceneLabel="LEO pass"
        frame={telemetry.frame}
      />

      <div className="grid grid-cols-2 gap-12 px-4 pt-16 sm:grid-cols-4">
        {readouts.map((r) => (
          <div key={r.label} className="flex flex-col gap-4">
            <Label>{r.label}</Label>
            <span className="font-mono text-telemetry text-ink">
              {r.value}
              <span className="text-ink-faint"> {r.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

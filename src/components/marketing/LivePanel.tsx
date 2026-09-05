import { CameraViewport } from '../simulator/CameraViewport'
import { Card, Label, StatusChip } from '../system'
import { useTracker } from '../../sim/useTracker'

/**
 * The hero image is the product, running. Same tracker the simulator uses —
 * no screenshot, no mockup.
 */
export function LivePanel() {
  const { state, telemetry, snapshotRef } = useTracker({
    turbulence: 42,
    jitter: 28,
    gain: 64,
    sweep: 72,
    mode: 'kalman',
    scene: 'leo',
    running: true,
  })

  const readouts = [
    { label: 'Azimuth', value: telemetry.azimuth.toFixed(2), unit: '°' },
    { label: 'Elevation', value: telemetry.elevation.toFixed(2), unit: '°' },
    { label: 'Residual', value: telemetry.rmsError.toFixed(1), unit: 'µrad' },
    { label: 'Confidence', value: telemetry.confidence.toFixed(0), unit: '%' },
  ]

  return (
    <Card elevation="raised" className="overflow-hidden p-12 sm:p-16">
      <div className="flex flex-wrap items-center justify-between gap-12 px-4 pb-12">
        <StatusChip state={state} />
        <span className="font-mono text-hud uppercase tracking-label text-ink-faint">
          LEO pass · Kalman estimator · live
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
    </Card>
  )
}

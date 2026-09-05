import { useEffect, useState } from 'react'
import { CameraViewport } from '../components/simulator/CameraViewport'
import { EventLog } from '../components/simulator/EventLog'
import { ResidualChart } from '../components/simulator/ResidualChart'
import {
  Card,
  ControlRow,
  GhostButton,
  Hairline,
  Label,
  PrimaryAction,
  SegmentedControl,
  StatusChip,
  TelemetryReadout,
} from '../components/system'
import { useTracker } from '../sim/useTracker'
import type { Scene, TrackerMode } from '../sim/useTracker'

const SCENES = [
  { value: 'leo', label: 'LEO pass' },
  { value: 'geo', label: 'GEO hold' },
  { value: 'ground', label: 'Ground link' },
] as const satisfies ReadonlyArray<{ value: Scene; label: string }>

const MODES = [
  { value: 'centroid', label: 'Centroid' },
  { value: 'kalman', label: 'Kalman' },
  { value: 'correlation', label: 'Correlation' },
] as const satisfies ReadonlyArray<{ value: TrackerMode; label: string }>

export function Simulator() {
  const [scene, setScene] = useState<Scene>('leo')
  const [mode, setMode] = useState<TrackerMode>('kalman')
  const [turbulence, setTurbulence] = useState(38)
  const [jitter, setJitter] = useState(24)
  const [gain, setGain] = useState(62)
  const [sweep, setSweep] = useState(70)
  const [running, setRunning] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(false)

  const { state, telemetry, log, history, snapshotRef, reset } = useTracker({
    turbulence,
    jitter,
    gain,
    sweep,
    mode,
    scene,
    running,
  })

  // Space holds the loop, R restarts the run — the two things you reach for most.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return
      if (event.code === 'Space') {
        event.preventDefault()
        setRunning((r) => !r)
      }
      if (event.key.toLowerCase() === 'r') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset])

  const sceneLabel = SCENES.find((s) => s.value === scene)?.label ?? ''
  const modeLabel = MODES.find((m) => m.value === mode)?.label ?? ''

  const controls = (
    <div className="flex flex-col gap-32">
      <div className="flex flex-col gap-12">
        <Label>Scene</Label>
        <SegmentedControl label="Scene" options={SCENES} value={scene} onChange={setScene} />
      </div>

      <div className="flex flex-col gap-12">
        <Label>Estimator</Label>
        <SegmentedControl label="Estimator" options={MODES} value={mode} onChange={setMode} />
      </div>

      <Hairline />

      <div className="flex flex-col gap-8">
        <Label>Channel</Label>
        <ControlRow
          label="Turbulence"
          value={turbulence}
          min={0}
          max={100}
          unit="%"
          onChange={setTurbulence}
        />
        <ControlRow
          label="Platform jitter"
          value={jitter}
          min={0}
          max={100}
          unit="%"
          onChange={setJitter}
        />
      </div>

      <div className="flex flex-col gap-8">
        <Label>Detector</Label>
        <ControlRow label="Gain" value={gain} min={0} max={100} unit="%" onChange={setGain} />
        <ControlRow
          label="Sweep rate"
          value={sweep}
          min={0}
          max={100}
          unit="%"
          onChange={setSweep}
        />
      </div>

      <div className="flex flex-wrap items-center gap-12">
        <PrimaryAction onClick={() => setRunning((r) => !r)}>
          {running ? 'Hold the loop' : 'Run the loop'}
        </PrimaryAction>
        <GhostButton onClick={reset}>Reset</GhostButton>
      </div>

      <p className="text-label-sm font-medium uppercase text-smoke">Space holds · R resets</p>
    </div>
  )

  return (
    <main className="page pt-96 pb-96">
      <div className="sim-grid">
        {/* ---- Controls -------------------------------------------------- */}
        <aside className="sim-area-controls">
          <button
            type="button"
            aria-expanded={controlsOpen}
            onClick={() => setControlsOpen((open) => !open)}
            className="flex min-h-[44px] w-full items-center justify-between gap-16 lg:hidden"
          >
            <Label rule>Controls</Label>
            <span className="text-body text-smoke">{controlsOpen ? '—' : '+'}</span>
          </button>

          <Card className={controlsOpen ? 'mt-16 block p-24' : 'hidden p-24 lg:block'}>
            {controls}
          </Card>
        </aside>

        {/* ---- Viewport --------------------------------------------------- */}
        <section className="sim-area-main flex flex-col gap-16">
          <div className="flex flex-wrap items-center justify-between gap-16">
            <StatusChip state={state} />
            <span className="text-label-sm font-medium uppercase text-smoke">
              {sceneLabel} · {modeLabel} · {running ? 'Running' : 'Held'}
            </span>
          </div>

          <CameraViewport
            snapshotRef={snapshotRef}
            modeLabel={modeLabel}
            sceneLabel={sceneLabel}
            frame={telemetry.frame}
          />
        </section>

        {/* ---- Telemetry --------------------------------------------------- */}
        <section className="sim-area-telemetry">
          <Card className="flex flex-col gap-32 p-24">
            <TelemetryReadout
              label="Residual, RMS"
              value={telemetry.rmsError}
              unit="µrad"
              decimals={2}
              size="lg"
              meter={Math.min(1, telemetry.rmsError / 60)}
            />

            <Hairline />

            <div className="grid grid-cols-2 gap-24">
              <TelemetryReadout label="Azimuth" value={telemetry.azimuth} unit="°" />
              <TelemetryReadout label="Elevation" value={telemetry.elevation} unit="°" />
              <TelemetryReadout label="Range" value={telemetry.range} unit="km" decimals={1} />
              <TelemetryReadout
                label="Confidence"
                value={telemetry.confidence}
                unit="%"
                decimals={1}
              />
              <TelemetryReadout
                label="Loop latency"
                value={telemetry.latency}
                unit="ms"
                decimals={1}
              />
              <TelemetryReadout label="SNR" value={telemetry.snr} unit="dB" decimals={1} />
            </div>

            <div className="flex flex-col gap-16">
              <Label rule>Residual · confidence</Label>
              <ResidualChart data={history} />
            </div>
          </Card>
        </section>

        {/* ---- Log --------------------------------------------------------- */}
        <section className="sim-area-log">
          <Card className="flex flex-col gap-16 p-24">
            <Label rule>Event log</Label>
            <EventLog entries={log} />
          </Card>
        </section>
      </div>
    </main>
  )
}

import { useState } from 'react'
import { CameraViewport } from '../components/simulator/CameraViewport'
import { EventLog } from '../components/simulator/EventLog'
import { ResidualChart } from '../components/simulator/ResidualChart'
import {
  ControlRow,
  EyebrowLabel,
  GhostLink,
  PrimaryAction,
  SegmentedControl,
  StatusChip,
  SweepLine,
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

const RANGE_UNIT: Record<Scene, string> = { leo: 'km', geo: 'km', ground: 'km' }

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

  const sceneLabel = SCENES.find((s) => s.value === scene)?.label ?? ''
  const modeLabel = MODES.find((m) => m.value === mode)?.label ?? ''

  const controls = (
    <div className="flex flex-col gap-36">
      <div className="flex flex-col gap-18">
        <EyebrowLabel rule>Scene</EyebrowLabel>
        <SegmentedControl label="Scene" options={SCENES} value={scene} onChange={setScene} />
      </div>

      <div className="flex flex-col gap-18">
        <EyebrowLabel rule>Estimator</EyebrowLabel>
        <SegmentedControl label="Estimator" options={MODES} value={mode} onChange={setMode} />
      </div>

      <div className="flex flex-col gap-12">
        <EyebrowLabel rule>Channel</EyebrowLabel>
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

      <div className="flex flex-col gap-12">
        <EyebrowLabel rule>Detector</EyebrowLabel>
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

      <div className="flex flex-wrap items-center gap-24">
        <PrimaryAction onClick={() => setRunning((r) => !r)}>
          {running ? 'Hold loop' : 'Run loop'}
        </PrimaryAction>
        <GhostLink onClick={reset}>Reset run</GhostLink>
      </div>
    </div>
  )

  return (
    <main className="page py-36">
      <div className="sim-grid">
        {/* ---- Controls -------------------------------------------------- */}
        <aside className="sim-area-controls">
          <button
            type="button"
            aria-expanded={controlsOpen}
            onClick={() => setControlsOpen((open) => !open)}
            className="flex min-h-[44px] w-full items-center justify-between gap-12 lg:hidden"
          >
            <EyebrowLabel rule>Controls</EyebrowLabel>
            <span className="font-mono text-hud text-signal">{controlsOpen ? '—' : '+'}</span>
          </button>

          <div className={controlsOpen ? 'mt-24 block' : 'hidden lg:block'}>{controls}</div>
        </aside>

        <span aria-hidden className="sim-rule-a bg-hairline" />

        {/* ---- Viewport --------------------------------------------------- */}
        <section className="sim-area-main flex flex-col gap-18">
          <SweepLine state={state} />
          <div className="flex flex-wrap items-center justify-between gap-18">
            <StatusChip state={state} />
            <span className="font-mono text-hud text-ash">
              {sceneLabel.toUpperCase()} · {modeLabel.toUpperCase()} · {running ? 'RUN' : 'HOLD'}
            </span>
          </div>

          <CameraViewport
            snapshotRef={snapshotRef}
            modeLabel={modeLabel}
            sceneLabel={sceneLabel}
            frame={telemetry.frame}
          />
        </section>

        <span aria-hidden className="sim-rule-b bg-hairline" />

        {/* ---- Telemetry --------------------------------------------------- */}
        <section className="sim-area-telemetry flex flex-col gap-36">
          <TelemetryReadout
            label="Residual, RMS"
            value={telemetry.rmsError}
            unit="µrad"
            decimals={2}
            size="xl"
            error={Math.min(1, telemetry.rmsError / 60)}
            errorTone={state === 'TRACK_LOST' ? 'fault' : state === 'LOCKED' ? 'lock' : 'signal'}
          />

          <div className="grid grid-cols-2 gap-36">
            <TelemetryReadout label="Azimuth" value={telemetry.azimuth} unit="°" />
            <TelemetryReadout label="Elevation" value={telemetry.elevation} unit="°" />
            <TelemetryReadout
              label="Range"
              value={telemetry.range}
              unit={RANGE_UNIT[scene]}
              decimals={1}
            />
            <TelemetryReadout label="Confidence" value={telemetry.confidence} unit="%" decimals={1} />
            <TelemetryReadout label="Loop latency" value={telemetry.latency} unit="ms" decimals={1} />
            <TelemetryReadout label="SNR" value={telemetry.snr} unit="dB" decimals={1} />
          </div>

          <div className="flex flex-col gap-18">
            <EyebrowLabel rule>Residual · confidence</EyebrowLabel>
            <ResidualChart data={history} />
          </div>
        </section>

        {/* ---- Log --------------------------------------------------------- */}
        <section className="sim-area-log flex flex-col gap-18">
          <EyebrowLabel rule>Event log</EyebrowLabel>
          <EventLog entries={log} />
        </section>
      </div>
    </main>
  )
}

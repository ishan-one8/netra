import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraViewport } from '../components/simulator/CameraViewport'
import { EventLog } from '../components/simulator/EventLog'
import { MetricGrid } from '../components/simulator/MetricGrid'
import { DisturbancePanel } from '../components/simulator/DisturbancePanel'
import { StressTestPanel } from '../components/simulator/StressTestPanel'
import { RecoverySequence } from '../components/simulator/RecoverySequence'
import { ErrorChart, GimbalChart, LockChart, PredictionChart } from '../components/simulator/Charts'
import {
  Badge,
  Button,
  Card,
  ControlRow,
  Hairline,
  Label,
  SegmentedControl,
  StatusChip,
  SectionGlow,
} from '../components/system'
import { useTracker, type SimParams, type TrackerMode } from '../sim/useTracker'
import { useStressTest, type Sample } from '../sim/useStressTest'
import { MOTION_PATTERNS, type MotionPattern } from '../sim/motion'

const MODES = [
  { value: 'centroid', label: 'Centroid' },
  { value: 'kalman', label: 'Kalman' },
  { value: 'correlation', label: 'Correlation' },
] as const satisfies ReadonlyArray<{ value: TrackerMode; label: string }>

const PATTERNS = MOTION_PATTERNS.map(({ value, label }) => ({ value, label }))

const QUICK_INJECT = [
  { label: 'High noise', patch: { noise: 85, brightness: 55 } },
  { label: 'Strong vibration', patch: { vibration: 85 } },
  { label: 'Hazy atmosphere', patch: { turbulence: 85, brightness: 60 } },
  { label: 'Fast target', patch: { speed: 2.6 } },
] as const

export function Simulator() {
  const [base, setBase] = useState<Omit<SimParams, 'running'>>({
    pattern: 'orbital',
    speed: 1,
    turbulence: 25,
    vibration: 15,
    noise: 15,
    brightness: 88,
    decoys: false,
    dropouts: false,
    mode: 'kalman',
  })
  const [overrides, setOverrides] = useState<Partial<SimParams> | null>(null)
  const [running, setRunning] = useState(true)

  const params: SimParams = useMemo(
    () => ({ ...base, ...(overrides ?? {}), running }),
    [base, overrides, running],
  )

  const { state, telemetry, log, history, recovery, snapshotRef, reset } = useTracker(params)

  // The stress test reads the loop through a ref so its timer never sees a
  // stale render.
  const sampleRef = useRef<Sample>({ errorMrad: 0, state: 'SEARCHING' })
  useEffect(() => {
    sampleRef.current = { errorMrad: telemetry.errorMrad, state }
  })

  const applyOverrides = useCallback((next: Partial<SimParams> | null) => {
    setOverrides(next)
    if (next) setRunning(true)
  }, [])

  const stress = useStressTest({ apply: applyOverrides, sampleRef })

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

  const patch = (next: Partial<Omit<SimParams, 'running'>>) =>
    setBase((prev) => ({ ...prev, ...next }))

  const locked = stress.running
  const patternDetail = MOTION_PATTERNS.find((p) => p.value === params.pattern)?.detail ?? ''

  return (
    <main className="relative">
      <SectionGlow side="right" />
      <div className="page-wide relative flex flex-col gap-24 py-24 lg:py-32">
      {/* ---- Header ------------------------------------------------------- */}
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex flex-col gap-4">
          <Label tone="beam">Coarse alignment · virtual camera</Label>
          <h1 className="text-heading-sm font-medium tracking-tight text-ink">
            Mission <span className="text-gradient">console</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-12">
          <StatusChip state={state} />
          <Button onClick={() => setRunning((r) => !r)}>{running ? 'Hold' : 'Run'}</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </header>

      <Card variant="glass" className="flex flex-wrap items-center gap-12 px-16 py-12">
        <Badge tone="beam">Simulation</Badge>
        <p className="text-caption text-ink-muted">
          Every value on this page is produced by the simulation — a virtual camera, a virtual
          beacon and modelled disturbances. Nothing here is measured from real optical hardware.
        </p>
      </Card>

      <div className="grid gap-20 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        {/* ---- Controls --------------------------------------------------- */}
        <aside className="flex flex-col gap-16">
          <Card variant="glass" className="flex flex-col gap-20 p-20">
            <div className="flex flex-col gap-8">
              <Label>Target motion</Label>
              <SegmentedControl
                label="Target motion"
                options={PATTERNS}
                value={params.pattern}
                onChange={(v: MotionPattern) => patch({ pattern: v })}
              />
              <p className="text-caption text-ink-faint">{patternDetail}</p>
            </div>

            <div className="flex flex-col gap-8">
              <Label>Estimator</Label>
              <SegmentedControl
                label="Estimator"
                options={MODES}
                value={params.mode}
                onChange={(v: TrackerMode) => patch({ mode: v })}
              />
            </div>

            <Hairline />

            <div className="flex flex-col gap-12">
              <Label>Conditions</Label>
              <ControlRow
                label="Target speed"
                value={params.speed}
                min={0.25}
                max={3}
                step={0.05}
                decimals={2}
                unit="×"
                disabled={locked}
                onChange={(v) => patch({ speed: v })}
              />
              <ControlRow
                label="Turbulence"
                value={params.turbulence}
                min={0}
                max={100}
                unit="%"
                hint="Scintillation and beam wander"
                disabled={locked}
                onChange={(v) => patch({ turbulence: v })}
              />
              <ControlRow
                label="Platform vibration"
                value={params.vibration}
                min={0}
                max={100}
                unit="%"
                hint="Shake of the camera mount"
                disabled={locked}
                onChange={(v) => patch({ vibration: v })}
              />
              <ControlRow
                label="Sensor noise"
                value={params.noise}
                min={0}
                max={100}
                unit="%"
                disabled={locked}
                onChange={(v) => patch({ noise: v })}
              />
              <ControlRow
                label="Beacon brightness"
                value={params.brightness}
                min={10}
                max={100}
                unit="%"
                disabled={locked}
                onChange={(v) => patch({ brightness: v })}
              />
            </div>

            <Hairline />

            <DisturbancePanel
              toggles={[
                {
                  key: 'decoys',
                  label: 'Decoy light sources',
                  detail: 'Competing bright objects the associator must reject',
                  active: params.decoys,
                  onToggle: () => patch({ decoys: !base.decoys }),
                },
                {
                  key: 'dropouts',
                  label: 'Beacon dropout',
                  detail: 'The return vanishes and has to be re-acquired',
                  active: params.dropouts,
                  onToggle: () => patch({ dropouts: !base.dropouts }),
                },
              ]}
            />

            <div className="flex flex-col gap-8">
              <Label>Quick inject</Label>
              <div className="flex flex-wrap gap-8">
                {QUICK_INJECT.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    disabled={locked}
                    onClick={() => patch(q.patch)}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-rule bg-surface px-12 text-caption text-ink-muted transition-colors duration-200 hover:border-rule-strong hover:text-ink disabled:opacity-40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="font-mono text-hud uppercase tracking-label text-ink-faint">
              Space holds · R resets
            </p>
          </Card>
        </aside>

        {/* ---- Viewport and metrics --------------------------------------- */}
        <section className="flex flex-col gap-20">
          <Card variant="glass" className="p-12 sm:p-16">
            <div className="flex flex-wrap items-center justify-between gap-12 px-4 pb-12">
              <span className="font-mono text-hud uppercase tracking-label text-ink-faint">
                Pan {telemetry.pan.toFixed(2)}° · Tilt {telemetry.tilt.toFixed(2)}°
              </span>
              <span className="font-mono text-hud uppercase tracking-label text-ink-faint">
                {stress.running ? 'Stress test' : running ? 'Running' : 'Held'}
              </span>
            </div>
            <CameraViewport
              snapshotRef={snapshotRef}
              modeLabel={MODES.find((m) => m.value === params.mode)?.label ?? ''}
              sceneLabel={PATTERNS.find((p) => p.value === params.pattern)?.label ?? ''}
              frame={telemetry.frame}
            />
          </Card>

          <Card variant="glass" className="p-20">
            <MetricGrid telemetry={telemetry} />
          </Card>

          <Card variant="glass" className="p-20">
            <RecoverySequence recovery={recovery} />
          </Card>
        </section>

        {/* ---- Log --------------------------------------------------------- */}
        <section>
          <Card variant="glass" className="flex flex-col gap-16 p-20">
            <Label>Event log</Label>
            <EventLog entries={log} />
          </Card>
        </section>
      </div>

      {/* ---- Performance --------------------------------------------------- */}
      <Card variant="glass" className="flex flex-col gap-24 p-20 sm:p-24">
        <div className="flex flex-wrap items-end justify-between gap-12">
          <div className="flex flex-col gap-4">
            <Label tone="beam">Performance</Label>
            <p className="text-small text-ink-muted">
              Computed live from the running loop. The charts scroll with the simulation.
            </p>
          </div>
        </div>
        <div className="grid gap-24 lg:grid-cols-2">
          <ErrorChart data={history} />
          <PredictionChart data={history} />
          <GimbalChart data={history} />
          <LockChart data={history} />
        </div>
      </Card>

      {/* ---- Stress test ---------------------------------------------------- */}
      <Card variant="glass" className="p-20 sm:p-24">
        <StressTestPanel
          running={stress.running}
          phaseIndex={stress.phaseIndex}
          progress={stress.progress}
          report={stress.report}
          totalSeconds={stress.totalSeconds}
          onStart={stress.start}
          onCancel={stress.cancel}
        />
      </Card>
      </div>
    </main>
  )
}

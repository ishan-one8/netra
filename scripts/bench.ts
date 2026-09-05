/**
 * Headless run of the tracking loop.
 *
 * The console's whole claim is that its numbers mean something, so those
 * numbers have to be checkable without a browser. This drives the same engine
 * the UI drives, at a fixed timestep, and prints what it actually achieves.
 */
import { createEngine, seedDecoys, stepEngine, type SimParams } from '../src/sim/engine'
import { LOCK_DEG } from '../src/sim/camera'
import { degToMrad } from '../src/sim/camera'

const DT = 1000 / 60
const SETTLE_MS = 1500

type Scenario = { name: string; seconds: number; params: Partial<SimParams> }

const BASE: SimParams = {
  pattern: 'orbital',
  speed: 1,
  turbulence: 20,
  vibration: 12,
  noise: 12,
  brightness: 90,
  decoys: false,
  dropouts: false,
  mode: 'kalman',
  running: true,
}

const SCENARIOS: Scenario[] = [
  { name: 'Nominal', seconds: 12, params: {} },
  { name: 'Fast target', seconds: 12, params: { speed: 2.6 } },
  { name: 'Vibration', seconds: 12, params: { vibration: 80, noise: 15 } },
  { name: 'Sensor noise', seconds: 12, params: { noise: 82, brightness: 60 } },
  { name: 'Turbulence', seconds: 12, params: { turbulence: 85, brightness: 80 } },
  { name: 'Dropout', seconds: 14, params: { dropouts: true } },
  { name: 'Decoys', seconds: 12, params: { decoys: true, brightness: 55, speed: 1.2 } },
  { name: 'Combined', seconds: 14, params: { speed: 2, turbulence: 75, vibration: 70, noise: 70, brightness: 55, decoys: true, dropouts: true } },
  { name: 'Centroid + decoys', seconds: 12, params: { mode: 'centroid', decoys: true, brightness: 55 } },
  { name: 'Lissajous', seconds: 12, params: { pattern: 'lissajous' } },
  { name: 'Random wander', seconds: 12, params: { pattern: 'wander' } },
]

/** Deterministic PRNG so a run is reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const LOCK_MRAD = degToMrad(LOCK_DEG)
let anyFail = false

console.log(`\nlock window: ${LOCK_MRAD.toFixed(1)} mrad (${LOCK_DEG}°)\n`)
console.log(
  'scenario'.padEnd(20) +
    'mean'.padStart(9) +
    'peak'.padStart(9) +
    'mean|lkd'.padStart(10) +
    'peak|lkd'.padStart(10) +
    'lock%'.padStart(8) +
    '  acq',
)
console.log('-'.repeat(78))

for (const s of SCENARIOS) {
  const rand = mulberry32(42)
  const engine = createEngine()
  const params = { ...BASE, ...s.params }
  seedDecoys(engine, params.decoys, rand)

  const errors: number[] = []
  const lockedErrors: number[] = []
  let locked = 0
  let samples = 0
  let acq = 0

  const steps = Math.round((s.seconds * 1000) / DT)
  for (let i = 0; i < steps; i++) {
    const r = stepEngine(engine, params, DT, rand)
    if (engine.elapsed > SETTLE_MS) {
      errors.push(r.telemetry.errorMrad)
      if (r.state === 'LOCKED') {
        locked += 1
        lockedErrors.push(r.telemetry.errorMrad)
      }
      samples += 1
    }
    acq = r.telemetry.acquisitionS
  }

  errors.sort((a, b) => a - b)
  const mean = errors.reduce((x, y) => x + y, 0) / Math.max(1, errors.length)
  lockedErrors.sort((a, b) => a - b)
  const lMean = lockedErrors.reduce((x, y) => x + y, 0) / Math.max(1, lockedErrors.length)
  const lPeak = lockedErrors[lockedErrors.length - 1] ?? 0
  const peak = errors[errors.length - 1] ?? 0
  const retention = samples ? (locked / samples) * 100 : 0

  // Nominal-class scenarios are expected to hold lock most of the time.
  // One rule for every scenario: hold the target most of the time, and point
  // accurately whenever you claim to be locked.
  const ok = retention >= 60 && lMean <= 14
  if (!ok) anyFail = true

  console.log(
    s.name.padEnd(20) +
      `${mean.toFixed(1)}`.padStart(9) +
      `${peak.toFixed(1)}`.padStart(9) +
      `${lMean.toFixed(1)}`.padStart(10) +
      `${lPeak.toFixed(1)}`.padStart(10) +
      `${retention.toFixed(0)}%`.padStart(8) +
      `  ${acq.toFixed(2)}s` +
      (ok ? '' : '   <-- WEAK'),
  )
}

console.log('\nunits: mrad · |lkd columns are measured only while the loop reports lock\n')
process.exit(anyFail ? 1 : 0)

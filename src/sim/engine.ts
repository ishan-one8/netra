/**
 * The tracking loop, as a plain function.
 *
 * Nothing here touches React. One call advances the world, the detector, the
 * estimator and the gimbal by `dtMs` and returns what the console should show.
 * Keeping it pure is what makes the loop measurable outside a browser — the
 * numbers this project claims are only worth something if they can be checked.
 */
import type { LogSeverity, Recovery, Telemetry, TrackState } from './types'
import {
  ACQUIRE_DEG,
  DEG_PER_PX,
  LOCK_DEG,
  angularError,
  degToMrad,
  project,
  slew,
} from './camera'
import { bearingAt, initialMotionState, type MotionPattern, type MotionState } from './motion'

export type TrackerMode = 'centroid' | 'kalman' | 'correlation'

export type SimParams = {
  pattern: MotionPattern
  speed: number
  turbulence: number
  vibration: number
  noise: number
  brightness: number
  decoys: boolean
  dropouts: boolean
  mode: TrackerMode
  running: boolean
}

export type Candidate = { x: number; y: number; score: number; decoy: boolean }

export type SimSnapshot = {
  truth: { x: number; y: number; inFrame: boolean }
  detection: { x: number; y: number }
  prediction: { x: number; y: number }
  candidates: Candidate[]
  trail: Array<{ x: number; y: number }>
  boxSize: number
  state: TrackState
  confidence: number
  occluded: boolean
  searching: boolean
}

export type StepEvent = { severity: LogSeverity; message: string }

export type StepResult = {
  telemetry: Telemetry
  state: TrackState
  stateChanged: boolean
  recovery: Recovery
  events: StepEvent[]
}

const TRAIL_LENGTH = 56

const MODE_QUALITY: Record<
  TrackerMode,
  { smoothing: number; lead: number; cost: number; reject: number }
> = {
  // `reject` is how much the associator trusts agreement with the track over
  // raw brightness — in other words, how hard it is to fool with a decoy.
  centroid: { smoothing: 0.3, lead: 0.25, cost: 3.1, reject: 0.45 },
  kalman: { smoothing: 0.1, lead: 1.5, cost: 6.4, reject: 0.82 },
  correlation: { smoothing: 0.17, lead: 0.8, cost: 11.2, reject: 0.93 },
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export type Engine = {
  elapsed: number
  frames: number
  state: TrackState
  snapshot: SimSnapshot
  motion: MotionState
  gimbal: { pan: number; tilt: number }
  estimate: { az: number; el: number; vAz: number; vEl: number; valid: boolean }
  decoys: Array<{ az: number; el: number; drift: number; bright: number }>
  occlusion: { active: boolean; until: number; next: number }
  initiation: { count: number; x: number; y: number }
  lockTimer: number
  lostTimer: number
  searchPhase: number
  recovery: Recovery & { lostAt: number }
  metrics: {
    lockedMs: number
    runMs: number
    peakMrad: number
    acquisitionS: number
    reacquisitionS: number
    lostAt: number
    fpsEma: number
  }
  decoysEnabled: boolean
}

export function createEngine(): Engine {
  return {
    elapsed: 0,
    frames: 0,
    state: 'SEARCHING',
    snapshot: {
      truth: { x: 0.5, y: 0.5, inFrame: true },
      detection: { x: 0.5, y: 0.5 },
      prediction: { x: 0.5, y: 0.5 },
      candidates: [],
      trail: [],
      boxSize: 0.1,
      state: 'SEARCHING',
      confidence: 0,
      occluded: false,
      searching: true,
    },
    motion: initialMotionState(),
    gimbal: { pan: 0, tilt: 42 },
    estimate: { az: 0, el: 42, vAz: 0, vEl: 0, valid: false },
    decoys: [],
    occlusion: { active: false, until: 0, next: 9000 },
    initiation: { count: 0, x: 0, y: 0 },
    lockTimer: 0,
    lostTimer: 0,
    searchPhase: 0,
    recovery: { stage: 0, timings: [null, null, null, null, null], cycles: 0, lostAt: 0 },
    metrics: {
      lockedMs: 0,
      runMs: 0,
      peakMrad: 0,
      acquisitionS: 0,
      reacquisitionS: 0,
      lostAt: 0,
      fpsEma: 60,
    },
    decoysEnabled: false,
  }
}

export function seedDecoys(e: Engine, enabled: boolean, rand: () => number = Math.random) {
  e.decoysEnabled = enabled
  e.decoys = enabled
    ? Array.from({ length: 4 }, () => ({
        az: (rand() - 0.5) * 18,
        el: 42 + (rand() - 0.5) * 12,
        drift: (rand() - 0.5) * 0.00016,
        bright: 0.3 + rand() * 0.4,
      }))
    : []
}

/** Advance one frame. Returns what changed; the caller decides what to publish. */
export function stepEngine(
  e: Engine,
  p: SimParams,
  dtMs: number,
  rand: () => number = Math.random,
): StepResult {
  const events: StepEvent[] = []
  const dt = Math.min(64, dtMs)
  const dtS = dt / 1000

  e.elapsed += dt
  e.frames += 1
  const t = e.elapsed
  const m = e.metrics
  m.runMs += dt
  m.fpsEma = m.fpsEma * 0.9 + (1000 / Math.max(1, dt)) * 0.1

  const turbulence = p.turbulence / 100
  const vibration = p.vibration / 100
  const noiseLevel = p.noise / 100
  const brightness = p.brightness / 100
  const quality = MODE_QUALITY[p.mode]
  const snap = e.snapshot

  if (p.decoys !== e.decoysEnabled) seedDecoys(e, p.decoys, rand)

  // --- Where the terminal actually is ------------------------------------
  const bearing = bearingAt(p.pattern, t, p.speed, e.motion, dt)
  const trueAz = bearing.az + Math.sin(t * 0.011) * turbulence * 0.35
  const trueEl = bearing.el + Math.cos(t * 0.013) * turbulence * 0.25

  // --- Occlusion ----------------------------------------------------------
  const occ = e.occlusion
  if (p.dropouts) {
    if (!occ.active && t > occ.next) {
      occ.active = true
      occ.until = t + 1200 + rand() * 1400
      events.push({ severity: 'fault', message: 'Beacon occluded · return lost' })
    }
    if (occ.active && t > occ.until) {
      occ.active = false
      occ.next = t + 8000 + rand() * 8000
      events.push({ severity: 'signal', message: 'Occlusion cleared' })
    }
  } else if (occ.active) {
    occ.active = false
    occ.next = t + 9000
  }
  snap.occluded = occ.active

  // --- Camera shake -------------------------------------------------------
  const pan = e.gimbal.pan + Math.sin(t * 0.047) * vibration * 0.5 + Math.sin(t * 0.113) * vibration * 0.22
  const tilt = e.gimbal.tilt + Math.cos(t * 0.053) * vibration * 0.34

  // --- Detector -----------------------------------------------------------
  const snr = clamp((1.2 + brightness * 9) / (0.3 + turbulence * 2.2 + noiseLevel * 2.6), 0.2, 40)
  const jitterDeg = (0.02 + turbulence * 0.22 + noiseLevel * 0.3) / (0.5 + brightness * 1.4)

  const truthProjection = project(trueAz, trueEl, pan, tilt)
  snap.truth = truthProjection

  const candidates: Candidate[] = []
  const beaconVisible = truthProjection.inFrame && !occ.active && snr > 1.1
  if (beaconVisible) {
    const proj = project(
      trueAz + (rand() - 0.5) * jitterDeg * 2,
      trueEl + (rand() - 0.5) * jitterDeg * 2,
      pan,
      tilt,
    )
    candidates.push({ x: proj.x, y: proj.y, score: brightness * clamp(snr / 8, 0, 1.2), decoy: false })
  }
  for (const d of e.decoys) {
    d.az += Math.sin(t * 0.0002) * d.drift
    const proj = project(d.az, d.el, pan, tilt)
    if (proj.inFrame) {
      candidates.push({ x: proj.x, y: proj.y, score: d.bright * clamp(snr / 10, 0, 1), decoy: true })
    }
  }
  snap.candidates = candidates

  // --- Association --------------------------------------------------------
  const predAz = e.estimate.az + e.estimate.vAz * quality.lead * 0.4
  const predEl = e.estimate.el + e.estimate.vEl * quality.lead * 0.4
  const predProj = project(predAz, predEl, pan, tilt)

  let best: Candidate | null = null
  let bestScore = -Infinity
  let bestAgreement = 0
  for (const c of candidates) {
    // How closely this candidate sits on the prediction, 0-1.
    const agreement = e.estimate.valid
      ? 1 - clamp(Math.hypot(c.x - predProj.x, c.y - predProj.y) / 0.35, 0, 1)
      : 0
    // With a track running, agreement with the prediction carries most of the
    // score — that is what stops a bright decoy from stealing it. With no
    // track yet there is nothing to agree with, so brightness is all there is.
    const score = e.estimate.valid
      ? c.score * (1 - quality.reject) + agreement * quality.reject
      : c.score
    if (score > bestScore) {
      bestScore = score
      best = c
      bestAgreement = agreement
    }
  }

  let detected: boolean
  if (e.estimate.valid) {
    detected = Boolean(best) && bestScore > 0.2
  } else if (best && bestScore > 0.06) {
    // A track is not opened on one bright frame. What qualifies a candidate is
    // that it is still there, in the same place, several frames later — which
    // is also what a dim beacon under turbulence can actually demonstrate.
    const near = Math.hypot(best.x - e.initiation.x, best.y - e.initiation.y) < 0.1
    e.initiation = { count: near ? e.initiation.count + 1 : 1, x: best.x, y: best.y }
    detected = e.initiation.count >= 4
  } else {
    e.initiation = { count: 0, x: 0, y: 0 }
    detected = false
  }

  if (detected && best) {
    const measAz = pan + (best.x - 0.5) * 24
    const measEl = tilt - (best.y - 0.5) * 16
    const initialising = !e.estimate.valid
    const alpha = initialising ? 1 : 1 - Math.pow(1 - quality.smoothing, dt / 16)
    const prevAz = e.estimate.az
    const prevEl = e.estimate.el
    const nextAz = prevAz + (measAz - prevAz) * alpha
    const nextEl = prevEl + (measEl - prevEl) * alpha

    if (initialising) {
      // One measurement carries no velocity. Differentiating across the
      // initialisation snap invents a rate the target never had, and the
      // gimbal then chases it out of frame.
      e.estimate.vAz = 0
      e.estimate.vEl = 0
    } else {
      const rateAz = (nextAz - prevAz) / Math.max(dtS, 0.001)
      const rateEl = (nextEl - prevEl) / Math.max(dtS, 0.001)
      // Platform rates are bounded; anything beyond this is measurement noise.
      e.estimate.vAz = clamp(e.estimate.vAz * 0.85 + rateAz * 0.15, -15, 15)
      e.estimate.vEl = clamp(e.estimate.vEl * 0.85 + rateEl * 0.15, -15, 15)
    }

    e.estimate.az = nextAz
    e.estimate.el = nextEl
    e.estimate.valid = true
    e.initiation = { count: 0, x: 0, y: 0 }
    e.lostTimer = 0
  } else {
    e.lostTimer += dt
    if (e.lostTimer < 900 && e.estimate.valid) {
      e.estimate.az += e.estimate.vAz * dtS
      e.estimate.el += e.estimate.vEl * dtS
    } else {
      e.estimate.valid = false
    }
  }

  // --- Gimbal -------------------------------------------------------------
  let goalAz: number
  let goalEl: number
  if (e.estimate.valid) {
    goalAz = e.estimate.az + e.estimate.vAz * quality.lead * 0.12
    goalEl = e.estimate.el + e.estimate.vEl * quality.lead * 0.12
    snap.searching = false
    e.searchPhase = 0
  } else {
    e.searchPhase += dtS * 1.5
    const radius = Math.min(9, e.searchPhase * 1.6)
    goalAz = Math.cos(e.searchPhase * 2.1) * radius
    goalEl = 42 + Math.sin(e.searchPhase * 2.1) * radius * 0.55
    snap.searching = true
  }
  e.gimbal.pan = slew(e.gimbal.pan, goalAz, dtS)
  e.gimbal.tilt = slew(e.gimbal.tilt, goalEl, dtS)

  // --- Error --------------------------------------------------------------
  const errDeg = angularError(trueAz, trueEl, e.gimbal.pan, e.gimbal.tilt)
  const errMrad = degToMrad(errDeg)
  if (errMrad > m.peakMrad && beaconVisible) m.peakMrad = errMrad

  // --- Confidence ---------------------------------------------------------
  const trackQuality = e.estimate.valid ? bestAgreement : 0.6
  const target =
    occ.active || !detected ? 0 : trackQuality * (0.7 + 0.3 * clamp(snr / 6, 0, 1))
  snap.confidence += (target - snap.confidence) * 0.08
  snap.boxSize = 0.05 + (1 - snap.confidence) * 0.1 + turbulence * 0.03
  snap.detection = best ? { x: best.x, y: best.y } : predProj
  snap.prediction = project(
    e.estimate.az + e.estimate.vAz * quality.lead * 0.25,
    e.estimate.el + e.estimate.vEl * quality.lead * 0.25,
    pan,
    tilt,
  )
  snap.trail.push({ ...snap.detection })
  if (snap.trail.length > TRAIL_LENGTH) snap.trail.shift()

  // --- State machine ------------------------------------------------------
  const previous = e.state
  let next: TrackState = previous
  if (!detected) {
    e.lockTimer = 0
    if (previous === 'LOCKED' || previous === 'ACQUIRED') {
      if (e.lostTimer > 400) next = 'TRACK_LOST'
    } else {
      next = 'SEARCHING'
    }
  } else if (errDeg < LOCK_DEG && snap.confidence > 0.55) {
    e.lockTimer += dt
    next = e.lockTimer > 500 ? 'LOCKED' : 'ACQUIRED'
  } else {
    e.lockTimer = 0
    next = errDeg < ACQUIRE_DEG ? 'ACQUIRED' : 'ACQUIRED'
  }

  const stateChanged = next !== previous
  if (stateChanged) {
    e.state = next
    snap.state = next
    const r = e.recovery
    if (next === 'LOCKED') {
      if (m.lostAt > 0) {
        m.reacquisitionS = (t - m.lostAt) / 1000
        m.lostAt = 0
        events.push({
          severity: 'lock',
          message: `Re-acquired in ${m.reacquisitionS.toFixed(2)} s · boresight restored`,
        })
      } else {
        if (m.acquisitionS === 0) m.acquisitionS = t / 1000
        events.push({ severity: 'lock', message: `Lock acquired at T+${(t / 1000).toFixed(2)} s` })
      }
      if (r.lostAt > 0 && r.stage < 4) {
        const timings = [...r.timings]
        timings[4] = (t - r.lostAt) / 1000
        r.timings = timings
        r.stage = 4
        r.cycles += 1
      }
    }
    if (next === 'ACQUIRED') {
      events.push({ severity: 'info', message: 'Candidate promoted to track · closing on boresight' })
      if (r.lostAt > 0 && r.stage < 3) {
        const timings = [...r.timings]
        timings[3] = (t - r.lostAt) / 1000
        r.timings = timings
        r.stage = 3
      }
    }
    if (next === 'SEARCHING') {
      events.push({ severity: 'signal', message: 'Scanning search volume for beacon return' })
      if (r.lostAt > 0 && r.stage < 2) {
        const timings = [...r.timings]
        timings[2] = (t - r.lostAt) / 1000
        r.timings = timings
        r.stage = 2
      }
    }
    if (next === 'TRACK_LOST') {
      m.lostAt = t
      r.lostAt = t
      r.timings = [0, 0, null, null, null]
      r.stage = 1
      events.push({ severity: 'fault', message: 'Track lost · return below detection floor' })
    }
  }

  if (e.state === 'LOCKED') m.lockedMs += dt

  const telemetry: Telemetry = {
    pan: e.gimbal.pan,
    tilt: e.gimbal.tilt,
    errorPx: errDeg / DEG_PER_PX,
    errorMrad: errMrad,
    peakErrorMrad: m.peakMrad,
    confidence: snap.confidence * 100,
    snr: 10 * Math.log10(Math.max(snr, 0.05)),
    frame: e.frames,
    fps: m.fpsEma,
    processingMs: quality.cost + turbulence * 3 + candidates.length * 0.35,
    lockRetention: m.runMs > 0 ? (m.lockedMs / m.runMs) * 100 : 0,
    acquisitionS: m.acquisitionS,
    reacquisitionS: m.reacquisitionS,
    candidates: candidates.length,
  }

  return {
    telemetry,
    state: e.state,
    stateChanged,
    recovery: { stage: e.recovery.stage, timings: e.recovery.timings, cycles: e.recovery.cycles },
    events,
  }
}

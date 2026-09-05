import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogEntry, LogSeverity, Telemetry, TrackState } from './types'
import {
  ACQUIRE_DEG,
  LOCK_DEG,
  angularError,
  degToMrad,
  project,
  slew,
  DEG_PER_PX,
} from './camera'
import { bearingAt, initialMotionState, type MotionPattern, type MotionState } from './motion'

export type TrackerMode = 'centroid' | 'kalman' | 'correlation'

export type SimParams = {
  pattern: MotionPattern
  /** Target speed multiplier, 0.25–3. */
  speed: number
  /** 0–100. Scintillation and beam wander. */
  turbulence: number
  /** 0–100. Physical shake of the camera mount. */
  vibration: number
  /** 0–100. Sensor noise floor. */
  noise: number
  /** 0–100. Beacon source strength. */
  brightness: number
  /** Decoy light sources the detector must reject. */
  decoys: boolean
  /** Periodic occlusion of the beacon. */
  dropouts: boolean
  mode: TrackerMode
  running: boolean
}

export type Candidate = { x: number; y: number; score: number; decoy: boolean }

export type SimSnapshot = {
  /** Where the beacon truly is, in frame coordinates. */
  truth: { x: number; y: number; inFrame: boolean }
  /** What the tracker believes. */
  detection: { x: number; y: number }
  prediction: { x: number; y: number }
  /** Everything the detector proposed this frame, including decoys. */
  candidates: Candidate[]
  trail: Array<{ x: number; y: number }>
  boxSize: number
  state: TrackState
  confidence: number
  occluded: boolean
  /** True while the gimbal is running its search pattern. */
  searching: boolean
}

export type HistoryPoint = {
  t: number
  errorMrad: number
  targetAz: number
  predictedAz: number
  pan: number
  locked: number
}

const TRAIL_LENGTH = 56
const HISTORY_LENGTH = 90
const PUBLISH_MS = 200

const MODE_QUALITY: Record<
  TrackerMode,
  { smoothing: number; lead: number; cost: number; reject: number }
> = {
  // reject: how well the associator resists latching onto a decoy.
  centroid: { smoothing: 0.3, lead: 0.25, cost: 3.1, reject: 0.45 },
  kalman: { smoothing: 0.1, lead: 1.5, cost: 6.4, reject: 0.82 },
  correlation: { smoothing: 0.17, lead: 0.8, cost: 11.2, reject: 0.93 },
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function formatClock(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')
  return `${m}:${s}.${cs}`
}

const emptyTelemetry = (): Telemetry => ({
  pan: 0,
  tilt: 42,
  errorPx: 0,
  errorMrad: 0,
  peakErrorMrad: 0,
  confidence: 0,
  snr: 0,
  frame: 0,
  fps: 0,
  processingMs: 0,
  lockRetention: 0,
  acquisitionS: 0,
  reacquisitionS: 0,
  candidates: 0,
})

/**
 * The closed coarse-alignment loop.
 *
 * Physics and control run at frame rate against a ref, so the viewport can
 * draw without re-rendering React; telemetry, log and chart series publish a
 * few times a second, and immediately on any state change.
 */
export function useTracker(params: SimParams) {
  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  })

  const snapshotRef = useRef<SimSnapshot>({
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
  })

  const [state, setState] = useState<TrackState>('SEARCHING')
  const [telemetry, setTelemetry] = useState<Telemetry>(emptyTelemetry)
  const [log, setLog] = useState<LogEntry[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])

  // ---- mutable simulation state -------------------------------------------
  const logId = useRef(0)
  const elapsed = useRef(0)
  const frames = useRef(0)
  const lastPublish = useRef(0)
  const stateRef = useRef<TrackState>('SEARCHING')
  const motion = useRef<MotionState>(initialMotionState())
  const gimbal = useRef({ pan: 0, tilt: 42 })
  const estimate = useRef({ az: 0, el: 42, vAz: 0, vEl: 0, valid: false })
  const decoys = useRef<Array<{ az: number; el: number; drift: number; bright: number }>>([])
  const occlusion = useRef({ active: false, until: 0, next: 9000 })
  const lockTimer = useRef(0)
  const lostTimer = useRef(0)
  const searchPhase = useRef(0)
  const metrics = useRef({
    lockedMs: 0,
    runMs: 0,
    peakMrad: 0,
    acquisitionS: 0,
    reacquisitionS: 0,
    lostAt: 0,
    fpsEma: 60,
  })

  const push = useCallback((severity: LogSeverity, message: string) => {
    setLog((prev) => {
      const entry: LogEntry = { id: logId.current++, t: formatClock(elapsed.current), severity, message }
      const next = [...prev, entry]
      return next.length > 160 ? next.slice(next.length - 160) : next
    })
  }, [])

  const transition = useCallback(
    (next: TrackState) => {
      if (stateRef.current === next) return
      const previous = stateRef.current
      stateRef.current = next
      snapshotRef.current.state = next
      setState(next)

      if (next === 'LOCKED') {
        const m = metrics.current
        if (previous === 'TRACK_LOST' || m.lostAt > 0) {
          m.reacquisitionS = (elapsed.current - m.lostAt) / 1000
          m.lostAt = 0
          push('lock', `Re-acquired in ${m.reacquisitionS.toFixed(2)} s · boresight restored`)
        } else {
          if (m.acquisitionS === 0) m.acquisitionS = elapsed.current / 1000
          push('lock', `Lock acquired at T+${(elapsed.current / 1000).toFixed(2)} s`)
        }
      }
      if (next === 'ACQUIRED') push('info', 'Candidate promoted to track · closing on boresight')
      if (next === 'SEARCHING') push('signal', 'Scanning search volume for beacon return')
      if (next === 'TRACK_LOST') {
        metrics.current.lostAt = elapsed.current
        push('fault', 'Track lost · return below detection floor')
      }
    },
    [push],
  )

  const reset = useCallback(() => {
    elapsed.current = 0
    frames.current = 0
    lastPublish.current = 0
    motion.current = initialMotionState()
    gimbal.current = { pan: 0, tilt: 42 }
    estimate.current = { az: 0, el: 42, vAz: 0, vEl: 0, valid: false }
    occlusion.current = { active: false, until: 0, next: 9000 }
    lockTimer.current = 0
    lostTimer.current = 0
    searchPhase.current = 0
    metrics.current = {
      lockedMs: 0,
      runMs: 0,
      peakMrad: 0,
      acquisitionS: 0,
      reacquisitionS: 0,
      lostAt: 0,
      fpsEma: 60,
    }
    stateRef.current = 'SEARCHING'
    snapshotRef.current.trail = []
    snapshotRef.current.state = 'SEARCHING'
    setState('SEARCHING')
    setTelemetry(emptyTelemetry())
    setHistory([])
    setLog([])
    logId.current = 0
    push('info', 'Run reset · simulation clock zeroed')
  }, [push])

  // Decoys are re-seeded whenever they are switched on.
  useEffect(() => {
    if (!params.decoys) {
      decoys.current = []
      return
    }
    decoys.current = Array.from({ length: 4 }, () => ({
      az: (Math.random() - 0.5) * 18,
      el: 42 + (Math.random() - 0.5) * 12,
      drift: (Math.random() - 0.5) * 0.00016,
      bright: 0.35 + Math.random() * 0.4,
    }))
  }, [params.decoys])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(64, now - last)
      last = now

      const p = paramsRef.current
      if (!p.running) return

      elapsed.current += dt
      frames.current += 1
      const t = elapsed.current
      const dtS = dt / 1000
      const snap = snapshotRef.current
      const m = metrics.current
      m.runMs += dt
      m.fpsEma = m.fpsEma * 0.9 + (1000 / Math.max(1, dt)) * 0.1

      const turbulence = p.turbulence / 100
      const vibration = p.vibration / 100
      const noiseLevel = p.noise / 100
      const brightness = p.brightness / 100
      const quality = MODE_QUALITY[p.mode]

      // --- Where the terminal actually is ----------------------------------
      const bearing = bearingAt(p.pattern, t, p.speed, motion.current, dt)
      // Turbulence bends the apparent line of sight; it is not target motion.
      const wanderAz = Math.sin(t * 0.011) * turbulence * 0.35
      const wanderEl = Math.cos(t * 0.013) * turbulence * 0.25
      const trueAz = bearing.az + wanderAz
      const trueEl = bearing.el + wanderEl

      // --- Occlusion --------------------------------------------------------
      const occ = occlusion.current
      if (p.dropouts) {
        if (!occ.active && t > occ.next) {
          occ.active = true
          occ.until = t + 1200 + Math.random() * 1400
          push('fault', 'Beacon occluded · return lost')
        }
        if (occ.active && t > occ.until) {
          occ.active = false
          occ.next = t + 8000 + Math.random() * 8000
          push('signal', 'Occlusion cleared')
        }
      } else if (occ.active) {
        occ.active = false
        occ.next = t + 9000
      }
      snap.occluded = occ.active

      // --- Camera shake -----------------------------------------------------
      const shakeAz = Math.sin(t * 0.047) * vibration * 0.5 + Math.sin(t * 0.113) * vibration * 0.22
      const shakeTilt = Math.cos(t * 0.053) * vibration * 0.34

      const pan = gimbal.current.pan + shakeAz
      const tilt = gimbal.current.tilt + shakeTilt

      // --- Detector ---------------------------------------------------------
      const snr = clamp(
        (1.2 + brightness * 9) / (0.3 + turbulence * 2.2 + noiseLevel * 2.6),
        0.2,
        40,
      )
      const jitterDeg = (0.02 + turbulence * 0.22 + noiseLevel * 0.3) / (0.5 + brightness * 1.4)

      const truthProjection = project(trueAz, trueEl, pan, tilt)
      snap.truth = truthProjection

      const candidates: Candidate[] = []
      const beaconVisible = truthProjection.inFrame && !occ.active && snr > 1.1

      if (beaconVisible) {
        const measuredAz = trueAz + (Math.random() - 0.5) * jitterDeg * 2
        const measuredEl = trueEl + (Math.random() - 0.5) * jitterDeg * 2
        const proj = project(measuredAz, measuredEl, pan, tilt)
        candidates.push({ x: proj.x, y: proj.y, score: brightness * clamp(snr / 8, 0, 1.2), decoy: false })
      }

      for (const d of decoys.current) {
        d.az += Math.sin(t * 0.0002) * d.drift
        const proj = project(d.az, d.el, pan, tilt)
        if (proj.inFrame) {
          candidates.push({ x: proj.x, y: proj.y, score: d.bright * clamp(snr / 10, 0, 1), decoy: true })
        }
      }
      snap.candidates = candidates

      // --- Association ------------------------------------------------------
      // Score each candidate on brightness and on agreement with the estimator's
      // prediction. A weak associator follows the brightest thing it sees.
      const predAz = estimate.current.az + estimate.current.vAz * quality.lead * 0.4
      const predEl = estimate.current.el + estimate.current.vEl * quality.lead * 0.4
      const predProj = project(predAz, predEl, pan, tilt)

      let best: Candidate | null = null
      let bestScore = -Infinity
      for (const c of candidates) {
        const gate = estimate.current.valid
          ? 1 - clamp(Math.hypot(c.x - predProj.x, c.y - predProj.y) / 0.35, 0, 1)
          : 0.5
        const score = c.score * (1 - quality.reject) + gate * quality.reject
        if (score > bestScore) {
          bestScore = score
          best = c
        }
      }

      const detected = Boolean(best) && bestScore > 0.24
      if (detected && best) {
        // Convert the chosen pixel back to a bearing and fold it into the estimate.
        const measAz = pan + (best.x - 0.5) * 24
        const measEl = tilt - (best.y - 0.5) * 16
        const alpha = estimate.current.valid
          ? 1 - Math.pow(1 - quality.smoothing, dt / 16)
          : 1
        const prevAz = estimate.current.az
        const prevEl = estimate.current.el
        const nextAz = prevAz + (measAz - prevAz) * alpha
        const nextEl = prevEl + (measEl - prevEl) * alpha
        estimate.current.vAz = estimate.current.vAz * 0.85 + ((nextAz - prevAz) / Math.max(dtS, 0.001)) * 0.15
        estimate.current.vEl = estimate.current.vEl * 0.85 + ((nextEl - prevEl) / Math.max(dtS, 0.001)) * 0.15
        estimate.current.az = nextAz
        estimate.current.el = nextEl
        estimate.current.valid = true
        lostTimer.current = 0
      } else {
        lostTimer.current += dt
        // Coast on the last velocity for a short while before giving up.
        if (lostTimer.current < 600 && estimate.current.valid) {
          estimate.current.az += estimate.current.vAz * dtS
          estimate.current.el += estimate.current.vEl * dtS
        } else {
          estimate.current.valid = false
        }
      }

      // --- Gimbal control ---------------------------------------------------
      // Locked on: lead the target. Lost: run an expanding spiral search.
      let goalAz: number
      let goalEl: number
      if (estimate.current.valid) {
        goalAz = estimate.current.az + estimate.current.vAz * quality.lead * 0.12
        goalEl = estimate.current.el + estimate.current.vEl * quality.lead * 0.12
        snap.searching = false
      } else {
        searchPhase.current += dtS * 1.5
        const radius = Math.min(9, searchPhase.current * 1.6)
        goalAz = Math.cos(searchPhase.current * 2.1) * radius
        goalEl = 42 + Math.sin(searchPhase.current * 2.1) * radius * 0.55
        snap.searching = true
      }
      if (estimate.current.valid) searchPhase.current = 0

      gimbal.current.pan = slew(gimbal.current.pan, goalAz, dtS)
      gimbal.current.tilt = slew(gimbal.current.tilt, goalEl, dtS)

      // --- Error ------------------------------------------------------------
      const errDeg = angularError(trueAz, trueEl, gimbal.current.pan, gimbal.current.tilt)
      const errMrad = degToMrad(errDeg)
      const errPx = errDeg / DEG_PER_PX
      if (errMrad > m.peakMrad && beaconVisible) m.peakMrad = errMrad

      // --- Confidence and state --------------------------------------------
      const gateQuality = detected ? clamp(bestScore, 0, 1) : 0
      const target = occ.active || !detected ? 0 : gateQuality * clamp(snr / 7, 0, 1)
      snap.confidence += (target - snap.confidence) * 0.08
      snap.boxSize = 0.05 + (1 - snap.confidence) * 0.1 + turbulence * 0.03

      snap.detection = best ? { x: best.x, y: best.y } : predProj
      snap.prediction = project(
        estimate.current.az + estimate.current.vAz * quality.lead * 0.25,
        estimate.current.el + estimate.current.vEl * quality.lead * 0.25,
        pan,
        tilt,
      )
      snap.trail.push({ ...snap.detection })
      if (snap.trail.length > TRAIL_LENGTH) snap.trail.shift()

      if (!detected) {
        lockTimer.current = 0
        if (stateRef.current === 'LOCKED' || stateRef.current === 'ACQUIRED') {
          if (lostTimer.current > 400) transition('TRACK_LOST')
        } else {
          transition('SEARCHING')
        }
      } else if (errDeg < LOCK_DEG && snap.confidence > 0.55) {
        lockTimer.current += dt
        transition(lockTimer.current > 500 ? 'LOCKED' : 'ACQUIRED')
      } else if (errDeg < ACQUIRE_DEG) {
        lockTimer.current = 0
        transition('ACQUIRED')
      } else {
        lockTimer.current = 0
        transition('ACQUIRED')
      }

      if (stateRef.current === 'LOCKED') m.lockedMs += dt

      // --- Publish ----------------------------------------------------------
      if (t - lastPublish.current > PUBLISH_MS) {
        lastPublish.current = t

        setTelemetry({
          pan: gimbal.current.pan,
          tilt: gimbal.current.tilt,
          errorPx: errPx,
          errorMrad: errMrad,
          peakErrorMrad: m.peakMrad,
          confidence: snap.confidence * 100,
          snr: 10 * Math.log10(Math.max(snr, 0.05)),
          frame: frames.current,
          fps: m.fpsEma,
          processingMs: quality.cost + turbulence * 3 + candidates.length * 0.35,
          lockRetention: m.runMs > 0 ? (m.lockedMs / m.runMs) * 100 : 0,
          acquisitionS: m.acquisitionS,
          reacquisitionS: m.reacquisitionS,
          candidates: candidates.length,
        })

        setHistory((prev) => {
          const next = [
            ...prev,
            {
              t: Math.round(t / 100) / 10,
              errorMrad: Number(errMrad.toFixed(2)),
              targetAz: Number(trueAz.toFixed(3)),
              predictedAz: Number(estimate.current.az.toFixed(3)),
              pan: Number(gimbal.current.pan.toFixed(3)),
              locked: stateRef.current === 'LOCKED' ? 1 : 0,
            },
          ]
          return next.length > HISTORY_LENGTH ? next.slice(next.length - HISTORY_LENGTH) : next
        })
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [push, transition])

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    push('info', 'Virtual camera online · FOV 24° × 16°, 1280 px')
    push('signal', 'Scanning search volume for beacon return')
  }, [push])

  return { state, telemetry, log, history, snapshotRef, reset }
}

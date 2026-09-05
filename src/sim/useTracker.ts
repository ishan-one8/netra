import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogEntry, LogSeverity, Telemetry, TrackState } from './types'

export type TrackerMode = 'centroid' | 'kalman' | 'correlation'
export type Scene = 'leo' | 'geo' | 'ground'

export type SimParams = {
  turbulence: number // 0–100, Cn² proxy
  jitter: number // 0–100, platform vibration
  gain: number // 0–100, detector gain
  sweep: number // 0–100, search sweep rate
  mode: TrackerMode
  scene: Scene
  running: boolean
}

export type SimSnapshot = {
  /** Beacon truth, in normalised viewport space. */
  truth: { x: number; y: number }
  /** What the detector reports this frame. */
  detection: { x: number; y: number }
  /** Kalman lead, drawn as the dashed ghost. */
  prediction: { x: number; y: number }
  /** Recent detections, oldest first. */
  trail: Array<{ x: number; y: number }>
  boxSize: number
  state: TrackState
  confidence: number
  occluded: boolean
}

export type HistoryPoint = {
  t: number
  error: number
  confidence: number
}

const TRAIL_LENGTH = 48
const HISTORY_LENGTH = 60
const PUBLISH_MS = 220

const SCENE_DRIFT: Record<Scene, { rate: number; span: number }> = {
  leo: { rate: 0.00042, span: 0.3 },
  geo: { rate: 0.00009, span: 0.06 },
  ground: { rate: 0.00021, span: 0.16 },
}

const MODE_QUALITY: Record<TrackerMode, { smoothing: number; lead: number; cost: number }> = {
  centroid: { smoothing: 0.28, lead: 0.4, cost: 3.1 },
  kalman: { smoothing: 0.09, lead: 1.6, cost: 6.4 },
  correlation: { smoothing: 0.16, lead: 0.9, cost: 11.2 },
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function formatClock(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * The tracking loop. Physics runs at frame rate against a ref so the viewport
 * can draw without re-rendering React; telemetry, log and chart series publish
 * a few times a second, plus immediately on any state change.
 */
export function useTracker(params: SimParams) {
  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  })

  const snapshotRef = useRef<SimSnapshot>({
    truth: { x: 0.5, y: 0.5 },
    detection: { x: 0.5, y: 0.5 },
    prediction: { x: 0.5, y: 0.5 },
    trail: [],
    boxSize: 0.12,
    state: 'SEARCHING',
    confidence: 0,
    occluded: false,
  })

  const [state, setState] = useState<TrackState>('SEARCHING')
  const [telemetry, setTelemetry] = useState<Telemetry>({
    azimuth: 0,
    elevation: 0,
    range: 0,
    confidence: 0,
    latency: 0,
    frame: 0,
    rmsError: 0,
    snr: 0,
  })
  const [log, setLog] = useState<LogEntry[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])

  const logIdRef = useRef(0)
  const elapsedRef = useRef(0)
  const frameRef = useRef(0)
  const lastPublishRef = useRef(0)
  const stateRef = useRef<TrackState>('SEARCHING')
  const lockTimerRef = useRef(0)
  const occlusionRef = useRef({ active: false, until: 0, next: 6200 })
  const smoothedRef = useRef({ x: 0.5, y: 0.5 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const errorRef = useRef(1)

  const push = useCallback((severity: LogSeverity, message: string) => {
    setLog((prev) => {
      const entry: LogEntry = {
        id: logIdRef.current++,
        t: formatClock(elapsedRef.current),
        severity,
        message,
      }
      const next = [...prev, entry]
      return next.length > 140 ? next.slice(next.length - 140) : next
    })
  }, [])

  const transition = useCallback(
    (next: TrackState) => {
      if (stateRef.current === next) return
      stateRef.current = next
      snapshotRef.current.state = next
      setState(next)
      if (next === 'LOCKED') push('lock', 'Closed-loop lock acquired · residual within budget')
      if (next === 'ACQUIRED') push('info', 'Beacon candidate promoted to track')
      if (next === 'SEARCHING') push('signal', 'Sweeping search volume for beacon return')
      if (next === 'TRACK_LOST') push('fault', 'Track lost · return below detection floor')
    },
    [push],
  )

  const reset = useCallback(() => {
    elapsedRef.current = 0
    frameRef.current = 0
    lockTimerRef.current = 0
    occlusionRef.current = { active: false, until: 0, next: 6200 }
    smoothedRef.current = { x: 0.5, y: 0.5 }
    velocityRef.current = { x: 0, y: 0 }
    errorRef.current = 1
    stateRef.current = 'SEARCHING'
    snapshotRef.current.trail = []
    snapshotRef.current.state = 'SEARCHING'
    setState('SEARCHING')
    setHistory([])
    setLog([])
    logIdRef.current = 0
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(64, now - last)
      last = now

      const p = paramsRef.current
      if (!p.running) return

      elapsedRef.current += dt
      frameRef.current += 1
      const t = elapsedRef.current
      const snap = snapshotRef.current

      // --- Beacon truth ------------------------------------------------------
      const drift = SCENE_DRIFT[p.scene]
      const jitterAmp = (p.jitter / 100) * 0.012
      const truthX =
        0.5 + Math.sin(t * drift.rate) * drift.span + Math.sin(t * 0.011) * jitterAmp
      const truthY =
        0.48 +
        Math.cos(t * drift.rate * 0.74) * drift.span * 0.55 +
        Math.cos(t * 0.013) * jitterAmp
      snap.truth = { x: clamp01(truthX), y: clamp01(truthY) }

      // --- Occlusion ---------------------------------------------------------
      const occ = occlusionRef.current
      if (!occ.active && t > occ.next) {
        occ.active = true
        occ.until = t + 1400 + Math.random() * 1200
        push('fault', 'Cloud transit — beacon return occluded')
      }
      if (occ.active && t > occ.until) {
        occ.active = false
        occ.next = t + 9000 + Math.random() * 7000
        push('signal', 'Occlusion cleared — reacquiring')
      }
      snap.occluded = occ.active

      // --- Detector ----------------------------------------------------------
      const turbulence = p.turbulence / 100
      const gain = p.gain / 100
      const snr = Math.max(0.4, (1.6 + gain * 8.4) / (0.35 + turbulence * 2.6))
      const noise = (0.004 + turbulence * 0.05) / (0.6 + gain * 1.6)
      const detectionX = snap.truth.x + (Math.random() - 0.5) * noise * 2
      const detectionY = snap.truth.y + (Math.random() - 0.5) * noise * 2

      const quality = MODE_QUALITY[p.mode]
      const smoothing = occ.active ? 0.02 : 1 - Math.pow(1 - quality.smoothing, dt / 16)
      const prevX = smoothedRef.current.x
      const prevY = smoothedRef.current.y
      const nextX = prevX + (detectionX - prevX) * smoothing
      const nextY = prevY + (detectionY - prevY) * smoothing
      velocityRef.current = { x: nextX - prevX, y: nextY - prevY }
      smoothedRef.current = { x: nextX, y: nextY }

      snap.detection = { x: nextX, y: nextY }
      snap.prediction = {
        x: clamp01(nextX + velocityRef.current.x * quality.lead * 14),
        y: clamp01(nextY + velocityRef.current.y * quality.lead * 14),
      }

      snap.trail.push({ x: nextX, y: nextY })
      if (snap.trail.length > TRAIL_LENGTH) snap.trail.shift()

      const residual = Math.hypot(nextX - snap.truth.x, nextY - snap.truth.y)
      errorRef.current = errorRef.current * 0.9 + residual * 0.1

      // --- Confidence and state ---------------------------------------------
      const sweepBoost = 0.4 + (p.sweep / 100) * 0.9
      const target = occ.active ? 0 : clamp01((snr / 10) * (1 - residual * 22) * sweepBoost)
      snap.confidence = snap.confidence + (target - snap.confidence) * 0.06
      snap.boxSize = 0.05 + (1 - snap.confidence) * 0.14 + turbulence * 0.04

      if (occ.active) {
        lockTimerRef.current = 0
        if (stateRef.current === 'LOCKED' || stateRef.current === 'ACQUIRED') {
          transition('TRACK_LOST')
        }
      } else if (snap.confidence > 0.72) {
        lockTimerRef.current += dt
        transition(lockTimerRef.current > 900 ? 'LOCKED' : 'ACQUIRED')
      } else if (snap.confidence > 0.32) {
        lockTimerRef.current = 0
        transition('ACQUIRED')
      } else {
        lockTimerRef.current = 0
        transition('SEARCHING')
      }

      // --- Publish -----------------------------------------------------------
      if (t - lastPublishRef.current > PUBLISH_MS) {
        lastPublishRef.current = t
        const azimuth = (snap.detection.x - 0.5) * 24
        const elevation = (0.5 - snap.detection.y) * 16 + 42
        const range =
          p.scene === 'geo' ? 35786 + Math.sin(t * 0.0002) * 4 : p.scene === 'leo' ? 812 + Math.sin(t * 0.0004) * 22 : 12.4 + Math.sin(t * 0.0006) * 0.3

        setTelemetry({
          azimuth,
          elevation,
          range,
          confidence: snap.confidence * 100,
          latency: quality.cost + turbulence * 4.2 + Math.random() * 0.6,
          frame: frameRef.current,
          rmsError: errorRef.current * 1000,
          snr,
        })

        setHistory((prev) => {
          const next = [
            ...prev,
            {
              t: Math.round(t / 100) / 10,
              error: Number((errorRef.current * 1000).toFixed(2)),
              confidence: Number((snap.confidence * 100).toFixed(1)),
            },
          ]
          return next.length > HISTORY_LENGTH ? next.slice(next.length - HISTORY_LENGTH) : next
        })
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [push, transition])

  useEffect(() => {
    push('info', 'NETRA ground segment online · simulation clock started')
    push('signal', 'Sweeping search volume for beacon return')
    // Seeded once for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { state, telemetry, log, history, snapshotRef, reset }
}

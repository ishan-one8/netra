import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogEntry, Recovery, Telemetry, TrackState } from './types'
import { createEngine, seedDecoys, stepEngine, type Engine, type SimSnapshot } from './engine'

export type { SimParams, SimSnapshot, Candidate, TrackerMode } from './engine'

export type HistoryPoint = {
  t: number
  errorMrad: number
  targetAz: number
  predictedAz: number
  pan: number
  locked: number
}

import type { SimParams } from './engine'

const HISTORY_LENGTH = 90
const PUBLISH_MS = 200

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
 * React's view of the tracking loop.
 *
 * All the physics lives in `engine.ts` as a plain function, so the same code
 * this renders can be run headlessly and measured — see `scripts/bench.ts`.
 * This hook only drives it and decides what reaches the screen: the canvas
 * reads the engine's snapshot directly each frame, while telemetry, log and
 * chart series publish a few times a second.
 */
export function useTracker(params: SimParams) {
  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  })

  // Created once, lazily, and never read during render.
  const engineRef = useRef<Engine>(null as unknown as Engine)
  if (engineRef.current === null) engineRef.current = createEngine()
  const snapshotRef = useRef<SimSnapshot>(createEngine().snapshot)

  const [state, setState] = useState<TrackState>('SEARCHING')
  const [telemetry, setTelemetry] = useState<Telemetry>(emptyTelemetry)
  const [log, setLog] = useState<LogEntry[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [recovery, setRecovery] = useState<Recovery>({
    stage: 0,
    timings: [null, null, null, null, null],
    cycles: 0,
  })

  const logId = useRef(0)
  const lastPublish = useRef(0)

  const reset = useCallback(() => {
    const fresh = createEngine()
    seedDecoys(fresh, paramsRef.current.decoys)
    engineRef.current = fresh
    snapshotRef.current = fresh.snapshot
    lastPublish.current = 0
    logId.current = 0
    setState('SEARCHING')
    setTelemetry(emptyTelemetry())
    setHistory([])
    setRecovery({ stage: 0, timings: [null, null, null, null, null], cycles: 0 })
    setLog([
      { id: logId.current++, t: '00:00.00', severity: 'info', message: 'Run reset · simulation clock zeroed' },
    ])
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    // Point the shared snapshot at the live engine before the first frame.
    snapshotRef.current = engineRef.current.snapshot

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = now - last
      last = now

      const p = paramsRef.current
      if (!p.running) return

      const e = engineRef.current
      if (!e) return

      const result = stepEngine(e, p, dt)
      snapshotRef.current = e.snapshot

      if (result.events.length) {
        const stamp = formatClock(e.elapsed)
        setLog((prev) => {
          const next = [
            ...prev,
            ...result.events.map((ev) => ({
              id: logId.current++,
              t: stamp,
              severity: ev.severity,
              message: ev.message,
            })),
          ]
          return next.length > 160 ? next.slice(next.length - 160) : next
        })
      }

      if (result.stateChanged) {
        setState(result.state)
        setRecovery(result.recovery)
      }

      if (e.elapsed - lastPublish.current > PUBLISH_MS) {
        lastPublish.current = e.elapsed
        setTelemetry(result.telemetry)
        setHistory((prev) => {
          const next = [
            ...prev,
            {
              t: Math.round(e.elapsed / 100) / 10,
              errorMrad: Number(result.telemetry.errorMrad.toFixed(2)),
              targetAz: Number(((e.snapshot.truth.x - 0.5) * 24 + e.gimbal.pan).toFixed(3)),
              predictedAz: Number(e.estimate.az.toFixed(3)),
              pan: Number(e.gimbal.pan.toFixed(3)),
              locked: result.state === 'LOCKED' ? 1 : 0,
            },
          ]
          return next.length > HISTORY_LENGTH ? next.slice(next.length - HISTORY_LENGTH) : next
        })
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    setLog([
      { id: logId.current++, t: '00:00.00', severity: 'info', message: 'Virtual camera online · FOV 24° × 16°, 1280 px' },
      { id: logId.current++, t: '00:00.00', severity: 'signal', message: 'Scanning search volume for beacon return' },
    ])
  }, [])

  return { state, telemetry, log, history, recovery, snapshotRef, reset }
}

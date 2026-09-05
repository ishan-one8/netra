import { useCallback, useEffect, useRef, useState } from 'react'
import type { SimParams } from './useTracker'
import type { TrackState } from './types'

/**
 * A scripted evaluation. The same loop runs through a fixed sequence of
 * adversarial conditions, each phase is scored against published thresholds,
 * and the run ends with a verdict rather than an impression.
 */

export type Phase = {
  id: string
  name: string
  detail: string
  seconds: number
  overrides: Partial<SimParams>
}

/** Thresholds are stated up front so a pass cannot be moved after the fact. */
export const THRESHOLDS = {
  meanMrad: 14,
  maxMrad: 60,
  lockRetention: 65,
} as const

export const PHASES: readonly Phase[] = [
  {
    id: '01',
    name: 'Nominal',
    detail: 'Baseline conditions. Establishes the floor everything else is measured against.',
    seconds: 6,
    overrides: { speed: 1, turbulence: 20, vibration: 12, noise: 12, brightness: 90, decoys: false, dropouts: false },
  },
  {
    id: '02',
    name: 'Fast target',
    detail: 'The terminal moves 2.6× faster than nominal — the estimator has to lead further ahead.',
    seconds: 6,
    overrides: { speed: 2.6, turbulence: 20, vibration: 12, noise: 12, brightness: 90, decoys: false, dropouts: false },
  },
  {
    id: '03',
    name: 'Platform vibration',
    detail: 'The camera mount shakes. Every measurement inherits the shake before the filter sees it.',
    seconds: 6,
    overrides: { speed: 1, turbulence: 20, vibration: 80, noise: 15, brightness: 90, decoys: false, dropouts: false },
  },
  {
    id: '04',
    name: 'Sensor noise',
    detail: 'The noise floor rises until the beacon is barely above the background.',
    seconds: 6,
    overrides: { speed: 1, turbulence: 20, vibration: 12, noise: 82, brightness: 60, decoys: false, dropouts: false },
  },
  {
    id: '05',
    name: 'Atmospheric turbulence',
    detail: 'Scintillation and beam wander bend the apparent line of sight.',
    seconds: 6,
    overrides: { speed: 1, turbulence: 85, vibration: 15, noise: 20, brightness: 80, decoys: false, dropouts: false },
  },
  {
    id: '06',
    name: 'Beacon dropout',
    detail: 'The return disappears entirely and has to be re-acquired without an operator.',
    seconds: 7,
    overrides: { speed: 1, turbulence: 25, vibration: 15, noise: 15, brightness: 90, decoys: false, dropouts: true },
  },
  {
    id: '07',
    name: 'Decoy sources',
    detail: 'Competing bright objects enter the frame. The associator must not latch onto one.',
    seconds: 6,
    overrides: { speed: 1.2, turbulence: 25, vibration: 15, noise: 25, brightness: 55, decoys: true, dropouts: false },
  },
  {
    id: '08',
    name: 'Combined',
    detail: 'Every disturbance at once — the worst case the loop is expected to survive.',
    seconds: 7,
    overrides: { speed: 2, turbulence: 75, vibration: 70, noise: 70, brightness: 55, decoys: true, dropouts: true },
  },
]

export type PhaseResult = {
  phase: Phase
  meanMrad: number
  maxMrad: number
  lockRetention: number
  samples: number
  pass: boolean
  failed: string[]
}

export type Report = {
  results: PhaseResult[]
  passed: number
  total: number
  verdict: 'PASS' | 'FAIL'
  meanMrad: number
  worstMrad: number
}

export type Sample = { errorMrad: number; state: TrackState }

type Options = {
  /** Applies a phase's conditions to the running simulation. */
  apply: (overrides: Partial<SimParams> | null) => void
  /** Read the live loop. A ref, so the timer never closes over stale values. */
  sampleRef: React.RefObject<Sample>
}

const SAMPLE_MS = 100

export function useStressTest({ apply, sampleRef }: Options) {
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(-1)
  const [elapsedInPhase, setElapsedInPhase] = useState(0)
  const [report, setReport] = useState<Report | null>(null)

  const acc = useRef<{ sum: number; max: number; locked: number; n: number }>({
    sum: 0,
    max: 0,
    locked: 0,
    n: 0,
  })
  const results = useRef<PhaseResult[]>([])
  const timer = useRef(0)
  const phaseRef = useRef(-1)
  const startedAt = useRef(0)
  // The first second of a phase is settling time, not evidence.
  const SETTLE_MS = 1000

  const finish = useCallback(() => {
    const all = results.current
    const passed = all.filter((r) => r.pass).length
    const meanMrad = all.length ? all.reduce((s, r) => s + r.meanMrad, 0) / all.length : 0
    const worstMrad = all.length ? Math.max(...all.map((r) => r.maxMrad)) : 0
    setReport({
      results: all,
      passed,
      total: all.length,
      verdict: passed === all.length ? 'PASS' : 'FAIL',
      meanMrad,
      worstMrad,
    })
    setRunning(false)
    setPhaseIndex(-1)
    phaseRef.current = -1
    apply(null)
  }, [apply])

  const closePhase = useCallback(() => {
    const phase = PHASES[phaseRef.current]
    if (!phase) return
    const a = acc.current
    const mean = a.n ? a.sum / a.n : 0
    const retention = a.n ? (a.locked / a.n) * 100 : 0
    const failed: string[] = []
    if (a.n === 0) {
      failed.push('no samples')
    } else {
      if (mean > THRESHOLDS.meanMrad) failed.push('mean error')
      if (a.max > THRESHOLDS.maxMrad) failed.push('peak error')
      if (retention < THRESHOLDS.lockRetention) failed.push('lock retention')
    }

    results.current = [
      ...results.current,
      {
        phase,
        meanMrad: mean,
        maxMrad: a.max,
        lockRetention: retention,
        samples: a.n,
        pass: failed.length === 0,
        failed,
      },
    ]
  }, [])

  const start = useCallback(() => {
    results.current = []
    acc.current = { sum: 0, max: 0, locked: 0, n: 0 }
    phaseRef.current = 0
    startedAt.current = performance.now()
    setReport(null)
    setPhaseIndex(0)
    setElapsedInPhase(0)
    setRunning(true)
    apply(PHASES[0].overrides)
  }, [apply])

  const cancel = useCallback(() => {
    setRunning(false)
    setPhaseIndex(-1)
    phaseRef.current = -1
    apply(null)
  }, [apply])

  useEffect(() => {
    if (!running) return

    timer.current = window.setInterval(() => {
      const i = phaseRef.current
      const phase = PHASES[i]
      if (!phase) return

      if (document.hidden) {
        // The loop is not advancing; hold the phase clock rather than grading a
        // frozen simulation.
        startedAt.current += SAMPLE_MS
        return
      }

      const since = performance.now() - startedAt.current
      setElapsedInPhase(since)

      if (since > SETTLE_MS) {
        const s = sampleRef.current
        if (s) {
          const a = acc.current
          a.sum += s.errorMrad
          a.max = Math.max(a.max, s.errorMrad)
          a.locked += s.state === 'LOCKED' ? 1 : 0
          a.n += 1
        }
      }

      if (since >= phase.seconds * 1000) {
        closePhase()
        const next = i + 1
        acc.current = { sum: 0, max: 0, locked: 0, n: 0 }
        startedAt.current = performance.now()
        if (next >= PHASES.length) {
          finish()
        } else {
          phaseRef.current = next
          setPhaseIndex(next)
          setElapsedInPhase(0)
          apply(PHASES[next].overrides)
        }
      }
    }, SAMPLE_MS)

    return () => window.clearInterval(timer.current)
  }, [running, apply, closePhase, finish, sampleRef])

  const totalSeconds = PHASES.reduce((s, p) => s + p.seconds, 0)
  const doneSeconds = PHASES.slice(0, Math.max(0, phaseIndex)).reduce((s, p) => s + p.seconds, 0)
  const progress = running
    ? Math.min(1, (doneSeconds + elapsedInPhase / 1000) / totalSeconds)
    : report
      ? 1
      : 0

  return { running, phaseIndex, progress, report, start, cancel, totalSeconds }
}

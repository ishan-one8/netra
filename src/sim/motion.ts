/**
 * How the remote terminal moves. Each pattern is a bearing in degrees over
 * mission time — the platform motion the tracker has to survive.
 */
export type MotionPattern = 'orbital' | 'lissajous' | 'sweep' | 'wander'

export const MOTION_PATTERNS = [
  {
    value: 'orbital',
    label: 'LEO pass',
    detail: 'A satellite rising, transiting and setting — azimuth sweeps while elevation arcs.',
  },
  {
    value: 'lissajous',
    label: 'Lissajous',
    detail: 'Two-axis oscillation. The classic adversarial path: never repeats the same approach.',
  },
  {
    value: 'sweep',
    label: 'Linear sweep',
    detail: 'A UAV crossing the field at constant rate, then reversing.',
  },
  {
    value: 'wander',
    label: 'Random wander',
    detail: 'Correlated random walk — a drifting platform with no predictable path.',
  },
] as const satisfies ReadonlyArray<{ value: MotionPattern; label: string; detail: string }>

export type Bearing = { az: number; el: number }

/** Mutable state for the patterns that are not closed-form. */
export type MotionState = { wanderAz: number; wanderEl: number; vAz: number; vEl: number }

export const initialMotionState = (): MotionState => ({
  wanderAz: 0,
  wanderEl: 42,
  vAz: 0,
  vEl: 0,
})

/**
 * @param t mission time in ms
 * @param speed multiplier, 0.25–3
 */
export function bearingAt(
  pattern: MotionPattern,
  t: number,
  speed: number,
  state: MotionState,
  dt: number,
): Bearing {
  const k = t * 0.001 * speed

  switch (pattern) {
    case 'orbital': {
      // A pass: azimuth crosses the sky, elevation arcs up and back down.
      const period = 48
      const phase = ((k % period) / period) * Math.PI * 2
      return {
        az: Math.sin(phase) * 9.5,
        el: 42 + Math.sin(phase * 0.5) * 5.5,
      }
    }
    case 'lissajous':
      return {
        az: Math.sin(k * 0.42) * 8.5,
        el: 42 + Math.sin(k * 0.61 + Math.PI / 3) * 5,
      }
    case 'sweep': {
      const period = 26
      const phase = (k % period) / period
      const tri = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4
      return { az: tri * 9, el: 42 + Math.sin(k * 0.18) * 2 }
    }
    case 'wander': {
      // Ornstein-Uhlenbeck: drifts, but is pulled back toward the centre.
      const s = Math.min(dt, 64) / 1000
      state.vAz += ((Math.random() - 0.5) * 14 - state.vAz * 1.6) * s * speed
      state.vEl += ((Math.random() - 0.5) * 8 - state.vEl * 1.6) * s * speed
      state.wanderAz += state.vAz * s * speed
      state.wanderEl += state.vEl * s * speed
      state.wanderAz -= state.wanderAz * 0.25 * s
      state.wanderEl -= (state.wanderEl - 42) * 0.25 * s
      return {
        az: Math.max(-10, Math.min(10, state.wanderAz)),
        el: Math.max(35, Math.min(49, state.wanderEl)),
      }
    }
  }
}

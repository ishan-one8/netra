import { Label } from '../system'

/**
 * Roles are real; names are the team's to fill. An empty slot renders as an
 * empty slot rather than as leftover placeholder text.
 */
const TEAM = [
  { code: 'CV', role: 'Detection', name: '', detail: 'Beacon detection, decoy rejection, robustness under noise.' },
  { code: 'EST', role: 'Estimation', name: '', detail: 'Kalman state estimation, smoothing and look-ahead prediction.' },
  { code: 'SIM', role: 'Simulation', name: '', detail: 'Virtual camera, motion models and disturbance physics.' },
  { code: 'CTL', role: 'Control', name: '', detail: 'Pan/tilt servo model, slew limits, boresight loop.' },
  { code: 'TST', role: 'Evaluation', name: '', detail: 'Stress-test design, thresholds and the evidence layer.' },
  { code: 'UI', role: 'Console', name: '', detail: 'Mission console, telemetry, charts and integration.' },
] as const

export function Team() {
  return (
    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {TEAM.map((m) => (
        <div key={m.code} className="glass-card glass-card-hover flex flex-col gap-8 rounded-md p-16">
          <div className="flex items-center gap-8">
            <span className="inline-flex size-[32px] items-center justify-center rounded-full border border-beam/30 bg-beam-wash font-mono text-hud font-medium text-beam">
              {m.code}
            </span>
            <Label>{m.role}</Label>
          </div>
          <p
            className={
              m.name ? 'text-small font-medium text-ink' : 'text-small text-ink-faint italic'
            }
          >
            {m.name || 'Name to be added'}
          </p>
          <p className="text-caption text-ink-muted">{m.detail}</p>
        </div>
      ))}
    </div>
  )
}

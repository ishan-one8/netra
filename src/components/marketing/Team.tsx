import { Label } from '../system'

/**
 * Roles are real; names are the team's to fill. An empty slot renders as an
 * empty slot rather than as leftover placeholder text.
 */
const TEAM = [
  { code: 'CV', role: 'Detection', name: '', detail: 'Detection, decoy rejection, robustness.' },
  { code: 'EST', role: 'Estimation', name: '', detail: 'State estimation, smoothing, prediction.' },
  { code: 'SIM', role: 'Simulation', name: '', detail: 'Virtual camera, motion, disturbance physics.' },
  { code: 'CTL', role: 'Control', name: '', detail: 'Servo model, slew limits, boresight loop.' },
  { code: 'TST', role: 'Evaluation', name: '', detail: 'Stress tests, thresholds, the evidence layer.' },
  { code: 'UI', role: 'Console', name: '', detail: 'Console, telemetry, charts, integration.' },
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

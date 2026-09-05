const USES = [
  {
    name: 'Ground-to-satellite links',
    detail: 'A station holding a LEO satellite across the whole pass.',
  },
  {
    name: 'Inter-satellite optical links',
    detail: 'Precise pointing between two moving platforms.',
  },
  {
    name: 'UAV and vehicle terminals',
    detail: 'Sway, vibration, and handover between positions.',
  },
  {
    name: 'Terminal bring-up and tuning',
    detail: 'A repeatable testbed before the bench exists.',
  },
] as const

export function Applications() {
  return (
    <div className="grid gap-12 sm:grid-cols-2">
      {USES.map((u) => (
        <div key={u.name} className="glass-card glass-card-hover flex flex-col gap-8 rounded-md p-20">
          <h3 className="font-display text-title font-medium text-ink">{u.name}</h3>
          <p className="text-small text-ink-muted">{u.detail}</p>
        </div>
      ))}
    </div>
  )
}

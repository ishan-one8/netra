const USES = [
  {
    name: 'Ground-to-satellite links',
    detail: 'A station tracking a LEO satellite across the sky needs continuous coarse alignment for the whole pass.',
  },
  {
    name: 'Inter-satellite optical links',
    detail: 'Satellite-to-satellite laser links demand precise pointing between two moving platforms.',
  },
  {
    name: 'UAV and vehicle terminals',
    detail: 'Mobile platforms carry the terminal through sway, vibration and handover between positions.',
  },
  {
    name: 'Terminal bring-up and tuning',
    detail: 'A repeatable testbed for alignment algorithms before an optical bench is available.',
  },
] as const

export function Applications() {
  return (
    <div className="grid gap-12 sm:grid-cols-2">
      {USES.map((u) => (
        <div key={u.name} className="glass-card glass-card-hover flex flex-col gap-8 rounded-md p-20">
          <h3 className="text-title font-medium text-ink">{u.name}</h3>
          <p className="text-small text-ink-muted">{u.detail}</p>
        </div>
      ))}
    </div>
  )
}

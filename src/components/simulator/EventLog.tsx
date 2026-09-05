import { useEffect, useRef } from 'react'
import type { LogEntry, LogSeverity } from '../../sim/types'
import { cx } from '../../lib/cx'

/** Severity told by tone, since the system carries no chromatic colour. */
const DOT: Record<LogSeverity, string> = {
  info: 'bg-graphite',
  signal: 'bg-smoke',
  lock: 'bg-lamp-cream',
  fault: 'border border-smoke',
}

export function EventLog({ entries, className }: { entries: LogEntry[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div
      ref={ref}
      className={cx('log-scroll max-h-[300px] overflow-y-auto pr-12', className)}
      role="log"
      aria-label="Event log"
    >
      <ul className="flex flex-col gap-8">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-12 text-small">
            <span className="tabular text-smoke">{entry.t}</span>
            <span aria-hidden className={cx('size-[5px] shrink-0 rounded-full', DOT[entry.severity])} />
            <span className="text-pure-white">{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

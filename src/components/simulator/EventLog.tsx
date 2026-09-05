import { useEffect, useRef } from 'react'
import type { LogEntry, LogSeverity } from '../../sim/types'
import { cx } from '../../lib/cx'

const DOT: Record<LogSeverity, string> = {
  info: 'bg-rule-strong',
  signal: 'bg-beam',
  lock: 'bg-lock',
  fault: 'bg-fault',
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
      className={cx('log-scroll max-h-[300px] overflow-y-auto pr-8', className)}
      role="log"
      aria-label="Event log"
    >
      <ul className="flex flex-col gap-8">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-12 font-mono text-log">
            <span className="shrink-0 text-ink-faint">{entry.t}</span>
            <span
              aria-hidden
              className={cx('mt-[6px] size-[5px] shrink-0 rounded-full', DOT[entry.severity])}
            />
            <span className="text-ink-muted">{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

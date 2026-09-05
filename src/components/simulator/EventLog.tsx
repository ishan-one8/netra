import { useEffect, useRef } from 'react'
import type { LogEntry, LogSeverity } from '../../sim/types'
import { cx } from '../../lib/cx'

const DOT: Record<LogSeverity, string> = {
  info: 'bg-ash',
  signal: 'bg-signal',
  lock: 'bg-lock',
  fault: 'bg-fault',
}

/**
 * The only high-density region in the product, and that density is the point.
 * Rows are separated by line-height alone.
 */
export function EventLog({ entries, className }: { entries: LogEntry[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div
      ref={ref}
      className={cx('log-scroll max-h-[280px] overflow-y-auto pr-12', className)}
      role="log"
      aria-label="Event log"
    >
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-12 font-mono text-log">
            <span className="text-ash">{entry.t}</span>
            <span aria-hidden className={cx('size-[4px] shrink-0 rounded-full', DOT[entry.severity])} />
            <span className="text-bone">{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

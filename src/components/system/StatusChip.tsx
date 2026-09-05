import { useEffect, useRef, useState } from 'react'
import type { TrackState } from '../../sim/types'
import { cx } from '../../lib/cx'

const LABEL: Record<TrackState, string> = {
  SEARCHING: 'Searching',
  ACQUIRED: 'Acquired',
  LOCKED: 'Locked',
  TRACK_LOST: 'Track lost',
}

const TONE: Record<TrackState, { dot: string; text: string; wash: string; pulse: boolean }> = {
  SEARCHING: {
    dot: 'bg-beam',
    text: 'text-beam',
    wash: 'bg-beam-wash border-transparent',
    pulse: true,
  },
  ACQUIRED: {
    dot: 'bg-ink',
    text: 'text-ink',
    wash: 'bg-surface border-rule',
    pulse: false,
  },
  LOCKED: {
    dot: 'bg-lock',
    text: 'text-lock',
    wash: 'bg-surface border-rule',
    pulse: false,
  },
  TRACK_LOST: {
    dot: 'bg-fault',
    text: 'text-fault',
    wash: 'bg-surface border-rule',
    pulse: false,
  },
}

export function StatusChip({ state, className }: { state: TrackState; className?: string }) {
  const tone = TONE[state]
  const [flash, setFlash] = useState(0)
  const previous = useRef(state)

  useEffect(() => {
    if (previous.current !== state) {
      previous.current = state
      setFlash((n) => n + 1)
    }
  }, [state])

  return (
    <span
      key={flash}
      role="status"
      aria-live="polite"
      className={cx(
        'inline-flex items-center gap-8 rounded-full border px-12 py-4',
        'text-label font-medium uppercase tracking-label shadow-xs',
        'transition-colors duration-300 ease-out',
        flash > 0 && 'state-flash',
        tone.wash,
        tone.text,
        className,
      )}
    >
      <span
        aria-hidden
        className={cx('size-[7px] rounded-full', tone.dot, tone.pulse && 'pulse-dot')}
      />
      {LABEL[state]}
    </span>
  )
}

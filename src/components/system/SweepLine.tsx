import { useEffect, useRef, useState } from 'react'
import type { TrackState } from '../../sim/types'
import { cx } from '../../lib/cx'

const TONE: Record<TrackState, string> = {
  SEARCHING: 'bg-signal',
  ACQUIRED: 'bg-bone',
  LOCKED: 'bg-lock',
  TRACK_LOST: 'bg-fault',
}

/**
 * The only state animation in the product: on a state change a 1px coloured
 * line sweeps once across the top of the affected column.
 */
export function SweepLine({ state, className }: { state: TrackState; className?: string }) {
  const [run, setRun] = useState(0)
  const previous = useRef(state)

  useEffect(() => {
    if (previous.current !== state) {
      previous.current = state
      setRun((n) => n + 1)
    }
  }, [state])

  return (
    <span aria-hidden className={cx('block h-px w-full', className)}>
      <span
        key={run}
        className={cx('block h-px w-full', TONE[state])}
        style={
          run === 0
            ? { opacity: 0 }
            : { animation: 'netra-sweep 700ms var(--ease-signal) 1 both' }
        }
      />
    </span>
  )
}

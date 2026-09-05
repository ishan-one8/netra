import type { TrackState } from '../../sim/types'
import { cx } from '../../lib/cx'

const LABEL: Record<TrackState, string> = {
  SEARCHING: 'SEARCHING',
  ACQUIRED: 'ACQUIRED',
  LOCKED: 'LOCKED',
  TRACK_LOST: 'TRACK LOST',
}

const TONE: Record<TrackState, { dot: string; text: string }> = {
  SEARCHING: { dot: 'bg-signal', text: 'text-signal' },
  ACQUIRED: { dot: 'bg-bone', text: 'text-bone' },
  LOCKED: { dot: 'bg-lock', text: 'text-lock' },
  TRACK_LOST: { dot: 'bg-fault', text: 'text-fault' },
}

type Props = {
  state: TrackState
  className?: string
}

/**
 * Sits outside the viewport, in the void. A dot and a word — no pill, no
 * border, no banner.
 */
export function StatusChip({ state, className }: Props) {
  const tone = TONE[state]
  return (
    <div
      className={cx('inline-flex items-center gap-12', className)}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden className={cx('size-[6px] rounded-full', tone.dot)} />
      <span className={cx('font-mono text-telemetry uppercase tracking-label', tone.text)}>
        {LABEL[state]}
      </span>
    </div>
  )
}

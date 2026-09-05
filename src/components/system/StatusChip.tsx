import type { TrackState } from '../../sim/types'
import { GlassBadge } from './GlassBadge'
import { cx } from '../../lib/cx'

const LABEL: Record<TrackState, string> = {
  SEARCHING: 'Searching',
  ACQUIRED: 'Acquired',
  LOCKED: 'Locked',
  TRACK_LOST: 'Track lost',
}

/**
 * The system carries no chromatic colour, so state is told by tone and form
 * rather than hue: cream reads as lamplight on a live link, white as a held
 * candidate, smoke as still looking, and a hollow ring as nothing there.
 */
const DOT: Record<TrackState, 'cream' | 'white' | 'smoke' | 'hollow'> = {
  SEARCHING: 'smoke',
  ACQUIRED: 'white',
  LOCKED: 'cream',
  TRACK_LOST: 'hollow',
}

export function StatusChip({ state, className }: { state: TrackState; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={cx('inline-flex', className)}>
      <GlassBadge dot={DOT[state]} className={state === 'SEARCHING' ? 'netra-pulse' : undefined}>
        {LABEL[state]}
      </GlassBadge>
    </span>
  )
}

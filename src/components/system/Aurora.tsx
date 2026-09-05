import { cx } from '../../lib/cx'

/**
 * The optical bloom behind the hero — three blurred fields drifting on unequal
 * periods, so the composition never lands in the same place twice. It reads as
 * light through a lens rather than as a gradient, which is the whole point.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx('aurora grain', className)}>
      <span className="aurora-blob aurora-blob-1" />
      <span className="aurora-blob aurora-blob-2" />
      <span className="aurora-blob aurora-blob-3" />
    </div>
  )
}

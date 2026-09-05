import { cx } from '../../lib/cx'

/**
 * A single soft field behind a section — much weaker than the hero's bloom, so
 * the page keeps moving as you scroll without competing for attention.
 */
export function SectionGlow({ side = 'left' }: { side?: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className={cx('section-glow', side === 'left' ? 'section-glow-left' : 'section-glow-right')}
    >
      <span />
    </div>
  )
}

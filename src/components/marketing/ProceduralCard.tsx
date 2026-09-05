import { LinkField } from '../canvas/LinkField'
import { GlassBadge } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  badge: string
  title: string
  body: string
  className?: string
}

/**
 * The cinematic media card, with procedural imagery where a photograph would
 * normally sit — this product has no photography, and stock would read as
 * borrowed. Badge top-right, headline bottom-left over the scrim.
 */
export function ProceduralCard({ badge, title, body, className }: Props) {
  return (
    <article className={cx('flex flex-col gap-20', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-charcoal">
        <LinkField verticalCenter={0.42} />
        <span aria-hidden className="scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/5" />
        <span className="absolute top-16 right-16">
          <GlassBadge>{badge}</GlassBadge>
        </span>
        <h3 className="absolute bottom-16 left-16 max-w-[20ch] text-card font-medium text-pure-white">
          {title}
        </h3>
      </div>
      <p className="text-body text-smoke">{body}</p>
    </article>
  )
}

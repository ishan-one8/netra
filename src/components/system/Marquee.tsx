import { cx } from '../../lib/cx'

type Props = {
  items: readonly string[]
  className?: string
}

/**
 * The one long-duration motion in the system: a 45s linear crawl. Used for a
 * flat strip of specification values, never for anything a reader must catch.
 */
export function Marquee({ items, className }: Props) {
  const doubled = [...items, ...items]

  return (
    <div className={cx('w-full overflow-x-clip', className)} aria-hidden>
      <div className="netra-marquee-track">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-40 pr-40 text-label font-medium uppercase text-smoke whitespace-nowrap"
          >
            {item}
            <span className="size-[3px] rounded-full bg-graphite" />
          </span>
        ))}
      </div>
    </div>
  )
}

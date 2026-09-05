import { cx } from '../../lib/cx'

export function Marquee({ items, className }: { items: readonly string[]; className?: string }) {
  const doubled = [...items, ...items]

  return (
    <div className={cx('w-full overflow-x-clip', className)} aria-hidden>
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-32 pr-32 font-mono text-caption whitespace-nowrap text-ink-faint"
          >
            {item}
            <span className="size-[3px] rounded-full bg-rule-strong" />
          </span>
        ))}
      </div>
    </div>
  )
}

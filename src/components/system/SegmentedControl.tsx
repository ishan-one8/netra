import { cx } from '../../lib/cx'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/**
 * A recessed track with one lifted pill. The pill travels to the option you
 * pick rather than appearing there.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const width = 100 / options.length

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('segment-track flex gap-2 rounded-full border border-rule bg-paper p-2', className)}
    >
      <span
        aria-hidden
        className="segment-indicator"
        style={{
          width: `calc(${width}% - 4px)`,
          transform: `translateX(calc(${index * 100}% + ${index * 4}px + 2px))`,
          left: 0,
        }}
      />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'relative z-[1] inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full px-8',
              'text-caption font-medium transition-colors duration-200 ease-out',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

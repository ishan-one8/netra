import { cx } from '../../lib/cx'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/** A recessed track; the active option is the one lifted onto white. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('flex gap-2 rounded-full border border-rule bg-paper p-2', className)}
    >
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
              'inline-flex min-h-[40px] flex-1 items-center justify-center rounded-full px-12',
              'text-caption font-medium transition-all duration-200 ease-out',
              active
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

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
 * A row of text options 24px apart. Ash inactive, bone active with a 1px beam
 * underline. No pill, no container.
 */
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
      className={cx('flex flex-wrap items-center gap-24', className)}
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
              'inline-flex min-h-[44px] items-center border-b text-label font-regular tracking-label transition-colors duration-200',
              active ? 'border-beam text-bone' : 'border-transparent text-ash hover:text-bone',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

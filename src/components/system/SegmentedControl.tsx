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
 * A row of pills. The active one takes the ghost outline; cream stays reserved
 * for the single primary action on the page.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('flex flex-wrap gap-8', className)}>
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
              'inline-flex min-h-[44px] items-center rounded-full border px-20 text-body',
              'font-medium transition-colors duration-[250ms] ease-sequel',
              active
                ? 'border-pure-white text-pure-white'
                : 'border-transparent text-smoke hover:text-pure-white',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

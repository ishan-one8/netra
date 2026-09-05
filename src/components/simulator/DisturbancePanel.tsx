import { Label } from '../system'
import { cx } from '../../lib/cx'

export type Toggle = {
  key: string
  label: string
  detail: string
  active: boolean
  onToggle: () => void
}

/** Switches that put the loop under stress, each saying what it actually does. */
export function DisturbancePanel({ toggles, className }: { toggles: Toggle[]; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-12', className)}>
      <Label>Disturbance injection</Label>
      <div className="flex flex-col gap-8">
        {toggles.map((t) => (
          <button
            key={t.key}
            type="button"
            role="switch"
            aria-checked={t.active}
            onClick={t.onToggle}
            className={cx(
              'flex min-h-[44px] items-center gap-12 rounded-md border px-12 py-8 text-left',
              'transition-colors duration-200 ease-out',
              t.active
                ? 'border-beam bg-beam-wash'
                : 'border-rule bg-surface hover:border-rule-strong',
            )}
          >
            <span
              aria-hidden
              className={cx(
                'relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200',
                t.active ? 'bg-beam' : 'bg-rule-strong',
              )}
            >
              <span
                className={cx(
                  'absolute top-[2px] size-[14px] rounded-full bg-surface shadow-xs transition-all duration-200 ease-out',
                  t.active ? 'left-[16px]' : 'left-[2px]',
                )}
              />
            </span>
            <span className="flex flex-col">
              <span className={cx('text-small font-medium', t.active ? 'text-beam' : 'text-ink')}>
                {t.label}
              </span>
              <span className="text-caption text-ink-muted">{t.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

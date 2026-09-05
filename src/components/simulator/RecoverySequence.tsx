import type { Recovery } from '../../sim/types'
import { Label } from '../system'
import { cx } from '../../lib/cx'

const STEPS = [
  { name: 'Tracking', detail: 'boresight holding' },
  { name: 'Target lost', detail: 'return below floor' },
  { name: 'Searching', detail: 'spiral scan' },
  { name: 'Detected', detail: 'candidate gated' },
  { name: 'Re-acquired', detail: 'lock restored' },
] as const

/**
 * The loss-and-recovery cycle, driven by the state machine rather than drawn
 * alongside it. Each step records how long it took from the moment the target
 * was lost, so the sequence is evidence and not an illustration.
 */
export function RecoverySequence({
  recovery,
  className,
}: {
  recovery: Recovery
  className?: string
}) {
  const { stage, timings, cycles } = recovery
  const progress = stage / (STEPS.length - 1)

  return (
    <div className={cx('flex flex-col gap-16', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-8">
        <Label>Recovery sequence</Label>
        <span className="font-mono text-hud text-ink-faint">
          {cycles === 0 ? 'no loss yet this run' : `${cycles} completed`}
        </span>
      </div>

      <div className="relative">
        {/* The rail the sequence advances along. */}
        <span
          aria-hidden
          className="absolute top-[9px] right-0 left-0 h-px bg-rule"
        />
        <span
          aria-hidden
          className="absolute top-[9px] left-0 h-px bg-beam transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />

        <ol className="relative grid grid-cols-5 gap-4">
          {STEPS.map((step, i) => {
            const done = i < stage
            const active = i === stage
            return (
              <li key={step.name} className="flex flex-col gap-8">
                <span
                  aria-hidden
                  className={cx(
                    'block size-[18px] rounded-full border-2 bg-paper transition-all duration-300 ease-out',
                    done && 'border-beam bg-beam',
                    active && 'border-beam bg-paper scale-110',
                    !done && !active && 'border-rule-strong',
                  )}
                />
                <span
                  className={cx(
                    'text-caption font-medium transition-colors duration-300',
                    active ? 'text-beam' : done ? 'text-ink' : 'text-ink-faint',
                  )}
                >
                  {step.name}
                </span>
                <span className="font-mono text-hud text-ink-faint">
                  {timings[i] !== null && i > 0
                    ? `+${timings[i]!.toFixed(2)}s`
                    : i === 0
                      ? step.detail
                      : '—'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <p className="text-caption text-ink-muted">
        Turn on <span className="text-ink">beacon dropout</span> to watch the loop lose the
        terminal and bring it back without an operator.
      </p>
    </div>
  )
}

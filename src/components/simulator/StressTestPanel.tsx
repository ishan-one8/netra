import { PHASES, THRESHOLDS, type Report } from '../../sim/useStressTest'
import { Button, Label } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  running: boolean
  phaseIndex: number
  progress: number
  report: Report | null
  totalSeconds: number
  onStart: () => void
  onCancel: () => void
}

/**
 * Eight adversarial phases, fixed thresholds published before the run, and a
 * verdict at the end. This is what turns a demo into evidence.
 */
export function StressTestPanel({
  running,
  phaseIndex,
  progress,
  report,
  totalSeconds,
  onStart,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex flex-col gap-4">
          <Label tone="beam">Automated evaluation</Label>
          <p className="text-small text-ink-muted">
            {PHASES.length} phases · {totalSeconds}s · thresholds fixed before the run
          </p>
        </div>
        {running ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel run
          </Button>
        ) : (
          <Button onClick={onStart}>{report ? 'Run again' : 'Run stress test'}</Button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <span aria-hidden className="block h-[3px] w-full rounded-full bg-rule">
          <span
            className="block h-[3px] rounded-full bg-beam transition-[width] duration-200 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </span>
        <div className="flex flex-wrap gap-4">
          {PHASES.map((p, i) => {
            const result = report?.results[i]
            const active = running && i === phaseIndex
            return (
              <span
                key={p.id}
                title={p.detail}
                className={cx(
                  'inline-flex items-center gap-4 rounded-full border px-8 py-2 font-mono text-hud',
                  active && 'border-beam bg-beam-wash text-beam',
                  !active && result?.pass && 'border-rule bg-surface text-lock',
                  !active && result && !result.pass && 'border-rule bg-surface text-fault',
                  !active && !result && 'border-rule bg-surface text-ink-faint',
                )}
              >
                {p.id} {p.name}
              </span>
            )
          })}
        </div>
      </div>

      <p className="text-caption text-ink-muted">
        Pass bars, identical for every phase — mean ≤{' '}
        <span className="font-mono text-ink">{THRESHOLDS.meanMrad} mrad</span> and peak ≤{' '}
        <span className="font-mono text-ink">{THRESHOLDS.maxMrad} mrad</span> measured{' '}
        <em>while locked</em>, and lock retention ≥{' '}
        <span className="font-mono text-ink">{THRESHOLDS.lockRetention}%</span> across the whole
        phase. No phase gets an easier bar.
      </p>

      {report ? (
        <div className="flex flex-col gap-16">
          <div
            className={cx(
              'flex flex-wrap items-baseline gap-12 rounded-md border px-16 py-12',
              report.verdict === 'PASS'
                ? 'border-rule bg-surface'
                : 'border-fault bg-surface',
            )}
          >
            <span
              className={cx(
                'font-mono text-title font-medium',
                report.verdict === 'PASS' ? 'text-lock' : 'text-fault',
              )}
            >
              {report.verdict}
            </span>
            <span className="text-small text-ink-muted">
              {report.passed} of {report.total} phases within thresholds · mean{' '}
              {report.meanMrad.toFixed(1)} mrad · worst {report.worstMrad.toFixed(1)} mrad
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-rule text-left">
                  {['Phase', 'Mean (locked)', 'Peak (locked)', 'Retention', 'Result'].map((h) => (
                    <th key={h} className="pb-8">
                      <Label>{h}</Label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.phase.id} className="border-b border-rule last:border-0">
                    <td className="py-12 pr-16 text-small text-ink">
                      <span className="font-mono text-ink-faint">{r.phase.id}</span> {r.phase.name}
                    </td>
                    <td className="py-12 pr-16 font-mono text-caption text-ink-muted">
                      {r.meanMrad.toFixed(1)} mrad
                    </td>
                    <td className="py-12 pr-16 font-mono text-caption text-ink-muted">
                      {r.maxMrad.toFixed(1)} mrad
                    </td>
                    <td className="py-12 pr-16 font-mono text-caption text-ink-muted">
                      {r.lockRetention.toFixed(0)}%
                    </td>
                    <td className="py-12">
                      <span
                        className={cx(
                          'font-mono text-hud font-medium',
                          r.pass ? 'text-lock' : 'text-fault',
                        )}
                      >
                        {r.pass ? 'PASS' : `FAIL · ${r.failed.join(', ')}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-small text-ink-muted">
          {running
            ? `Phase ${PHASES[phaseIndex]?.id} — ${PHASES[phaseIndex]?.detail}`
            : 'The report appears here once all eight phases have run.'}
        </p>
      )}
    </div>
  )
}

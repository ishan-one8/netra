import { Label, Reveal } from '../system'
import results from '../../sim/bench-results.json'

/**
 * The receipt for every number this site quotes.
 *
 * Not typed by hand: `npm run bench -- --emit` writes the JSON this reads, so
 * a claim that drifts from the code shows up as a diff rather than as a
 * sentence nobody checked. The failures are here too — a table where every row
 * passes is a table nobody believes.
 */
export function BenchTable() {
  const { scenarios, thresholds, generated } = results

  return (
    <Reveal>
      <div className="glass-card overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-12 border-b border-rule px-20 py-16">
          <Label tone="beam">npm run bench · {scenarios.length} scenarios</Label>
          <span className="font-mono text-hud text-ink-faint">
            pass = mean ≤ {thresholds.meanLockedMrad} mrad while locked · lock ≥{' '}
            {thresholds.retentionPct}% · {generated}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {['Scenario', 'Mean', 'Peak', 'Mean locked', 'Lock', 'Acquire', ''].map((h, i) => (
                  <th
                    key={h || i}
                    className={
                      'px-20 py-12 font-mono text-hud uppercase tracking-label text-ink-faint ' +
                      (i === 0 ? 'text-left' : 'text-right')
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.name} className="border-b border-rule/60 last:border-0">
                  <td className="px-20 py-12 text-small text-ink">{s.name}</td>
                  <td className="px-20 py-12 text-right font-mono text-caption text-ink-muted">
                    {s.mean.toFixed(1)}
                  </td>
                  <td className="px-20 py-12 text-right font-mono text-caption text-ink-muted">
                    {s.peak.toFixed(1)}
                  </td>
                  {/* The column that matters: accuracy while it claims a lock. */}
                  <td className="px-20 py-12 text-right font-mono text-caption font-medium text-ink">
                    {s.meanLocked.toFixed(1)}
                  </td>
                  <td className="px-20 py-12 text-right font-mono text-caption text-ink-muted">
                    {s.retention}%
                  </td>
                  <td className="px-20 py-12 text-right font-mono text-caption text-ink-muted">
                    {s.acquisitionS.toFixed(2)}s
                  </td>
                  <td className="px-20 py-12 text-right">
                    <span
                      className={
                        'inline-flex items-center gap-6 font-mono text-hud uppercase tracking-label ' +
                        (s.pass ? 'text-lock' : 'text-fault')
                      }
                    >
                      <span
                        aria-hidden
                        className={
                          'size-[5px] rounded-full ' + (s.pass ? 'bg-lock' : 'bg-fault')
                        }
                      />
                      {s.pass ? 'hold' : 'weak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-rule px-20 py-12 text-caption text-ink-muted">
          Errors in milliradians. <span className="text-ink">Mean</span> and{' '}
          <span className="text-ink">peak</span> cover the whole run including the seconds a
          dropout has the beacon hidden, which is why Dropout and Combined read high there and
          low under lock.
        </p>
      </div>
    </Reveal>
  )
}

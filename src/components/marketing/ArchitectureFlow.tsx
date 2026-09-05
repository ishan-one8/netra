import { Label } from '../system'
import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

const BLOCKS = [
  { id: '01', name: 'Virtual environment', detail: 'Moving terminal, decoy sources, atmosphere' },
  { id: '02', name: 'Virtual camera', detail: '24° × 16° FOV, 1280 px, mount vibration' },
  { id: '03', name: 'Frame processing', detail: 'Intensity map, blob extraction, noise handling' },
  { id: '04', name: 'Beacon detection', detail: 'Candidate proposal with a confidence score' },
  { id: '05', name: 'Association', detail: 'Gate against the track; reject decoys' },
  { id: '06', name: 'State estimation', detail: 'Position and velocity from noisy measurements' },
  { id: '07', name: 'Prediction', detail: 'Lead the target instead of lagging it' },
  { id: '08', name: 'Gimbal controller', detail: 'Rate-limited pan/tilt, 22°/s slew ceiling' },
  { id: '09', name: 'Evidence logger', detail: 'Error, lock retention, timing, verdict' },
] as const

/**
 * The signal path, block by block. Each block is a module boundary, so a stage
 * can be swapped for a hardware interface without redesigning the rest.
 */
export function ArchitectureFlow() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 })

  return (
    <div ref={ref} className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {BLOCKS.map((b, i) => (
        <div
          key={b.id}
          className={cx(
            'flex flex-col gap-8 rounded-md border border-rule bg-surface p-16',
            'transition-all duration-500 ease-out',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[12px]',
          )}
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-8">
            <span className="font-mono text-hud font-medium text-beam">{b.id}</span>
            <Label>{i === BLOCKS.length - 1 ? 'Output' : `Stage ${b.id}`}</Label>
          </div>
          <h3 className="text-small font-medium text-ink">{b.name}</h3>
          <p className="text-caption text-ink-muted">{b.detail}</p>
        </div>
      ))}
    </div>
  )
}

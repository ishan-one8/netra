import { Label, Reveal, SectionGlow } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  id?: string
  label?: string
  children: React.ReactNode
  surface?: 'paper' | 'surface' | 'warm' | 'cool'
  /** A soft field behind the section, alternating side to side down the page. */
  glow?: 'left' | 'right' | false
  className?: string
}

export function Section({
  id,
  label,
  children,
  surface = 'paper',
  glow = false,
  className,
}: Props) {
  return (
    <section
      id={id}
      className={cx(
        'relative w-full scroll-mt-64 overflow-hidden py-64 lg:py-96',
        surface === 'surface' && 'border-y border-rule bg-veil',
        surface === 'warm' && 'border-y border-rule bg-veil-warm',
        surface === 'cool' && 'border-y border-rule bg-veil-cool',
        className,
      )}
    >
      {glow ? <SectionGlow side={glow} /> : null}
      <div className="page-wide relative flex flex-col gap-40">
        {label ? (
          <Reveal>
            <Label tone="beam">{label}</Label>
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  )
}

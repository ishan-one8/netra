import { Label, Reveal } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  id?: string
  label?: string
  children: React.ReactNode
  surface?: 'paper' | 'surface'
  className?: string
}

export function Section({ id, label, children, surface = 'paper', className }: Props) {
  return (
    <section
      id={id}
      className={cx(
        'w-full scroll-mt-64 py-64 lg:py-96',
        surface === 'surface' && 'border-y border-rule bg-surface',
        className,
      )}
    >
      <div className="page-wide flex flex-col gap-40">
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

import { Label, Reveal } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  id?: string
  label?: string
  children: React.ReactNode
  /** Charcoal turns the whole section into an elevated surface. */
  surface?: 'void' | 'charcoal'
  className?: string
}

/**
 * Full-bleed on the canvas, content bounded to 1200px, 96–120px of vertical
 * breathing room. Sections alternate between the void and a charcoal surface.
 */
export function Section({ id, label, children, surface = 'void', className }: Props) {
  return (
    <section
      id={id}
      className={cx(
        'w-full py-96 lg:py-120',
        surface === 'charcoal' && 'bg-charcoal',
        className,
      )}
    >
      <div className="page flex flex-col gap-40">
        {label ? (
          <Reveal>
            <Label rule>{label}</Label>
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  )
}

import { EyebrowLabel } from '../system'
import { cx } from '../../lib/cx'

type Props = {
  id?: string
  eyebrow: string
  children: React.ReactNode
  /** The second column. Marketing sections alternate which side it lands on. */
  aside?: React.ReactNode
  flip?: boolean
  className?: string
}

/**
 * The marketing rhythm: full-bleed on void, content bounded to the page width,
 * two asymmetric columns that alternate side to side, 60–120px apart. Structure
 * comes from the eyebrow and its hairline, never from a panel.
 */
export function Section({ id, eyebrow, children, aside, flip = false, className }: Props) {
  return (
    <section id={id} className={cx('w-full py-60 lg:py-96', className)}>
      <div className="page">
        <EyebrowLabel rule className="mb-36">
          {eyebrow}
        </EyebrowLabel>

        <div
          className={cx(
            'grid gap-36 lg:gap-60',
            aside ? 'lg:grid-cols-12' : 'lg:grid-cols-1',
          )}
        >
          <div
            className={cx(
              aside && 'lg:col-span-7',
              aside && flip && 'lg:order-2 lg:col-start-6',
            )}
          >
            {children}
          </div>
          {aside ? (
            <div className={cx('lg:col-span-5', flip && 'lg:order-1 lg:col-start-1')}>{aside}</div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

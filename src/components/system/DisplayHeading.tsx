import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Props = {
  /** The sentence, with the payoff word written plainly inside it. */
  text: string
  /** The single word swapped to the display serif, always italic, always lowercase. */
  accent: string
  size?: 'subheading' | 'heading' | 'heading-lg' | 'display'
  as?: 'h1' | 'h2'
  /** Assemble word by word on first sight. */
  kinetic?: boolean
  className?: string
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  subheading: 'text-subheading font-light',
  heading: 'text-heading font-light',
  'heading-lg': 'text-subheading font-medium sm:text-heading-lg',
  display: 'text-heading font-medium sm:text-heading-lg xl:text-display',
}

/**
 * The signature headline: hairline sans prose carrying one italic serif word —
 * the emotional payoff. Never all-caps, never coloured, never decorated.
 */
export function DisplayHeading({
  text,
  accent,
  size = 'heading',
  as = 'h2',
  kinetic = true,
  className,
}: Props) {
  const { ref, inView } = useInView<HTMLHeadingElement>({ threshold: 0.25 })
  const Tag = as
  const words = text.split(' ')

  return (
    <Tag ref={ref} className={cx(SIZE[size], 'text-pure-white', className)}>
      {words.map((word, i) => {
        const bare = word.replace(/[.,]/g, '')
        const isAccent = bare.toLowerCase() === accent.toLowerCase()
        const trailing = word.slice(bare.length)

        return (
          <span
            key={`${word}-${i}`}
            className={cx('netra-word', (!kinetic || inView) && 'is-in')}
            style={kinetic ? { transitionDelay: `${i * 45}ms` } : undefined}
          >
            {isAccent ? (
              <>
                <span className="font-bradford italic">{bare}</span>
                {trailing}
              </>
            ) : (
              word
            )}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </Tag>
  )
}

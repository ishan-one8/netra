import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Size = 'title' | 'sm' | 'md' | 'lg' | 'display' | 'hero'

type Props = {
  text: string
  /** One word rendered in the beam colour. The only coloured type in the system. */
  accent?: string
  size?: Size
  as?: 'h1' | 'h2' | 'h3'
  kinetic?: boolean
  /** Renders the accent word lit by the aurora rather than in flat beam. */
  gradient?: boolean
  className?: string
}

const SIZE: Record<Size, string> = {
  title: 'text-title',
  sm: 'text-heading-sm',
  md: 'text-heading-sm sm:text-heading',
  lg: 'text-heading sm:text-heading-lg',
  display: 'text-heading sm:text-heading-lg xl:text-display',
  hero: 'text-heading-sm sm:text-heading-lg lg:text-display xl:text-display-xl',
}

/**
 * Headlines assemble word by word on first sight. Weight and tracking never
 * change on the way in — only opacity and a little travel.
 */
export function Heading({
  text,
  accent,
  size = 'md',
  as = 'h2',
  kinetic = true,
  gradient = false,
  className,
}: Props) {
  const { ref, inView } = useInView<HTMLHeadingElement>({ threshold: 0.25 })
  const Tag = as
  const words = text.split(' ')

  return (
    <Tag
      ref={ref}
      className={cx(SIZE[size], 'font-medium text-ink', className)}
    >
      {words.map((word, i) => {
        const bare = word.replace(/[.,—]/g, '')
        const isAccent = Boolean(accent) && bare.toLowerCase() === accent!.toLowerCase()
        return (
          <span
            key={`${word}-${i}`}
            className={cx(
              'reveal-word',
              (!kinetic || inView) && 'is-in',
              isAccent && (gradient ? 'text-gradient' : 'text-beam'),
            )}
            style={kinetic ? { transitionDelay: `${i * 40}ms` } : undefined}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </Tag>
  )
}

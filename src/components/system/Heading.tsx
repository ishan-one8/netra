import { useInView } from '../../lib/useInView'
import { cx } from '../../lib/cx'

type Size = 'title' | 'sm' | 'md' | 'lg' | 'display' | 'hero'

type Props = {
  /** Newlines are honoured as line breaks, and each line reveals on its own. */
  text: string
  /** One word lit by the aurora rather than set in flat ink. */
  accent?: string
  size?: Size
  as?: 'h1' | 'h2' | 'h3'
  kinetic?: boolean
  gradient?: boolean
  /** Light type for the night section. */
  tone?: 'ink' | 'light'
  className?: string
}

const SIZE: Record<Size, string> = {
  title: 'text-title',
  sm: 'text-heading-sm',
  md: 'text-heading-sm sm:text-heading',
  lg: 'text-heading sm:text-heading-lg',
  display: 'text-heading-sm sm:text-heading lg:text-heading-lg xl:text-display',
  hero: 'text-heading sm:text-heading-lg lg:text-display xl:text-display-xl',
}

/**
 * Headlines rise a line at a time out of their own edge, clipped rather than
 * faded. Weight and tracking never change on the way in.
 */
export function Heading({
  text,
  accent,
  size = 'md',
  as = 'h2',
  kinetic = true,
  gradient = false,
  tone = 'ink',
  className,
}: Props) {
  const { ref, inView } = useInView<HTMLHeadingElement>({ threshold: 0.2 })
  const Tag = as
  const lines = text.split('\n')
  const shown = !kinetic || inView

  return (
    <Tag
      ref={ref}
      className={cx(
        'font-display font-medium text-balance',
        SIZE[size],
        tone === 'light' ? 'text-surface' : 'text-ink',
        className,
      )}
    >
      {lines.map((line, li) => (
        <span key={`${line}-${li}`} className="line-mask">
          <span
            className={cx('line-rise', shown && 'is-in')}
            style={{ transitionDelay: `${li * 110}ms` }}
          >
            {line.split(' ').map((word, wi) => {
              const bare = word.replace(/[.,—]/g, '')
              const isAccent = Boolean(accent) && bare.toLowerCase() === accent!.toLowerCase()
              return (
                <span key={`${word}-${wi}`} className={cx(isAccent && (gradient ? 'text-gradient' : 'text-beam'))}>
                  {word}
                  {wi < line.split(' ').length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </span>
        </span>
      ))}
    </Tag>
  )
}

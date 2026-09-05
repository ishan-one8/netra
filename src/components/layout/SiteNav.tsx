import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { GhostLink, PrimaryAction } from '../system'
import { cx } from '../../lib/cx'

const LINKS = [
  { label: 'System', id: 'system' },
  { label: 'Pipeline', id: 'pipeline' },
  { label: 'Mission', id: 'mission' },
]

/**
 * Transparent over the hero, solid black once the page moves. Logo left, three
 * links centre, one cream pill right — no sidebar, no mega-menu, no search.
 */
export function SiteNav() {
  const { pathname } = useLocation()
  const onSimulator = pathname.startsWith('/simulator')

  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (onSimulator) return
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -50% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [onSimulator, pathname])

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-[250ms] ease-sequel',
        scrolled || onSimulator ? 'bg-void-black' : 'bg-transparent',
      )}
    >
      <nav className="page flex items-center justify-between gap-24 py-16">
        <a href="/" className="inline-flex items-center" aria-label="NETRA home">
          <LogoMark />
        </a>

        <div className="hidden items-center gap-24 md:flex">
          {onSimulator ? (
            <GhostLink to="/">Overview</GhostLink>
          ) : (
            LINKS.map((link) => (
              <GhostLink key={link.id} href={`#${link.id}`} active={active === link.id}>
                {link.label}
              </GhostLink>
            ))
          )}
        </div>

        {onSimulator ? (
          <GhostLink to="/" className="md:hidden">
            Overview
          </GhostLink>
        ) : (
          <PrimaryAction to="/simulator">Open the simulator</PrimaryAction>
        )}
      </nav>
    </header>
  )
}

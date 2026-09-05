import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { Button, NavLink } from '../system'
import { cx } from '../../lib/cx'

const LINKS = [
  { label: 'Problem', id: 'problem' },
  { label: 'System', id: 'system' },
  { label: 'Evidence', id: 'evidence' },
  { label: 'Architecture', id: 'architecture' },
  { label: 'Team', id: 'team' },
]

export function SiteNav() {
  const { pathname } = useLocation()
  const onSimulator = pathname.startsWith('/simulator')

  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (onSimulator) return
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [onSimulator, pathname])

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-all duration-300 ease-out',
        scrolled || onSimulator
          ? 'border-b border-rule bg-paper/70 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <nav className="page-wide flex items-center justify-between gap-24 py-12">
        <Link to="/" className="inline-flex items-center" aria-label="NETRA home">
          <LogoMark />
        </Link>

        <div className="hidden items-center gap-20 lg:flex">
          {onSimulator ? (
            <NavLink to="/">Overview</NavLink>
          ) : (
            LINKS.map((link) => (
              <NavLink key={link.id} href={`#${link.id}`} active={active === link.id}>
                {link.label}
              </NavLink>
            ))
          )}
        </div>

        {onSimulator ? (
          <Button to="/" variant="secondary">
            Back to overview
          </Button>
        ) : (
          <Button to="/simulator">Open simulator</Button>
        )}
      </nav>
    </header>
  )
}

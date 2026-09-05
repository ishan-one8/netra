import { useLocation } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { GhostLink } from '../system'

const LINKS = [
  { label: 'System', href: '#system' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Mission', href: '#mission' },
]

export function SiteNav() {
  const { pathname } = useLocation()
  const onSimulator = pathname.startsWith('/simulator')

  return (
    <header className="w-full">
      <nav className="page flex items-center justify-between gap-24 py-18">
        <a href="/" className="inline-flex items-center" aria-label="NETRA home">
          <LogoMark />
        </a>

        <div className="hidden items-center gap-30 md:flex">
          {onSimulator ? (
            <GhostLink to="/">Overview</GhostLink>
          ) : (
            LINKS.map((link) => (
              <GhostLink key={link.href} href={link.href}>
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
          <GhostLink to="/simulator">Simulator</GhostLink>
        )}
      </nav>
      <span aria-hidden className="block h-px w-full bg-hairline" />
    </header>
  )
}

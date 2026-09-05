import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteNav } from './components/layout/SiteNav'
import { SiteFooter } from './components/layout/SiteFooter'
import { Marketing } from './routes/Marketing'
import { Simulator } from './routes/Simulator'
import { ScrollProgress } from './components/system'
import { ScrollRocket } from './components/canvas/ScrollRocket'
import { Starfield } from './components/canvas/Starfield'
import { Moon } from './components/canvas/Moon'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* The field the whole site sits in. Fixed, behind every page. */}
      <Starfield />
      {/* The moon belongs to the landing page's sky. The console is a working
          instrument and does not want a light source behind its readouts. */}
      {pathname === '/' && <Moon />}
      <ScrollProgress />
      <ScrollRocket />

      <div className="site-shell flex min-h-screen flex-1 flex-col">
        {/* Said once, at the top, before anything is claimed. Translucent, so
            the sky it sits against carries through it. */}
        <div className="w-full border-b border-rule bg-surface/80 backdrop-blur-md">
          <p className="page-wide flex items-center justify-center gap-8 py-8 text-center font-mono text-hud uppercase tracking-label text-ink-muted">
            <span aria-hidden className="size-[5px] rounded-full bg-beam" />
            Software simulation · virtual camera and virtual beacon · no optical hardware involved
          </p>
        </div>

        <SiteNav />

        {/* Keyed so a route change fades rather than cuts. */}
        <div key={pathname} className="route-in flex-1">
          <Routes>
            <Route path="/" element={<Marketing />} />
            <Route path="/simulator" element={<Simulator />} />
          </Routes>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}

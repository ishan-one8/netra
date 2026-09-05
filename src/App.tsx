import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteNav } from './components/layout/SiteNav'
import { SiteFooter } from './components/layout/SiteFooter'
import { Marketing } from './routes/Marketing'
import { Simulator } from './routes/Simulator'
import { ScrollProgress } from './components/system'
import { ScrollRocket } from './components/canvas/ScrollRocket'
import { Starfield } from './components/canvas/Starfield'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* The field the whole site sits in. Fixed, behind every page. */}
      <Starfield />
      <ScrollProgress />
      <ScrollRocket />

      <div className="site-shell flex min-h-screen flex-1 flex-col">
        {/* Said once, at the top, before anything is claimed. */}
        <div className="w-full border-b border-rule bg-surface">
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

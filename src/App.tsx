import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteNav } from './components/layout/SiteNav'
import { SiteFooter } from './components/layout/SiteFooter'
import { Marketing } from './routes/Marketing'
import { Simulator } from './routes/Simulator'
import { ScrollProgress } from './components/system'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <ScrollProgress />
      {/* Said once, at the top, before anything is claimed. */}
      <div className="w-full border-b border-rule bg-ink">
        <p className="page-wide py-8 text-center font-mono text-hud uppercase tracking-label text-surface/70">
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
  )
}

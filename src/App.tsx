import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteNav } from './components/layout/SiteNav'
import { SiteFooter } from './components/layout/SiteFooter'
import { Marketing } from './routes/Marketing'
import { Simulator } from './routes/Simulator'

export default function App() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
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

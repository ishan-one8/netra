import { Route, Routes } from 'react-router-dom'
import { SiteNav } from './components/layout/SiteNav'
import { SiteFooter } from './components/layout/SiteFooter'
import { Marketing } from './routes/Marketing'
import { Simulator } from './routes/Simulator'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <SiteNav />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/simulator" element={<Simulator />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  )
}

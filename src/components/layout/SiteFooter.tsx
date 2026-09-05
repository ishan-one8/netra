import { LogoMark } from '../brand/LogoMark'
import { Hairline, Label, NavLink } from '../system'

export function SiteFooter() {
  return (
    <footer className="w-full pt-64 pb-48">
      <div className="page-wide flex flex-col gap-40">
        <Hairline />
        <div className="flex flex-col gap-32 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-[38ch] flex-col gap-12">
            <LogoMark />
            <p className="text-small text-ink-muted">
              A software virtual camera for pointing, acquisition and tracking — so coarse
              alignment can be developed and tested without the optical bench.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <Label>Problem statement</Label>
            <p className="font-mono text-caption text-ink">SIH26169</p>
            <p className="text-caption text-ink-muted">Indian Space Research Organisation</p>
            <p className="text-caption text-ink-muted">Smart Automation · Software</p>
          </div>

          <div className="flex flex-col gap-4">
            <Label>Explore</Label>
            <NavLink to="/simulator">Simulator</NavLink>
            <NavLink href="#problem">Problem</NavLink>
            <NavLink href="#pipeline">Pipeline</NavLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

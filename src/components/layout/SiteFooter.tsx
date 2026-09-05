import { DisplayHeading, GhostLink, Hairline, Label } from '../system'
import { LogoMark } from '../brand/LogoMark'

/** Closes on a display headline and a sparse row of links. */
export function SiteFooter() {
  return (
    <footer className="w-full pt-96 pb-64">
      <div className="page flex flex-col gap-64">
        <DisplayHeading text="The link, held." accent="held" size="heading" />

        <Hairline draw />

        <div className="flex flex-col gap-40 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-16">
            <LogoMark />
            <p className="max-w-[38ch] text-body text-smoke">
              Ground-support software for free-space optical communication. Beam alignment,
              simulated end to end, before the hardware exists.
            </p>
          </div>

          <div className="flex flex-col gap-12">
            <Label>Mission</Label>
            <p className="text-body text-pure-white">ISRO</p>
            <p className="text-body text-smoke">Smart India Hackathon 2026</p>
            <p className="tabular text-body text-smoke">PS 26169</p>
          </div>

          <div className="flex flex-col gap-4">
            <Label>Elsewhere</Label>
            <GhostLink to="/simulator">Simulator</GhostLink>
            <GhostLink href="#system">System</GhostLink>
            <GhostLink href="#pipeline">Pipeline</GhostLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

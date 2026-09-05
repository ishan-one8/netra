import { LogoMark } from '../brand/LogoMark'
import { EyebrowLabel, GhostLink } from '../system'

export function SiteFooter() {
  return (
    <footer className="w-full pb-60">
      <span aria-hidden className="block h-px w-full bg-hairline" />
      <div className="page flex flex-col gap-36 pt-60 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-18">
          <LogoMark />
          <p className="max-w-[34ch] text-caption font-extralight text-silver">
            Ground-support software for free-space optical communication. Beam alignment,
            simulated end to end, before the hardware exists.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          <EyebrowLabel>Mission</EyebrowLabel>
          <p className="font-mono text-log text-ash">ISRO · Smart India Hackathon 2026 · PS 26169</p>
        </div>

        <div className="flex flex-col gap-6">
          <EyebrowLabel>Elsewhere</EyebrowLabel>
          <GhostLink to="/simulator">Simulator</GhostLink>
          <GhostLink href="#system">System</GhostLink>
          <GhostLink href="#pipeline">Pipeline</GhostLink>
        </div>
      </div>
    </footer>
  )
}

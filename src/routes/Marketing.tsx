import { useState } from 'react'
import { LinkField } from '../components/canvas/LinkField'
import { ProceduralCard } from '../components/marketing/ProceduralCard'
import { Section } from '../components/layout/Section'
import {
  Card,
  DisplayHeading,
  GhostButton,
  Hairline,
  Label,
  Marquee,
  PipelineNode,
  PlayButton,
  PrimaryAction,
  Reveal,
  StatusChip,
  TelemetryReadout,
} from '../components/system'
import { useInView } from '../lib/useInView'
import type { TrackState } from '../sim/types'

const SPEC_STRIP = [
  'Residual 0.42 µrad RMS',
  'Loop rate 240 Hz',
  'Acquisition 1.8 s',
  'Link margin 6.4 dB',
  'Reacquisition 2.4 s',
  'Field of view 24°',
] as const

const CAPABILITIES = [
  {
    badge: 'Acquisition',
    title: 'Finding a beacon in a moving search volume',
    body: 'Scintillation, beam wander and platform jitter are modelled as first-class inputs, so the tracker is tuned against the conditions it will actually meet rather than a clean-room ideal.',
  },
  {
    badge: 'Reacquisition',
    title: 'What happens the moment the link breaks',
    body: 'Cloud transit breaks the beam on purpose. What matters is the path back — how fast the search volume collapses onto a lock once the return comes home.',
  },
] as const

const PIPELINE = [
  {
    index: '01',
    name: 'Frame ingest',
    detail: 'Sensor frames arrive at 240 Hz, dark-corrected and flat-fielded in place.',
  },
  {
    index: '02',
    name: 'Candidate search',
    detail: 'Thresholded blobs across the search volume become candidate detections.',
  },
  {
    index: '03',
    name: 'Association',
    detail: 'Candidates are scored against the track hypothesis and all but one are rejected.',
  },
  {
    index: '04',
    name: 'Kalman estimate',
    detail: 'State and covariance propagate forward to a predicted beacon position.',
  },
  {
    index: '05',
    name: 'Steering command',
    detail: 'Residual becomes a fine-steering mirror command inside the loop budget.',
  },
] as const

const MISSION = [
  ['Organisation', 'ISRO'],
  ['Programme', 'Smart India Hackathon 2026'],
  ['Problem statement', 'PS 26169'],
  ['Domain', 'Space technology'],
] as const

function PipelineItem({ node }: { node: (typeof PIPELINE)[number] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.5 })
  return (
    <div ref={ref} className="flex flex-col gap-20">
      <Hairline draw />
      <PipelineNode index={node.index} name={node.name} detail={node.detail} lit={inView} />
    </div>
  )
}

export function Marketing() {
  const [linkState, setLinkState] = useState<TrackState>('LOCKED')

  return (
    <main>
      {/* ---- Hero: the canvas is the fold ---------------------------------- */}
      <section className="relative flex min-h-svh w-full flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <LinkField parallax verticalCenter={0.28} onState={setLinkState} />
        </div>
        <span aria-hidden className="scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/5" />

        <div className="page relative flex flex-col gap-40 pt-96 pb-64">
          <div className="flex flex-col gap-24">
            <Reveal>
              <Label tone="white">ISRO · Smart India Hackathon 2026 · PS 26169</Label>
            </Reveal>

            <DisplayHeading
              as="h1"
              size="display"
              text="Lock the beam, before the hardware exists."
              accent="exists"
              className="max-w-[16ch]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-24">
            <Reveal delay={200}>
              <p className="max-w-[46ch] text-body-lg text-smoke">
                NETRA simulates the beacon, the atmosphere and the detector, then runs the real
                acquisition and tracking loop against them.
              </p>
            </Reveal>

            <div className="flex items-center gap-24">
              <StatusChip state={linkState} />
              <PlayButton label="Watch it lock" to="/simulator" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-graphite py-20">
        <Marquee items={SPEC_STRIP} />
      </div>

      {/* ---- System -------------------------------------------------------- */}
      <Section id="system" label="The system">
        <div className="flex flex-col gap-40 lg:flex-row lg:items-end lg:justify-between">
          <DisplayHeading
            size="heading-lg"
            text="An optical link is a pointing problem long before it is a data problem."
            accent="pointing"
            className="max-w-[18ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[44ch] text-body-lg text-smoke">
              A terminal has to hold a beam a few microradians wide on a target that keeps moving,
              through an atmosphere that keeps bending the path. Miss, and the link budget
              collapses to nothing.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-24 md:grid-cols-2">
          {CAPABILITIES.map((item, i) => (
            <Reveal key={item.badge} delay={i * 120}>
              <ProceduralCard badge={item.badge} title={item.title} body={item.body} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- Numbers ------------------------------------------------------- */}
      <Section label="Loop budget" surface="charcoal">
        <div className="grid gap-40 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Residual, RMS', value: 0.42, unit: 'µrad', decimals: 2 },
            { label: 'Acquisition', value: 1.8, unit: 's', decimals: 1 },
            { label: 'Loop rate', value: 240, unit: 'Hz', decimals: 0 },
            { label: 'Link margin', value: 6.4, unit: 'dB', decimals: 1 },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 100}>
              <TelemetryReadout {...item} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- Pipeline ------------------------------------------------------ */}
      <Section id="pipeline" label="Tracking pipeline">
        <DisplayHeading
          size="heading"
          text="Five stages, one frame at a time."
          accent="frame"
          className="max-w-[20ch]"
        />

        <div className="grid gap-40 lg:grid-cols-5 lg:gap-24">
          {PIPELINE.map((node) => (
            <PipelineItem key={node.index} node={node} />
          ))}
        </div>
      </Section>

      {/* ---- Mission ------------------------------------------------------- */}
      <Section id="mission" label="Mission context">
        <div className="grid gap-40 lg:grid-cols-2 lg:gap-64">
          <div className="flex flex-col gap-32">
            <DisplayHeading
              size="heading"
              text="Built to be flown against, not demonstrated once."
              accent="flown"
              className="max-w-[16ch]"
            />
            <Reveal delay={120}>
              <p className="max-w-[46ch] text-body-lg text-smoke">
                Every parameter maps to something a terminal engineer can measure — turbulence
                strength, platform jitter, detector gain, sweep rate. The event log is the record
                of what the tracker did, and why.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="flex flex-wrap items-center gap-16">
                <PrimaryAction to="/simulator">Open the simulator</PrimaryAction>
                <GhostButton href="#system">Read the system</GhostButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <Card className="p-32">
              <dl className="flex flex-col gap-24">
                {MISSION.map(([term, value]) => (
                  <div key={term} className="flex flex-col gap-4">
                    <dt className="text-label-sm font-medium uppercase text-smoke">{term}</dt>
                    <dd className="tabular text-body-lg text-pure-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        </div>
      </Section>
    </main>
  )
}

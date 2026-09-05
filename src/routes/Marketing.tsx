import { useEffect, useState } from 'react'
import { LinkField } from '../components/canvas/LinkField'
import { prefersReducedMotion } from '../lib/motion'
import { Section } from '../components/layout/Section'
import {
  EyebrowLabel,
  GhostLink,
  Hairline,
  PipelineNode,
  PrimaryAction,
  TelemetryReadout,
} from '../components/system'

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
]

const CAPABILITIES = [
  {
    title: 'Acquisition under turbulence',
    body: 'Scintillation, beam wander and platform jitter are modelled as first-class inputs, so the tracker is tuned against the conditions it will actually meet.',
  },
  {
    title: 'Occlusion and reacquisition',
    body: 'Cloud transit breaks the link on purpose. What matters is the reacquisition path — how fast the search volume collapses back onto a lock.',
  },
  {
    title: 'Estimator comparison',
    body: 'Centroid, Kalman and correlation trackers run against the same truth, so the loop-rate cost of accuracy is visible rather than argued.',
  },
]

export function Marketing() {
  const [lit, setLit] = useState(prefersReducedMotion ? PIPELINE.length - 1 : 0)

  useEffect(() => {
    if (prefersReducedMotion) return
    const id = window.setInterval(() => setLit((n) => (n + 1) % PIPELINE.length), 1600)
    return () => window.clearInterval(id)
  }, [])

  return (
    <main>
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="w-full pt-60 pb-60 lg:pt-96 lg:pb-96">
        <div className="page grid gap-60 lg:grid-cols-12 lg:items-center">
          <div className="flex flex-col gap-30 lg:col-span-7">
            <EyebrowLabel>ISRO · Smart India Hackathon 2026 · PS 26169</EyebrowLabel>

            <h1 className="text-heading-sm font-regular tracking-display text-bone sm:text-heading-lg xl:text-display">
              Lock the beam. Before the hardware exists.
            </h1>

            <p className="max-w-[52ch] text-body font-extralight text-silver">
              NETRA is ground-support software for free-space optical communication. It simulates
              the beacon, the atmosphere and the detector, then runs the real acquisition and
              tracking loop against them — so alignment is proven in software while the optical
              bench is still on order.
            </p>

            <div className="flex flex-wrap items-center gap-30">
              <PrimaryAction to="/simulator">Open simulator</PrimaryAction>
              <GhostLink href="#system">See the system</GhostLink>
            </div>
          </div>

          <div className="h-[260px] lg:col-span-5 lg:h-[420px]">
            <LinkField />
          </div>
        </div>
      </section>

      {/* ---- Numbers ------------------------------------------------------- */}
      <Section eyebrow="Loop budget">
        <div className="grid gap-36 sm:grid-cols-2 xl:grid-cols-4">
          <TelemetryReadout label="Residual, RMS" value={0.42} unit="µrad" decimals={2} />
          <TelemetryReadout label="Acquisition" value={1.8} unit="s" decimals={1} />
          <TelemetryReadout label="Loop rate" value={240} unit="Hz" decimals={0} />
          <TelemetryReadout label="Link margin" value={6.4} unit="dB" decimals={1} />
        </div>
      </Section>

      {/* ---- System -------------------------------------------------------- */}
      <Section
        id="system"
        eyebrow="The system"
        aside={
          <div className="flex flex-col gap-24">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="flex flex-col gap-12">
                <Hairline />
                <h3 className="text-heading-2xs font-regular text-bone">{item.title}</h3>
                <p className="text-caption font-extralight text-silver">{item.body}</p>
              </div>
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-30">
          <h2 className="text-heading-sm font-regular tracking-display text-bone lg:text-heading">
            An optical link is a pointing problem long before it is a data problem.
          </h2>
          <p className="max-w-[52ch] text-body font-extralight text-silver">
            A free-space optical terminal has to hold a beam a few microradians wide on a target
            that is moving, through an atmosphere that keeps bending the path. Miss, and the link
            budget collapses to nothing. NETRA closes that loop in simulation: truth, sensor,
            estimator and steering command, all instrumented, all inspectable.
          </p>
        </div>
      </Section>

      {/* ---- Pipeline ------------------------------------------------------ */}
      <Section id="pipeline" eyebrow="Tracking pipeline">
        <div className="flex flex-col gap-30">
          <h2 className="text-heading-sm font-regular tracking-display text-bone lg:text-heading">
            Five stages, one frame at a time.
          </h2>

          <div className="grid gap-36 lg:grid-cols-5 lg:gap-24">
            {PIPELINE.map((node, i) => (
              <div key={node.index} className="flex flex-col gap-24">
                <Hairline className="hidden lg:block" />
                <PipelineNode
                  index={node.index}
                  name={node.name}
                  detail={node.detail}
                  lit={i <= lit}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- Mission ------------------------------------------------------- */}
      <Section
        id="mission"
        eyebrow="Mission context"
        flip
        aside={
          <dl className="flex flex-col gap-24">
            {[
              ['Organisation', 'ISRO'],
              ['Programme', 'Smart India Hackathon 2026'],
              ['Problem statement', 'PS 26169'],
              ['Domain', 'Space technology'],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-col gap-6">
                <Hairline />
                <dt className="text-label font-regular tracking-label text-ash">{term}</dt>
                <dd className="font-mono text-telemetry text-bone">{value}</dd>
              </div>
            ))}
          </dl>
        }
      >
        <div className="flex flex-col gap-30">
          <h2 className="text-heading-sm font-regular tracking-display text-bone lg:text-heading">
            Built to be flown against, not demonstrated once.
          </h2>
          <p className="max-w-[52ch] text-body font-extralight text-silver">
            Every parameter in the simulator maps to something a terminal engineer can measure:
            turbulence strength, platform jitter, detector gain, search sweep rate. The event log
            is the record of what the tracker did and why, so a run can be argued about after the
            fact.
          </p>
          <GhostLink to="/simulator">Open the simulator</GhostLink>
        </div>
      </Section>
    </main>
  )
}

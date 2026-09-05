import { useState } from 'react'
import { LinkField } from '../components/canvas/LinkField'
import { OrbitalScene } from '../components/canvas/OrbitalScene'
import { LivePanel } from '../components/marketing/LivePanel'
import { ArchitectureFlow } from '../components/marketing/ArchitectureFlow'
import { Applications } from '../components/marketing/Applications'
import { TechStack } from '../components/marketing/TechStack'
import { Team } from '../components/marketing/Team'
import { Section } from '../components/layout/Section'
import {
  Aurora,
  StatusChip,
  Badge,
  Button,
  Card,
  Hairline,
  Heading,
  Label,
  Marquee,
  PipelineNode,
  Reveal,
  Spotlight,
} from '../components/system'
import { useInView } from '../lib/useInView'
import type { TrackState } from '../sim/types'
import { cx } from '../lib/cx'

const SPEC_STRIP = [
  'Gigabit-to-terabit data rates',
  'Licence-free spectrum',
  'Immune to electromagnetic interference',
  'Beam width measured in microradians',
  'Platforms: satellites, UAVs, ground stations',
  'Two-stage PAT: coarse, then fine',
] as const

const PROBLEM = [
  {
    title: 'The beam is thinner than the error',
    body: 'A few microradians wide. Ordinary pointing error is wider than the beam itself.',
  },
  {
    title: 'Both ends keep moving',
    body: 'Satellites, UAVs, vehicles. Everything drifts, and the terminal still has to stay in frame.',
  },
  {
    title: 'Testing it needs the hardware',
    body: 'Cameras, gimbals, optical benches. Every experiment costs weeks of schedule.',
  },
] as const

const SYSTEM = [
  {
    badge: 'Stage one',
    title: 'A virtual camera',
    body: 'Renders what the sensor would see. Irradiance, scintillation, vibration, noise, cloud.',
  },
  {
    badge: 'Stage two',
    title: 'A detector that learns',
    body: 'Finds the terminal in every frame. Throws away the stars, the glints, the reflections.',
  },
  {
    badge: 'Stage three',
    title: 'A loop that holds',
    body: 'Holds the track through noise and dropouts, then hands the lock to fine alignment.',
  },
] as const

const PIPELINE = [
  { index: '01', name: 'Detection', detail: 'Bright sources become scored candidates.' },
  { index: '02', name: 'Association', detail: 'Gated against the track. Decoys lose.' },
  { index: '03', name: 'Estimation', detail: 'Noise becomes position and velocity.' },
  { index: '04', name: 'Prediction', detail: 'Projected forward, so the gimbal leads.' },
  { index: '05', name: 'Steering', detail: 'A rate-limited command drives the boresight.' },
] as const

function PipelineItem({ node }: { node: (typeof PIPELINE)[number] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 })
  return (
    <div ref={ref} className="relative">
      <PipelineNode index={node.index} name={node.name} detail={node.detail} lit={inView} />
    </div>
  )
}

/** The rail the stages sit on, drawing itself once the row is in view. */
function PipelineRow({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 })
  return (
    <div ref={ref} className="relative">
      <span aria-hidden className={cx('flow-line hidden lg:block', inView && 'is-in')} />
      <div className="relative grid gap-32 lg:grid-cols-5 lg:gap-20">{children}</div>
    </div>
  )
}

export function Marketing() {
  const [linkState, setLinkState] = useState<TrackState>('LOCKED')

  return (
    <main>
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="relative flex min-h-[92svh] w-full flex-col justify-center overflow-hidden pt-64 pb-96">
        <Aurora className="opacity-70" />
        <div aria-hidden className="absolute inset-0">
          <OrbitalScene onState={setLinkState} />
        </div>
        <span aria-hidden className="hero-scrim" />
        <Spotlight />

        <div className="page-wide relative flex flex-col items-center gap-32 text-center">
          <Reveal>
            <Badge tone="beam">ISRO · Smart India Hackathon 2026 · PS 26169</Badge>
          </Reveal>

          <Heading
            as="h1"
            size="hero"
            gradient
            text={"Find the terminal.\nHold it in frame."}
            accent="frame"
            className="max-w-[14ch]"
          />

          <Reveal delay={180}>
            <p className="max-w-[52ch] text-body-lg text-ink-muted">
              Coarse alignment for mobile FSOC links, closed entirely in software. No camera, no
              gimbal, no optical bench.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="flex flex-wrap items-center justify-center gap-12">
              <Button to="/simulator" size="lg" variant="glow" arrow>
                Open the simulator
              </Button>
              <Button href="#problem" variant="secondary" size="lg">
                Why it is hard
              </Button>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="flex flex-wrap items-center justify-center gap-32">
              {[
                ['0.8', 'mrad', 'nominal pointing error'],
                ['20.9', 'mrad', 'lock window'],
                ['11 / 11', '', 'scenarios hold'],
              ].map(([value, unit, note]) => (
                <div key={note} className="flex flex-col items-center gap-2">
                  <span className="font-mono text-title font-medium text-ink">
                    {value}
                    {unit ? <span className="text-caption text-ink-faint"> {unit}</span> : null}
                  </span>
                  <span className="text-caption text-ink-muted">{note}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* The scene's own link state, so the drawing is labelled rather than decorative. */}
        <div className="page-wide pointer-events-none relative mt-40 flex justify-center">
          <StatusChip state={linkState} />
        </div>
      </section>

      {/* ---- The console, running ------------------------------------------ */}
      <Section label="The console, running" glow="right">
        <div className="flex flex-col gap-24 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="md"
            text={"This is not a screenshot.\nIt is the tracker."}
            accent="tracker"
            className="max-w-[20ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[44ch] text-small text-ink-muted">
              The same loop the simulator runs, on the same code, with decoys and dropouts switched
              on. Watch it lose the terminal and bring it back.
            </p>
          </Reveal>
        </div>
        <Reveal delay={160}>
          <LivePanel />
        </Reveal>
      </Section>

      <div className="border-y border-rule bg-surface py-16">
        <Marquee items={SPEC_STRIP} />
      </div>

      {/* ---- Problem ------------------------------------------------------- */}
      <Section id="problem" label="The problem" surface="warm" glow="left">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text={"Two stages decide the link.\nThe first is where it is lost."}
            accent="first"
            className="max-w-[20ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Coarse alignment is where the terminal has to find its partner and keep it in the
              camera's field of view. Get it wrong and fine alignment never runs.
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <Card variant="glass" className="overflow-hidden">
            <div className="h-[220px] w-full sm:h-[300px]">
              <LinkField verticalCenter={0.5} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-12 border-t border-glass-edge px-20 py-16">
              <p className="text-small text-ink-muted">
                Two terminals, one link. It holds, breaks under occlusion, and has to be
                reacquired — the cycle coarse alignment exists to survive.
              </p>
              <Label>Simulated link state · live</Label>
            </div>
          </Card>
        </Reveal>

        <div className="grid gap-16 md:grid-cols-3">
          {PROBLEM.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <Card variant="glass" interactive className="flex h-full flex-col gap-16 p-24">
                <span className="font-mono text-hud font-medium text-beam">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-title font-medium text-ink">{item.title}</h3>
                <p className="text-small text-ink-muted">{item.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- System -------------------------------------------------------- */}
      <Section id="system" label="The system" glow="right">
        <Heading
          size="lg"
          text={"The camera is simulated.\nThe tracking is not."}
          accent="not"
          className="max-w-[18ch]"
        />

        <div className="grid gap-16 lg:grid-cols-3">
          {SYSTEM.map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="h-full">
              <div className="glass-card glass-card-hover flex h-full flex-col gap-16 rounded-lg p-24 lg:p-32">
                <Badge tone="beam">{item.badge}</Badge>
                <h3 className="font-display text-title font-medium text-ink">{item.title}</h3>
                <p className="text-small text-ink-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <div className="glass-card flex flex-col gap-16 rounded-lg p-24 sm:flex-row sm:items-center sm:justify-between sm:p-32">
            <div className="flex flex-col gap-4">
              <Label tone="beam">Why it can be trained at all</Label>
              <p className="max-w-[62ch] text-small text-ink-muted">
                Every frame comes with the terminal's true position. The tool that tests the
                detector also generates its training set — perfectly labelled, unlimited.
              </p>
            </div>
            <Button to="/simulator" variant="secondary" arrow>
              See it running
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* ---- Pipeline ------------------------------------------------------ */}
      <Section id="pipeline" label="Tracking pipeline" glow="right">
        <Heading
          size="lg"
          text={"One frame in.\nOne command out."}
          accent="command"
          className="max-w-[20ch]"
        />
        <PipelineRow>
          {PIPELINE.map((node) => (
            <PipelineItem key={node.index} node={node} />
          ))}
        </PipelineRow>
      </Section>

      {/* ---- Evidence ------------------------------------------------------ */}
      <Section id="evidence" label="Evidence" surface="surface" glow="left">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text={"We publish the bar\nbefore we clear it."}
            accent="before"
            className="max-w-[18ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Thresholds are published before the run, not after. Every phase answers the same two
              questions: how well does it point while locked, and how long does it stay locked?
            </p>
          </Reveal>
        </div>

        <div className="grid gap-16 md:grid-cols-3">
          {[
            ['Mean pointing error', '≤ 14 mrad', 'measured while the loop reports lock'],
            ['Peak pointing error', '≤ 60 mrad', 'worst single sample while locked'],
            ['Lock retention', '≥ 60%', 'share of the whole phase spent locked'],
          ].map(([label, value, note], i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="glass-card glass-card-hover flex h-full flex-col gap-8 rounded-lg p-24">
                <Label>{label}</Label>
                <span className="font-mono text-heading-sm font-medium text-beam">{value}</span>
                <p className="text-caption text-ink-muted">{note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <div className="flex flex-wrap items-center gap-12">
            <Button to="/simulator" arrow variant="glow">
              Run the stress test
            </Button>
            <span className="text-caption text-ink-muted">
              Takes about 50 seconds in the browser.
            </span>
          </div>
        </Reveal>
      </Section>

      {/* ---- Architecture --------------------------------------------------- */}
      <Section id="architecture" label="System architecture" surface="cool" glow="left">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text={"Every block here has\na hardware twin waiting."}
            accent="twin"
            className="max-w-[18ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Every stage is a module boundary. Swap the virtual camera for a frame grabber and
              the controller for a servo driver — everything between them stays.
            </p>
          </Reveal>
        </div>
        <ArchitectureFlow />
      </Section>

      {/* ---- Technology ------------------------------------------------------ */}
      <Section id="technology" label="Technology" glow="right">
        <Heading
          size="lg"
          text={"Mature parts,\nno exotic frameworks."}
          accent="Mature"
          className="max-w-[18ch]"
        />
        <TechStack />
      </Section>

      {/* ---- Applications ---------------------------------------------------- */}
      <Section id="applications" label="Where it applies" surface="warm" glow="left">
        <Heading
          size="lg"
          text={"Anywhere a narrow beam has\nto follow a moving target."}
          accent="narrow"
          className="max-w-[20ch]"
        />
        <Applications />
        <Reveal delay={160}>
          <p className="max-w-[70ch] text-small text-ink-muted">
            These are the domains the loop applies to. NETRA is a simulation, not connected to any
            operational terminal.
          </p>
        </Reveal>
      </Section>

      {/* ---- Scope ------------------------------------------------------------ */}
      <Section id="scope" label="Scope" surface="cool" glow="right">
        <div className="grid gap-32 lg:grid-cols-2 lg:gap-64">
          <Heading
            size="md"
            text={"What is real here,\nand what is not."}
            accent="real"
            className="max-w-[16ch]"
          />
          <Reveal delay={120}>
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-8">
                <Label tone="beam">Real</Label>
                <p className="text-small text-ink-muted">
                  The tracking loop is genuine code running in your browser: detection, gating,
                  state estimation, prediction and a rate-limited gimbal controller. The metrics
                  are computed from that loop, and the stress test grades it against thresholds
                  fixed in the source.
                </p>
              </div>
              <Hairline />
              <div className="flex flex-col gap-8">
                <Label>Simulated</Label>
                <p className="text-small text-ink-muted">
                  The camera, the beacon, the atmosphere and every disturbance exist only in
                  software. No optical hardware is involved and no real ISRO or operational FSOC
                  telemetry has been used.
                </p>
              </div>
              <Hairline />
              <div className="flex flex-col gap-8">
                <Label>Still to build</Label>
                <p className="text-small text-ink-muted">
                  The detector in the shipped console is classical — centroid, correlation and a
                  Kalman-gated associator. The CNN described in the pipeline is the next stage of
                  work, trained on labelled frames this simulator generates. Adapting any of it to
                  real sensor data is explicitly future work.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---- Team -------------------------------------------------------------- */}
      <Section id="team" label="The team" glow="left">
        <Heading
          size="lg"
          text={"Who owns what."}
          className="max-w-[16ch]"
        />
        <Team />
      </Section>

      {/* ---- Close --------------------------------------------------------- */}
      <Section label="Mission context" surface="warm" glow="right">
        <div className="grid gap-40 lg:grid-cols-2 lg:gap-64">
          <div className="flex flex-col gap-24">
            <Heading
              size="lg"
              text={"Built against a real\nproblem statement."}
              accent="real"
              className="max-w-[16ch]"
            />
            <Reveal delay={120}>
              <p className="max-w-[46ch] text-body-lg text-ink-muted">
                Every control in the simulator maps to something a terminal engineer can measure —
                turbulence strength, platform vibration, detector gain, sweep rate. The event log
                is the record of what the tracker did, and why.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="flex flex-wrap gap-12">
                <Button to="/simulator" size="lg" arrow>
                  Open the simulator
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <Card variant="glass" className="p-24 sm:p-32">
              <dl className="flex flex-col gap-20">
                {[
                  ['Problem statement ID', 'SIH26169'],
                  ['Organisation', 'Indian Space Research Organisation'],
                  ['Department', 'Department of Space'],
                  ['Theme', 'Smart Automation'],
                  ['Category', 'Software'],
                ].map(([term, value]) => (
                  <div key={term} className="flex flex-col gap-4">
                    <dt>
                      <Label>{term}</Label>
                    </dt>
                    <dd className="font-mono text-telemetry text-ink">{value}</dd>
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

import { LinkField } from '../components/canvas/LinkField'
import { LivePanel } from '../components/marketing/LivePanel'
import { ArchitectureFlow } from '../components/marketing/ArchitectureFlow'
import { Applications } from '../components/marketing/Applications'
import { TechStack } from '../components/marketing/TechStack'
import { Team } from '../components/marketing/Team'
import { Section } from '../components/layout/Section'
import {
  Badge,
  Button,
  Card,
  Hairline,
  Heading,
  Label,
  Marquee,
  PipelineNode,
  Reveal,
} from '../components/system'
import { useInView } from '../lib/useInView'

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
    title: 'The beam is narrower than the error',
    body: 'An FSOC beam is a few microradians wide. On a moving platform, ordinary pointing error is larger than the beam itself — so the link never closes at all.',
  },
  {
    title: 'Both ends are moving',
    body: 'Satellites, UAVs and vehicle-mounted terminals all drift, vibrate and rotate. The remote terminal has to stay inside the camera field of view while everything moves.',
  },
  {
    title: 'Testing it needs the hardware',
    body: 'Developing PAT algorithms on real equipment means expensive cameras, pan-tilt mechanisms and optical benches — and every experiment costs schedule.',
  },
] as const

const SYSTEM = [
  {
    badge: 'Stage one',
    title: 'A virtual camera',
    body: 'A physics-based renderer produces the frames a real FSOC sensor would return — beacon irradiance, atmospheric scintillation, platform vibration, detector noise and cloud occlusion.',
  },
  {
    badge: 'Stage two',
    title: 'A detector that learns',
    body: 'A lightweight CNN locates the remote terminal in every frame and rejects false candidates — stars, sun glint, specular reflections — that simple thresholding cannot separate.',
  },
  {
    badge: 'Stage three',
    title: 'A loop that holds',
    body: 'A Kalman estimator maintains the track through noise and brief dropouts, then hands a locked pointing vector to the fine-alignment stage.',
  },
] as const

const PIPELINE = [
  { index: '01', name: 'Detection', detail: 'Every frame is scanned for bright point sources. Each becomes a candidate with a score.' },
  { index: '02', name: 'Association', detail: 'Candidates are gated against the track. Decoys lose, and the loop keeps the right one.' },
  { index: '03', name: 'Estimation', detail: 'Noisy measurements become a smooth position and velocity in the platform frame.' },
  { index: '04', name: 'Prediction', detail: 'The estimate is projected forward so the gimbal leads the target instead of chasing it.' },
  { index: '05', name: 'Steering', detail: 'A rate-limited pan/tilt command drives the boresight — the coarse alignment itself.' },
] as const

function PipelineItem({ node }: { node: (typeof PIPELINE)[number] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 })
  return (
    <div ref={ref} className="flex flex-col gap-20">
      <Hairline draw />
      <PipelineNode index={node.index} name={node.name} detail={node.detail} lit={inView} />
    </div>
  )
}

export function Marketing() {
  return (
    <main>
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="relative w-full overflow-hidden pt-48 pb-64 lg:pt-64 lg:pb-96">
        <div aria-hidden className="graph-paper fade-b absolute inset-0" />

        <div className="page-wide relative flex flex-col items-center gap-32 text-center">
          <Reveal>
            <Badge tone="beam">ISRO · Smart India Hackathon 2026 · PS 26169</Badge>
          </Reveal>

          <Heading
            as="h1"
            size="display"
            text="Find the terminal. Hold it in frame."
            accent="frame"
            className="max-w-[15ch]"
          />

          <Reveal delay={180}>
            <p className="max-w-[58ch] text-body-lg text-ink-muted">
              NETRA is an AI-based virtual camera tracking system for the coarse-alignment stage
              of mobile FSOC links — developed and tested entirely in software, with no camera,
              no pan-tilt rig and no optical bench.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="flex flex-wrap items-center justify-center gap-12">
              <Button to="/simulator" size="lg">
                Open the simulator
              </Button>
              <Button href="#problem" variant="secondary" size="lg">
                Why it is hard
              </Button>
            </div>
          </Reveal>

          <Reveal delay={380} className="w-full pt-24">
            <LivePanel />
          </Reveal>
        </div>
      </section>

      <div className="border-y border-rule bg-surface py-16">
        <Marquee items={SPEC_STRIP} />
      </div>

      {/* ---- Problem ------------------------------------------------------- */}
      <Section id="problem" label="The problem">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text="Pointing, acquisition and tracking happens in two stages. The first is where links are lost."
            accent="two"
            className="max-w-[20ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Coarse alignment is the stage where a transmitting terminal must first locate the
              remote terminal and keep it inside its camera field of view. Get it wrong and fine
              alignment never gets a chance to run.
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <Card className="overflow-hidden">
            <div className="h-[220px] w-full sm:h-[280px]">
              <LinkField verticalCenter={0.5} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-12 border-t border-rule px-20 py-16">
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
              <Card className="flex h-full flex-col gap-12 p-24">
                <h3 className="text-title font-medium text-ink">{item.title}</h3>
                <p className="text-small text-ink-muted">{item.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- System -------------------------------------------------------- */}
      <Section id="system" label="The system" surface="surface">
        <Heading
          size="lg"
          text="Three parts, one closed loop."
          accent="closed"
          className="max-w-[18ch]"
        />

        <div className="grid gap-16 lg:grid-cols-3">
          {SYSTEM.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="flex h-full flex-col gap-16 rounded-lg bg-paper p-24">
                <Badge>{item.badge}</Badge>
                <h3 className="text-title font-medium text-ink">{item.title}</h3>
                <p className="text-small text-ink-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <div className="flex flex-col gap-16 rounded-lg border border-rule bg-paper p-24 sm:flex-row sm:items-center sm:justify-between sm:p-32">
            <div className="flex flex-col gap-4">
              <Label tone="beam">Why it can be trained at all</Label>
              <p className="max-w-[62ch] text-small text-ink-muted">
                Every simulated frame comes with the terminal's true position, so the dataset the
                detector needs is generated by the same tool that tests it — perfectly labelled,
                in unlimited quantity.
              </p>
            </div>
            <Button to="/simulator" variant="secondary">
              See it running
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* ---- Pipeline ------------------------------------------------------ */}
      <Section id="pipeline" label="Tracking pipeline">
        <Heading
          size="lg"
          text="Five stages, one frame at a time."
          accent="frame"
          className="max-w-[20ch]"
        />
        <div className="grid gap-32 lg:grid-cols-5 lg:gap-20">
          {PIPELINE.map((node) => (
            <PipelineItem key={node.index} node={node} />
          ))}
        </div>
      </Section>

      {/* ---- Evidence ------------------------------------------------------ */}
      <Section id="evidence" label="Evidence" surface="surface">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text="Eight adversarial phases, one verdict."
            accent="verdict"
            className="max-w-[18ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Thresholds are published before the run, not chosen after it. The console drives the
              same loop through fast targets, vibration, noise, turbulence, dropout and decoys —
              then scores each phase and returns pass or fail.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-16 md:grid-cols-3">
          {[
            ['Mean pointing error', '≤ 14 mrad', 'averaged across each phase, settling time excluded'],
            ['Peak pointing error', '≤ 60 mrad', 'the worst single sample in the phase'],
            ['Lock retention', '≥ 65%', 'share of the phase spent inside the lock window'],
          ].map(([label, value, note], i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="flex h-full flex-col gap-8 rounded-lg bg-paper p-24">
                <Label>{label}</Label>
                <span className="font-mono text-heading-sm font-medium text-ink">{value}</span>
                <p className="text-caption text-ink-muted">{note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <div className="flex flex-wrap items-center gap-12">
            <Button to="/simulator">Run the stress test</Button>
            <span className="text-caption text-ink-faint">Takes about 50 seconds in the browser.</span>
          </div>
        </Reveal>
      </Section>

      {/* ---- Architecture --------------------------------------------------- */}
      <Section id="architecture" label="System architecture">
        <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
          <Heading
            size="lg"
            text="Nine blocks, one signal path."
            accent="signal"
            className="max-w-[18ch]"
          />
          <Reveal delay={120}>
            <p className="max-w-[46ch] text-body-lg text-ink-muted">
              Each stage is a module boundary on purpose. When real hardware arrives, the virtual
              camera is replaced by a frame grabber and the gimbal controller by a servo driver —
              everything between them stays.
            </p>
          </Reveal>
        </div>
        <ArchitectureFlow />
      </Section>

      {/* ---- Technology ------------------------------------------------------ */}
      <Section id="technology" label="Technology" surface="surface">
        <Heading
          size="lg"
          text="Mature parts, no exotic frameworks."
          accent="Mature"
          className="max-w-[18ch]"
        />
        <TechStack />
      </Section>

      {/* ---- Applications ---------------------------------------------------- */}
      <Section id="applications" label="Where it applies">
        <Heading
          size="lg"
          text="Anywhere a narrow beam has to follow a moving target."
          accent="narrow"
          className="max-w-[20ch]"
        />
        <Applications />
        <Reveal delay={160}>
          <p className="max-w-[70ch] text-small text-ink-muted">
            These are the domains the tracking loop applies to. NETRA itself is a simulation — it
            demonstrates and measures the loop inside a virtual environment, and is not connected
            to any operational terminal.
          </p>
        </Reveal>
      </Section>

      {/* ---- Scope ------------------------------------------------------------ */}
      <Section id="scope" label="Scope" surface="surface">
        <div className="grid gap-32 lg:grid-cols-2 lg:gap-64">
          <Heading
            size="md"
            text="What is real here, and what is not."
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
      <Section id="team" label="The team">
        <Heading
          size="lg"
          text="Six roles, one loop."
          accent="loop"
          className="max-w-[16ch]"
        />
        <Team />
      </Section>

      {/* ---- Close --------------------------------------------------------- */}
      <Section label="Mission context" surface="surface">
        <div className="grid gap-40 lg:grid-cols-2 lg:gap-64">
          <div className="flex flex-col gap-24">
            <Heading
              size="lg"
              text="Built against a real problem statement."
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
                <Button to="/simulator" size="lg">
                  Open the simulator
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <Card className="p-24 sm:p-32">
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

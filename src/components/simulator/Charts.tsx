import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HistoryPoint } from '../../sim/useTracker'
import { THRESHOLDS } from '../../sim/useStressTest'
import { token } from '../../lib/tokens'
import { Label } from '../system'

type TooltipPayload = { name?: string; value?: number | string; color?: string }

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-rule bg-surface px-12 py-8 shadow-md">
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-8 font-mono text-hud">
          <span aria-hidden className="size-[6px] rounded-full" style={{ background: item.color }} />
          <span className="text-ink-faint">{item.name}</span>
          <span className="text-ink">
            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

const axisProps = () =>
  ({
    stroke: 'transparent',
    tick: { fill: token('ink-faint'), fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
    tickLine: false,
  }) as const

function Frame({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-8">
        <Label>{title}</Label>
        <span className="font-mono text-hud text-ink-faint">{note}</span>
      </div>
      <div className="h-[150px] w-full">{children}</div>
    </div>
  )
}

/** Pointing error against the threshold the stress test grades on. */
export function ErrorChart({ data }: { data: HistoryPoint[] }) {
  const axis = axisProps()
  return (
    <Frame title="Pointing error" note={`threshold ${THRESHOLDS.meanMrad} mrad`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="err-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={token('beam')} stopOpacity={0.18} />
              <stop offset="100%" stopColor={token('beam')} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={token('rule')} vertical={false} />
          <XAxis dataKey="t" {...axis} minTickGap={40} />
          <YAxis {...axis} width={38} domain={[0, 'auto']} />
          <ReferenceLine
            y={THRESHOLDS.meanMrad}
            stroke={token('rule-strong')}
            strokeDasharray="4 4"
          />
          <Tooltip content={<ChartTooltip unit="mrad" />} cursor={{ stroke: token('rule-strong') }} />
          <Area
            type="monotone"
            dataKey="errorMrad"
            name="Error"
            stroke={token('beam')}
            strokeWidth={2}
            fill="url(#err-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  )
}

/** How closely the estimator's prediction sits on the truth. */
export function PredictionChart({ data }: { data: HistoryPoint[] }) {
  const axis = axisProps()
  return (
    <Frame title="Target vs prediction" note="azimuth, degrees">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={token('rule')} vertical={false} />
          <XAxis dataKey="t" {...axis} minTickGap={40} />
          <YAxis {...axis} width={38} />
          <Tooltip content={<ChartTooltip unit="°" />} cursor={{ stroke: token('rule-strong') }} />
          <Line
            type="monotone"
            dataKey="targetAz"
            name="Target"
            stroke={token('ink')}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="predictedAz"
            name="Predicted"
            stroke={token('beam')}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  )
}

/** The gimbal following the target — the coarse alignment mechanism itself. */
export function GimbalChart({ data }: { data: HistoryPoint[] }) {
  const axis = axisProps()
  return (
    <Frame title="Gimbal response" note="commanded pan follows target">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={token('rule')} vertical={false} />
          <XAxis dataKey="t" {...axis} minTickGap={40} />
          <YAxis {...axis} width={38} />
          <Tooltip content={<ChartTooltip unit="°" />} cursor={{ stroke: token('rule-strong') }} />
          <Line
            type="monotone"
            dataKey="targetAz"
            name="Target"
            stroke={token('ink-faint')}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="pan"
            name="Pan"
            stroke={token('beam')}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  )
}

/** A band that is filled while the loop holds lock, and empty when it does not. */
export function LockChart({ data }: { data: HistoryPoint[] }) {
  return (
    <Frame title="Lock status" note="filled = tracking">
      <div className="flex h-full items-center">
        <div className="flex h-[52px] w-full gap-px overflow-hidden rounded-sm bg-rule">
          {data.map((d, i) => (
            <span
              key={i}
              className="h-full flex-1"
              style={{ background: d.locked ? token('lock') : token('rule') }}
            />
          ))}
          {data.length === 0 ? (
            <span className="flex w-full items-center justify-center font-mono text-hud text-ink-faint">
              no samples yet
            </span>
          ) : null}
        </div>
      </div>
    </Frame>
  )
}

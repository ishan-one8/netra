import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryPoint } from '../../sim/useTracker'
import { token } from '../../lib/tokens'

type TooltipPayload = { name?: string; value?: number | string }

function BareTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tabular text-label-sm font-medium uppercase text-pure-white">
      {payload.map((item) => (
        <div key={item.name}>
          {item.name} {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
        </div>
      ))}
    </div>
  )
}

/** Cream carries the primary series; smoke the secondary. No fills, no grid. */
export function ResidualChart({ data }: { data: HistoryPoint[] }) {
  const axis = {
    stroke: 'transparent',
    tick: { fill: token('smoke'), fontSize: 11, fontFamily: 'Satoshi, Inter, sans-serif' },
    tickLine: false,
  } as const

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" {...axis} minTickGap={36} />
          <YAxis {...axis} width={34} domain={[0, 'auto']} />
          <Tooltip content={<BareTooltip />} cursor={{ stroke: token('graphite') }} />
          <Line
            type="monotone"
            dataKey="error"
            name="Residual"
            stroke={token('lamp-cream')}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke={token('smoke')}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <span aria-hidden className="block h-px w-full bg-graphite" />
    </div>
  )
}

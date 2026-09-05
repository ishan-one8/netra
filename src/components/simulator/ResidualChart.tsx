import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryPoint } from '../../sim/useTracker'
import { token } from '../../lib/tokens'

type TooltipPayload = { name?: string; value?: number | string; color?: string }

function BareTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="font-mono text-hud text-bone">
      {payload.map((item) => (
        <div key={item.name}>
          {item.name} {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
        </div>
      ))}
    </div>
  )
}

/**
 * Transparent ground, one hairline baseline, no fills and no gridlines. The
 * primary series is the only violet in the column.
 */
export function ResidualChart({ data }: { data: HistoryPoint[] }) {
  const axis = {
    stroke: 'transparent',
    tick: { fill: token('ash'), fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' },
    tickLine: false,
  } as const

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" {...axis} minTickGap={36} />
          <YAxis {...axis} width={34} domain={[0, 'auto']} />
          <Tooltip content={<BareTooltip />} cursor={{ stroke: token('hairline') }} />
          <Line
            type="monotone"
            dataKey="error"
            name="RESIDUAL"
            stroke={token('beam')}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="CONFIDENCE"
            stroke={token('ash')}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <span aria-hidden className="block h-px w-full bg-hairline" />
    </div>
  )
}

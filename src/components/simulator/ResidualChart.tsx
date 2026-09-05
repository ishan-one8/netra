import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryPoint } from '../../sim/useTracker'
import { token } from '../../lib/tokens'

type TooltipPayload = { name?: string; value?: number | string; color?: string }

function BareTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-rule bg-surface px-12 py-8 shadow-md">
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-8 font-mono text-hud">
          <span
            aria-hidden
            className="size-[6px] rounded-full"
            style={{ background: item.color }}
          />
          <span className="text-ink-faint">{item.name}</span>
          <span className="text-ink">
            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ResidualChart({ data }: { data: HistoryPoint[] }) {
  const axis = {
    stroke: 'transparent',
    tick: { fill: token('ink-faint'), fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
    tickLine: false,
  } as const

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={token('rule')} vertical={false} />
          <XAxis dataKey="t" {...axis} minTickGap={40} />
          <YAxis {...axis} width={36} domain={[0, 'auto']} />
          <Tooltip content={<BareTooltip />} cursor={{ stroke: token('rule-strong') }} />
          <Line
            type="monotone"
            dataKey="error"
            name="Residual"
            stroke={token('beam')}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke={token('ink-faint')}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

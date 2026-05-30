// EquityPage.jsx
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { useTradeSummary } from '../api/hooks';
import { PageHeader, Card, CardLabel, ChartTooltip, Spinner, Empty, KPICard } from '../components/ui/index';

const fmt$ = v => `$${Number(v).toFixed(2)}`;
const FILTERS = [
  { label: '7D',  days: 7  },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y',  days: 365 },
  { label: 'ALL', days: 0  },
];

export function EquityPage() {
  const [filter, setFilter] = useState('ALL');
  const { data: summary, isLoading } = useTradeSummary();

  const rawCurve = summary?.equityCurve || [];
  const cutoff = FILTERS.find(f => f.label === filter)?.days;
  const curve = cutoff
    ? rawCurve.filter(p => (Date.now() - new Date(p.date)) / 86400000 <= cutoff)
    : rawCurve;

  const netPct = summary?.initialCapital
    ? (((summary.currentCapital - summary.initialCapital) / summary.initialCapital) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader eyebrow="// EQUITY TRACKING" title="EQUITY CURVE" color="#e8ff00" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Starting Capital" value={fmt$(summary?.initialCapital || 0)} color="#a78bfa" loading={isLoading} />
        <KPICard label="Current Capital"  value={fmt$(summary?.currentCapital || 0)} color="#e8ff00" loading={isLoading} />
        <KPICard label="Net Profit"       value={fmt$(summary?.netProfit || 0)} color={(summary?.netProfit||0)>=0?'#00ffb3':'#ff3366'} loading={isLoading} />
        <KPICard label="Growth %" value={`${netPct >= 0 ? '+' : ''}${netPct}%`} color={(netPct>=0)?'#00ffb3':'#ff3366'} loading={isLoading} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardLabel>CAPITAL CURVE</CardLabel>
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button key={f.label} onClick={() => setFilter(f.label)}
                className="px-3 py-1 text-[9px] font-bold tracking-widest border transition-all"
                style={{
                  fontFamily: 'monospace',
                  borderColor: filter === f.label ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                  color: filter === f.label ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                  background: filter === f.label ? 'rgba(232,255,0,0.05)' : 'transparent',
                }}>{f.label}</button>
            ))}
          </div>
        </div>
        {isLoading ? <Spinner /> : curve.length === 0 ? <Empty message="No equity data for this period" /> : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={curve}>
              <defs>
                <linearGradient id="eqFull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e8ff00" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e8ff00" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 8" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}k`}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={fmt$} />} />
              <ReferenceLine y={summary?.initialCapital} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="equity" name="equity" stroke="#e8ff00" strokeWidth={2} fill="url(#eqFull)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

export default EquityPage;

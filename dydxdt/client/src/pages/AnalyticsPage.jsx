import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useTradesByStrategy, useTradesBySymbol, useSessionStats, useMonthlyStats } from '../api/hooks';
import { PageHeader, Card, CardLabel, ChartTooltip, Spinner, Empty, ProgressBar } from '../components/ui/index';

const fmt$ = v => `$${Number(v).toFixed(2)}`;

export default function AnalyticsPage() {
  const { data: byStrategy, isLoading: loadS }  = useTradesByStrategy();
  const { data: bySymbol,   isLoading: loadSy } = useTradesBySymbol();
  const { data: sessions }                       = useSessionStats();
  const { data: monthly }                        = useMonthlyStats();

  const monthlyChart = (monthly || []).map(m => ({
    label: ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id.month],
    pnl:   parseFloat(m.pnl.toFixed(2)),
    wr:    parseFloat(((m.wins / m.trades) * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader eyebrow="// PERFORMANCE BREAKDOWN" title="ANALYTICS" color="#a78bfa" />

      {/* Strategy performance — full width on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardLabel>WIN RATE BY STRATEGY</CardLabel>
          {loadS ? <Spinner /> : !byStrategy?.length ? <Empty /> : (
            <div className="space-y-4">
              {byStrategy.map(s => (
                <div key={s._id}>
                  <div className="flex justify-between text-[9px] mb-1.5" style={{ fontFamily: 'monospace' }}>
                    <span style={{ color: '#e8ff00', fontWeight: 700 }}>{s._id}</span>
                    <span style={{ color: s.winRate >= 60 ? '#00ffb3' : s.winRate >= 50 ? '#e8ff00' : '#ff3366' }}>
                      {s.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={s.winRate} color={s.winRate >= 60 ? '#00ffb3' : s.winRate >= 50 ? '#e8ff00' : '#ff3366'} />
                  <div className="flex justify-between text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    <span>{s.totalTrades} trades · {(s.avgRR||0).toFixed(2)}R avg</span>
                    <span style={{ color: s.netProfit >= 0 ? '#00ffb3' : '#ff3366' }}>
                      {s.netProfit >= 0 ? '+' : ''}{fmt$(s.netProfit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardLabel>STRATEGY NET PROFIT</CardLabel>
          {loadS ? <Spinner /> : !byStrategy?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStrategy} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="_id" type="category"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip formatter={fmt$} />} />
                <Bar dataKey="netProfit" name="netProfit" radius={0}>
                  {byStrategy.map((s, i) => <Cell key={i} fill={s.netProfit >= 0 ? '#a78bfa' : '#ff3366'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Monthly P&L */}
      <Card>
        <CardLabel>MONTHLY P&L BREAKDOWN</CardLabel>
        {!monthlyChart.length ? <Empty message="No monthly data yet" /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyChart} barSize={18}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ChartTooltip formatter={fmt$} />} />
              <Bar dataKey="pnl" name="pnl" radius={0}>
                {monthlyChart.map((m, i) => <Cell key={i} fill={m.pnl >= 0 ? '#e8ff00' : '#ff3366'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Instrument heatmap — 3 cols mobile, 5 desktop */}
      <Card>
        <CardLabel>INSTRUMENT HEAT MAP</CardLabel>
        {loadSy ? <Spinner /> : !bySymbol?.length ? <Empty /> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {bySymbol.map(s => {
              const wr = s.winRate || 0;
              return (
                <div key={s._id}
                  className="p-2 sm:p-3 flex flex-col gap-1 cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: s.netProfit >= 0 ? `rgba(232,255,0,${Math.min((wr-30)/70*0.15,0.15)})` : 'rgba(255,51,102,0.08)',
                    border: `1px solid ${s.netProfit >= 0 ? 'rgba(232,255,0,0.12)' : 'rgba(255,51,102,0.12)'}`,
                  }}>
                  <div className="text-[10px] font-bold truncate" style={{ color: '#fff', fontFamily: 'monospace' }}>{s._id}</div>
                  <div className="text-[9px]" style={{ color: wr >= 60 ? '#e8ff00' : wr >= 50 ? 'rgba(255,255,255,0.5)' : '#ff3366', fontFamily: 'monospace' }}>{wr.toFixed(0)}%</div>
                  <div className="text-[8px]" style={{ color: s.netProfit >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                    {s.netProfit >= 0 ? '+' : ''}{fmt$(s.netProfit)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Session analysis — 2×2 on mobile */}
      <Card>
        <CardLabel>SESSION ANALYSIS</CardLabel>
        {!sessions?.length ? <Empty /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sessions.map(s => (
              <div key={s._id} className="border p-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-[10px] font-bold mb-2" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{s._id}</div>
                {[
                  { label: 'TRADES',   value: s.totalTrades },
                  { label: 'WIN RATE', value: `${(s.winRate||0).toFixed(1)}%`, color: s.winRate >= 60 ? '#00ffb3' : '#e8ff00' },
                  { label: 'P&L',      value: `${s.netProfit >= 0 ? '+' : ''}${fmt$(s.netProfit)}`, color: s.netProfit >= 0 ? '#00ffb3' : '#ff3366' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-[9px] py-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</span>
                    <span style={{ color: m.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{m.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

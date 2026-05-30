import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Link } from 'react-router-dom';
import { useTradeSummary, useSessionStats, useMonthlyStats } from '../api/hooks';
import { KPICard, Card, CardLabel, ChartTooltip, Spinner, Empty, Badge, Glitch } from '../components/ui/index';
import useAuthStore from '../store/authStore';
import { format } from 'date-fns';

const fmt$ = v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = v => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`;

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: summary, isLoading } = useTradeSummary();
  const { data: sessions } = useSessionStats();
  const { data: monthly } = useMonthlyStats();

  const equityCurve = summary?.equityCurve || [];
  const netProfitPct = summary?.initialCapital
    ? ((summary.netProfit / summary.initialCapital) * 100).toFixed(2)
    : 0;

  const monthlyForChart = (monthly || []).map(m => ({
    label: `${['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id.month]}`,
    pnl: parseFloat(m.pnl.toFixed(2)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-end justify-between pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            // PORTFOLIO STATUS — LIVE REPLAY
          </div>
          {isLoading ? (
            <div className="h-10 w-48 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ) : (
            <div className="font-display text-5xl leading-none" style={{
              color: '#e8ff00', letterSpacing: '0.03em', textShadow: '0 0 30px rgba(232,255,0,0.3)'
            }}>
              {fmt$(summary?.currentCapital || 0)}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>TODAY'S P&L</div>
          <div className="font-display text-2xl leading-none" style={{
            color: (summary?.todayPnL || 0) >= 0 ? '#00ffb3' : '#ff3366',
            textShadow: `0 0 15px ${(summary?.todayPnL || 0) >= 0 ? 'rgba(0,255,179,0.4)' : 'rgba(255,51,102,0.4)'}`
          }}>
            {(summary?.todayPnL || 0) >= 0 ? '+' : ''}{fmt$(summary?.todayPnL || 0)}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Win Rate"       value={`${summary?.winRate || 0}%`}     color="#e8ff00" sub={`${summary?.wins || 0}W / ${summary?.losses || 0}L`}           loading={isLoading} />
        <KPICard label="Profit Factor"  value={summary?.profitFactor || 0}      color="#00ffb3" sub="gross profit / gross loss"                                      loading={isLoading} />
        <KPICard label="Max Drawdown"   value={`-${summary?.maxDrawdownPercent || 0}%`} color="#ff3366" sub={fmt$(summary?.maxDrawdown || 0)}                        loading={isLoading} />
        <KPICard label="Expectancy"     value={fmt$(summary?.expectancy || 0)}  color="#a78bfa" sub="per trade average"                                              loading={isLoading} />
        <KPICard label="Sharpe Ratio"   value={summary?.sharpeRatio || 0}       color="#e8ff00" sub="risk-adjusted return"                                           loading={isLoading} />
        <KPICard label="Total Trades"   value={summary?.totalTrades || 0}       color="#00ffb3" sub={`${summary?.breakEven || 0} break-even`}                        loading={isLoading} />
        <KPICard label="Avg Risk/Reward" value={`${(summary?.avgRR || 0).toFixed(2)}R`} color="#a78bfa" sub="reward per unit risk"                                  loading={isLoading} />
        <KPICard label="Net Profit"     value={fmt$(summary?.netProfit || 0)}   color="#e8ff00" sub={`${fmtPct(netProfitPct)} on capital`}                           loading={isLoading} />
      </div>

      {/* Period P&L Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'WEEKLY P&L',  val: summary?.weeklyPnL  || 0 },
          { label: 'MONTHLY P&L', val: summary?.monthlyPnL || 0 },
          { label: 'TOTAL NET',   val: summary?.netProfit  || 0 },
        ].map(item => (
          <div key={item.label} className="border p-3 text-center" style={{ background: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{item.label}</div>
            <div className="font-display text-xl" style={{ color: item.val >= 0 ? '#00ffb3' : '#ff3366' }}>
              {item.val >= 0 ? '+' : ''}{fmt$(item.val)}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardLabel>EQUITY CURVE</CardLabel>
            <div className="font-display text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>CAPITAL GROWTH</div>
          </div>
          <Link to="/equity" className="text-[9px] tracking-widest uppercase transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            EXPAND →
          </Link>
        </div>
        {equityCurve.length === 0 ? <Empty message="No trades yet — start logging" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e8ff00" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e8ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(1)}k`}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={fmt$} />} />
              <Area type="monotone" dataKey="equity" name="equity" stroke="#e8ff00" strokeWidth={2} fill="url(#eqGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly P&L */}
        <Card>
          <CardLabel>MONTHLY P&L</CardLabel>
          {monthlyForChart.length === 0 ? <Empty message="No monthly data" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyForChart} barSize={16}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={fmt$} />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="pnl" name="pnl" radius={0}
                  fill="#e8ff00"
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Session breakdown */}
        <Card>
          <CardLabel>SESSION PERFORMANCE</CardLabel>
          {!sessions?.length ? <Empty message="No session data" /> : (
            <div className="space-y-3 pt-1">
              {sessions.map(s => (
                <div key={s._id}>
                  <div className="flex justify-between text-[9px] mb-1" style={{ fontFamily: 'monospace' }}>
                    <span style={{ color: '#e8ff00', fontWeight: 700 }}>{s._id}</span>
                    <span style={{ color: s.netProfit >= 0 ? '#00ffb3' : '#ff3366' }}>
                      {s.netProfit >= 0 ? '+' : ''}{fmt$(s.netProfit)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full" style={{
                      width: `${s.winRate?.toFixed(0) || 0}%`,
                      background: s.netProfit >= 0 ? '#e8ff00' : '#ff3366',
                    }} />
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    {s.winRate?.toFixed(1)}% WR · {s.totalTrades} trades
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/trades/add', label: 'LOG TRADE',    icon: '+',  color: '#e8ff00' },
          { to: '/analytics',  label: 'ANALYTICS',    icon: '⬡', color: '#a78bfa' },
          { to: '/journal',    label: 'DAILY JOURNAL', icon: '✦', color: '#00ffb3' },
          { to: '/risk',       label: 'RISK CALC',    icon: '◇', color: '#ff3366' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className="border p-4 flex items-center gap-3 transition-all duration-150 hover:scale-[1.02] card-glow"
            style={{ background: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.06)', textDecoration: 'none' }}>
            <span className="text-xl" style={{ color: l.color }}>{l.icon}</span>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

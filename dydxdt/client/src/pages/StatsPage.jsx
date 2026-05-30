import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../api/client';
import { PageHeader, Card, CardLabel, Spinner, Empty } from '../components/ui/index';

const fmt$ = v => `$${Number(v).toFixed(2)}`;

export default function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats-leaderboard'],
    queryFn: async () => {
      const [trades, summary] = await Promise.all([
        api.get('/trades', { params: { limit: 500 } }).then(r => r.data.data),
        api.get('/trades/stats/summary').then(r => r.data.data),
      ]);
      return { trades, summary };
    }
  });

  if (isLoading) return <Spinner />;

  const trades  = data?.trades  || [];
  const summary = data?.summary || {};

  if (!trades.length) return (
    <div className="space-y-5">
      <PageHeader eyebrow="// PERFORMANCE LEADERBOARD" title="HALL OF STATS" color="#e8ff00" />
      <Empty message="No trades logged yet" />
    </div>
  );

  // Best / Worst single trades
  const sorted    = [...trades].sort((a, b) => b.profitLoss - a.profitLoss);
  const bestTrade = sorted[0];
  const worstTrade = sorted[sorted.length - 1];

  // Best / Worst by day
  const dayMap = {};
  trades.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0];
    if (!dayMap[key]) dayMap[key] = { pnl: 0, trades: 0 };
    dayMap[key].pnl    += t.profitLoss || 0;
    dayMap[key].trades += 1;
  });
  const daySorted = Object.entries(dayMap).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestDay  = daySorted[0];
  const worstDay = daySorted[daySorted.length - 1];

  // Streaks
  const byDate = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let curWin = 0, maxWin = 0, curLoss = 0, maxLoss = 0;
  byDate.forEach(t => {
    if (t.result === 'WIN')  { curWin++; maxWin  = Math.max(maxWin, curWin);  curLoss = 0; }
    else if (t.result === 'LOSS') { curLoss++; maxLoss = Math.max(maxLoss, curLoss); curWin = 0; }
    else { curWin = 0; curLoss = 0; }
  });

  // Largest consecutive wins/losses
  const biggestWinner = [...trades].filter(t => t.result === 'WIN').sort((a, b) => b.profitLoss - a.profitLoss)[0];
  const biggestLoser  = [...trades].filter(t => t.result === 'LOSS').sort((a, b) => a.profitLoss - b.profitLoss)[0];

  // Top symbols
  const symMap = {};
  trades.forEach(t => {
    if (!symMap[t.symbol]) symMap[t.symbol] = { pnl: 0, trades: 0 };
    symMap[t.symbol].pnl    += t.profitLoss || 0;
    symMap[t.symbol].trades += 1;
  });
  const topSymbols = Object.entries(symMap).sort((a, b) => b[1].pnl - a[1].pnl).slice(0, 5);

  const Highlight = ({ label, value, sub, color = '#e8ff00', icon }) => (
    <div className="border p-4 space-y-2 card-glow" style={{ background: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${color}` }}>
      <div className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{label}</div>
      <div className="font-display text-2xl leading-none" style={{ color, textShadow: `0 0 20px ${color}30` }}>{value}</div>
      {sub && <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader eyebrow="// PERFORMANCE RECORDS" title="HALL OF STATS" color="#e8ff00" />

      {/* Streaks + Extremes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Highlight label="LONGEST WIN STREAK"  value={`${maxWin} trades`}  color="#e8ff00" />
        <Highlight label="LONGEST LOSS STREAK" value={`${maxLoss} trades`} color="#ff3366" />
        <Highlight label="BEST DAY"  value={bestDay  ? fmt$(bestDay[1].pnl)  : '—'} color="#00ffb3" sub={bestDay  ? format(new Date(bestDay[0]),  'MMM d, yyyy') : ''} />
        <Highlight label="WORST DAY" value={worstDay ? fmt$(worstDay[1].pnl) : '—'} color="#ff3366" sub={worstDay ? format(new Date(worstDay[0]), 'MMM d, yyyy') : ''} />
      </div>

      {/* Best / Worst single trade */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card accent="#00ffb3">
          <CardLabel>BEST SINGLE TRADE</CardLabel>
          {bestTrade ? (
            <div className="space-y-3">
              <div className="font-display text-3xl" style={{ color: '#00ffb3' }}>{fmt$(bestTrade.profitLoss)}</div>
              <div className="grid grid-cols-2 gap-2 text-[9px]" style={{ fontFamily: 'monospace' }}>
                {[
                  { label: 'SYMBOL',    value: bestTrade.symbol,       color: '#e8ff00' },
                  { label: 'DIRECTION', value: bestTrade.direction,     color: bestTrade.direction === 'LONG' ? '#00ffb3' : '#ff3366' },
                  { label: 'R:R',       value: `${(bestTrade.riskRewardRatio||0).toFixed(2)}R`, color: '#a78bfa' },
                  { label: 'STRATEGY',  value: bestTrade.strategyUsed || '—' },
                  { label: 'SESSION',   value: bestTrade.session || '—' },
                  { label: 'DATE',      value: format(new Date(bestTrade.date), 'MMM d, yyyy') },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ color: 'rgba(255,255,255,0.2)' }}>{m.label}</div>
                    <div style={{ color: m.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </Card>

        <Card accent="#ff3366">
          <CardLabel>WORST SINGLE TRADE</CardLabel>
          {worstTrade ? (
            <div className="space-y-3">
              <div className="font-display text-3xl" style={{ color: '#ff3366' }}>{fmt$(worstTrade.profitLoss)}</div>
              <div className="grid grid-cols-2 gap-2 text-[9px]" style={{ fontFamily: 'monospace' }}>
                {[
                  { label: 'SYMBOL',    value: worstTrade.symbol,       color: '#e8ff00' },
                  { label: 'DIRECTION', value: worstTrade.direction,     color: worstTrade.direction === 'LONG' ? '#00ffb3' : '#ff3366' },
                  { label: 'R:R',       value: `${(worstTrade.riskRewardRatio||0).toFixed(2)}R`, color: '#a78bfa' },
                  { label: 'STRATEGY',  value: worstTrade.strategyUsed || '—' },
                  { label: 'SESSION',   value: worstTrade.session || '—' },
                  { label: 'DATE',      value: format(new Date(worstTrade.date), 'MMM d, yyyy') },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ color: 'rgba(255,255,255,0.2)' }}>{m.label}</div>
                    <div style={{ color: m.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </Card>
      </div>

      {/* Top performing symbols */}
      <Card>
        <CardLabel>TOP 5 INSTRUMENTS BY P&L</CardLabel>
        <div className="space-y-3">
          {topSymbols.map(([sym, stats], i) => (
            <div key={sym} className="flex items-center gap-4">
              <div className="text-[10px] font-bold w-4 text-center" style={{ color: i === 0 ? '#e8ff00' : 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {i + 1}
              </div>
              <div className="text-[11px] font-bold w-20" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{sym}</div>
              <div className="flex-1 h-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full" style={{
                  width: `${Math.min((Math.abs(stats.pnl) / Math.abs(topSymbols[0][1].pnl)) * 100, 100)}%`,
                  background: stats.pnl >= 0 ? '#e8ff00' : '#ff3366',
                }} />
              </div>
              <div className="text-[10px] font-bold w-24 text-right" style={{ color: stats.pnl >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                {stats.pnl >= 0 ? '+' : ''}{fmt$(stats.pnl)}
              </div>
              <div className="text-[9px] w-14 text-right" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {stats.trades}T
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Overall KPI recap */}
      <Card>
        <CardLabel>ALL-TIME KPIs</CardLabel>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>PERFORMANCE</div>
            {[
              { label: 'Total Trades',   value: summary.totalTrades || 0 },
              { label: 'Wins',           value: summary.wins || 0,   color: '#00ffb3' },
              { label: 'Losses',         value: summary.losses || 0, color: '#ff3366' },
              { label: 'Win Rate',       value: `${(summary.winRate||0).toFixed(2)}%`,         color: '#e8ff00' },
              { label: 'Profit Factor',  value: (summary.profitFactor||0).toFixed(2),           color: '#00ffb3' },
              { label: 'Expectancy',     value: fmt$(summary.expectancy||0),                    color: '#a78bfa' },
              { label: 'Sharpe Ratio',   value: (summary.sharpeRatio||0).toFixed(2),            color: '#a78bfa' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5 border-b text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{r.label}</span>
                <span style={{ color: r.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>MONEY</div>
            {[
              { label: 'Initial Capital',  value: fmt$(summary.initialCapital||0) },
              { label: 'Current Capital',  value: fmt$(summary.currentCapital||0),                     color: '#e8ff00' },
              { label: 'Net Profit',       value: `${(summary.netProfit||0)>=0?'+':''}${fmt$(summary.netProfit||0)}`, color: (summary.netProfit||0)>=0?'#00ffb3':'#ff3366' },
              { label: 'Gross Profit',     value: fmt$(summary.grossProfit||0),                         color: '#00ffb3' },
              { label: 'Gross Loss',       value: `-${fmt$(summary.grossLoss||0)}`,                     color: '#ff3366' },
              { label: 'Avg Win',          value: fmt$(summary.avgWin||0),                              color: '#00ffb3' },
              { label: 'Avg Loss',         value: `-${fmt$(summary.avgLoss||0)}`,                       color: '#ff3366' },
              { label: 'Max Drawdown',     value: `${(summary.maxDrawdownPercent||0).toFixed(2)}%`,     color: '#ff3366' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5 border-b text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{r.label}</span>
                <span style={{ color: r.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

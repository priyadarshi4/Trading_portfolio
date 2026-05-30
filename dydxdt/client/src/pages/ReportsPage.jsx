import { useState } from 'react';
import { useTradeSummary, useTradesByStrategy, useMonthlyStats } from '../api/hooks';
import { PageHeader, Card, CardLabel, Btn, StatRow, Spinner } from '../components/ui/index';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import toast from 'react-hot-toast';

const fmt$ = v => `$${Number(v).toFixed(2)}`;
const fmtN = v => Number(v).toFixed(2);

export default function ReportsPage() {
  const { data: summary, isLoading } = useTradeSummary();
  const { data: byStrategy }         = useTradesByStrategy();
  const { data: monthly }            = useMonthlyStats();
  const { user }                     = useAuthStore();
  const [exporting, setExporting]    = useState('');

  const handleCSV = async () => {
    setExporting('csv');
    try {
      const stored = JSON.parse(localStorage.getItem('dydxdt-auth') || '{}');
      const token  = stored?.state?.token;
      const res = await fetch('/api/export/trades.csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `dydxdt-trades-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported ✓');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const handleJSON = async () => {
    setExporting('json');
    try {
      const stored = JSON.parse(localStorage.getItem('dydxdt-auth') || '{}');
      const token  = stored?.state?.token;
      const res = await fetch('/api/export/report.json', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `dydxdt-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported ✓');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const netProfitPct = summary?.initialCapital
    ? ((summary.netProfit / summary.initialCapital) * 100).toFixed(2)
    : 0;

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader eyebrow="// DATA EXPORT & REPORTING" title="REPORTS" color="#e8ff00" />

      {/* Export buttons */}
      <Card accent="#e8ff00">
        <CardLabel>EXPORT YOUR DATA</CardLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 space-y-3" style={{ borderColor: 'rgba(232,255,0,0.1)', background: 'rgba(232,255,0,0.02)' }}>
            <div>
              <div className="font-display text-lg mb-1" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>CSV EXPORT</div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                All trades with full details — open in Excel, Google Sheets, or any data tool.
                Includes: date, symbol, direction, entry/exit, SL, P&L, R:R, strategy, session, tags, notes.
              </div>
            </div>
            <Btn onClick={handleCSV} disabled={exporting === 'csv'} className="w-full py-2.5">
              {exporting === 'csv' ? 'EXPORTING...' : '↓ DOWNLOAD CSV'}
            </Btn>
          </div>

          <div className="border p-4 space-y-3" style={{ borderColor: 'rgba(167,139,250,0.1)', background: 'rgba(167,139,250,0.02)' }}>
            <div>
              <div className="font-display text-lg mb-1" style={{ color: '#a78bfa', letterSpacing: '0.05em' }}>FULL REPORT JSON</div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                Complete performance report with all KPIs, equity curve, strategy breakdown, monthly analysis, and every trade.
              </div>
            </div>
            <Btn onClick={handleJSON} variant="outline" disabled={exporting === 'json'} className="w-full py-2.5">
              {exporting === 'json' ? 'EXPORTING...' : '↓ DOWNLOAD JSON'}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardLabel>PERFORMANCE SUMMARY REPORT</CardLabel>
        <div className="mb-2 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          Trader: <span style={{ color: '#e8ff00' }}>{user?.name}</span> ·
          Generated: <span style={{ color: '#e8ff00' }}>{new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Core metrics */}
          <div>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>CORE METRICS</div>
            <StatRow label="Starting Capital" value={fmt$(summary?.initialCapital || 0)} />
            <StatRow label="Current Capital"  value={fmt$(summary?.currentCapital || 0)} color="#e8ff00" />
            <StatRow label="Net Profit"        value={`${(summary?.netProfit||0)>=0?'+':''}${fmt$(summary?.netProfit||0)}`} color={(summary?.netProfit||0)>=0?'#00ffb3':'#ff3366'} />
            <StatRow label="Return %"          value={`${netProfitPct>=0?'+':''}${netProfitPct}%`} color={(netProfitPct>=0)?'#00ffb3':'#ff3366'} />
            <StatRow label="Total Trades"      value={summary?.totalTrades || 0} />
            <StatRow label="Win / Loss"        value={`${summary?.wins||0}W / ${summary?.losses||0}L`} />
            <StatRow label="Win Rate"          value={`${fmtN(summary?.winRate||0)}%`} color="#e8ff00" />
          </div>

          {/* Advanced metrics */}
          <div>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>ADVANCED METRICS</div>
            <StatRow label="Profit Factor"      value={fmtN(summary?.profitFactor||0)}           color="#00ffb3" />
            <StatRow label="Expectancy"         value={fmt$(summary?.expectancy||0)}              color="#a78bfa" />
            <StatRow label="Sharpe Ratio"       value={fmtN(summary?.sharpeRatio||0)}             color="#a78bfa" />
            <StatRow label="Max Drawdown"       value={`${fmtN(summary?.maxDrawdownPercent||0)}%`} color="#ff3366" />
            <StatRow label="Max DD ($)"         value={fmt$(summary?.maxDrawdown||0)}              color="#ff3366" />
            <StatRow label="Avg Win"            value={fmt$(summary?.avgWin||0)}                  color="#00ffb3" />
            <StatRow label="Avg Loss"           value={`-${fmt$(summary?.avgLoss||0)}`}           color="#ff3366" />
            <StatRow label="Avg R:R"            value={`${fmtN(summary?.avgRR||0)}R`}             color="#e8ff00" />
          </div>
        </div>
      </Card>

      {/* Strategy breakdown table */}
      {byStrategy?.length > 0 && (
        <Card>
          <CardLabel>STRATEGY BREAKDOWN</CardLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['STRATEGY','TRADES','WIN RATE','NET P&L','AVG R:R','EXP'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.12em]"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStrategy.map(s => (
                  <tr key={s._id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{s._id}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.totalTrades}</td>
                    <td className="px-3 py-2.5" style={{ color: s.winRate>=60?'#00ffb3':s.winRate>=50?'#e8ff00':'#ff3366' }}>
                      {fmtN(s.winRate)}%
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: s.netProfit>=0?'#00ffb3':'#ff3366' }}>
                      {s.netProfit>=0?'+':''}{fmt$(s.netProfit)}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: '#a78bfa' }}>{fmtN(s.avgRR)}R</td>
                    <td className="px-3 py-2.5" style={{ color: (s.avgPnL||0)>=0?'#00ffb3':'#ff3366' }}>
                      {(s.avgPnL||0)>=0?'+':''}{fmt$(s.avgPnL||0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Monthly table */}
      {monthly?.length > 0 && (
        <Card>
          <CardLabel>MONTHLY P&L TABLE</CardLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['MONTH','TRADES','WINS','LOSSES','WIN RATE','NET P&L'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.12em]"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map(m => {
                  const monthName = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id.month];
                  const wr = m.trades ? ((m.wins / m.trades) * 100).toFixed(1) : 0;
                  const losses = m.trades - m.wins;
                  return (
                    <tr key={`${m._id.year}-${m._id.month}`} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-3 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{monthName} {m._id.year}</td>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.trades}</td>
                      <td className="px-3 py-2.5" style={{ color: '#00ffb3' }}>{m.wins}</td>
                      <td className="px-3 py-2.5" style={{ color: '#ff3366' }}>{losses}</td>
                      <td className="px-3 py-2.5" style={{ color: wr>=60?'#00ffb3':wr>=50?'#e8ff00':'#ff3366' }}>{wr}%</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: m.pnl>=0?'#00ffb3':'#ff3366' }}>
                        {m.pnl>=0?'+':''}{fmt$(m.pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

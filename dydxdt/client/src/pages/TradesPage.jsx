import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTrades, useDeleteTrade } from '../api/hooks';
import { PageHeader, Badge, Btn, Spinner, Empty, Card } from '../components/ui/index';

const FILTERS = ['ALL','WIN','LOSS','BE'];

export default function TradesPage() {
  const [result,    setResult]    = useState('');
  const [direction, setDir]       = useState('');
  const [symbol,    setSymbol]    = useState('');
  const [page,      setPage]      = useState(1);
  const [viewMode,  setViewMode]  = useState('auto'); // auto | table | cards

  const params = {
    ...(result    && result !== 'ALL'    ? { result }    : {}),
    ...(direction && direction !== 'ALL' ? { direction } : {}),
    ...(symbol ? { symbol }              : {}),
    page, limit: 30,
  };

  const { data, isLoading } = useTrades(params);
  const deleteTrade = useDeleteTrade();
  const trades = data?.data || [];

  const fmt$ = v => {
    const n = Number(v);
    return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        eyebrow="// TRADE RECORD SYSTEM"
        title="TRADE JOURNAL"
        color="#e8ff00"
        action={
          <Link to="/trades/add"><Btn>+ LOG</Btn></Link>
        }
      />

      {/* Filters */}
      <div className="space-y-2">
        {/* Result filter row */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setResult(f === 'ALL' ? '' : f); setPage(1); }}
              className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                color:       (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                background:  (result === f || (f === 'ALL' && !result)) ? 'rgba(232,255,0,0.05)' : 'transparent',
              }}>{f}</button>
          ))}
          {/* Direction filter */}
          {['LONG','SHORT'].map(d => (
            <button key={d} onClick={() => { setDir(direction === d ? '' : d); setPage(1); }}
              className="px-3 py-1.5 text-[9px] font-bold border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: direction === d ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                color:       direction === d ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background:  'transparent',
              }}>{d}</button>
          ))}
        </div>

        {/* Symbol search + view toggle */}
        <div className="flex gap-2">
          <input className="input-dark flex-1" style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            placeholder="Filter by symbol (XAUUSD...)"
            value={symbol}
            onChange={e => { setSymbol(e.target.value.toUpperCase()); setPage(1); }} />
          {/* View mode toggle — only on md+ */}
          <div className="hidden md:flex gap-1">
            {['table','cards'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-2.5 py-1 text-[9px] font-bold border transition-all"
                style={{
                  fontFamily: 'monospace',
                  borderColor: viewMode === m ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                  color:       viewMode === m ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                }}>{m === 'table' ? '≡' : '⊞'}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <Spinner /> : trades.length === 0 ? <Empty message="No trades match filters" /> : (
        <>
          {/* ── CARD VIEW — always on mobile, optional on desktop ── */}
          <div className={viewMode === 'table' ? 'hidden md:block' : 'block md:hidden'}>
            <div className="space-y-2">
              {trades.map(t => (
                <div key={t._id} className="border p-3 space-y-2 card-glow"
                  style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${t.result === 'WIN' ? '#00ffb3' : t.result === 'LOSS' ? '#ff3366' : 'rgba(255,255,255,0.1)'}` }}>
                  {/* Row 1: symbol + result + pnl */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>{t.symbol}</span>
                      <Badge>{t.direction}</Badge>
                      <Badge>{t.result}</Badge>
                    </div>
                    <div className="font-bold text-sm" style={{ color: t.profitLoss >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                      {fmt$(t.profitLoss)}
                    </div>
                  </div>
                  {/* Row 2: date + entry + exit + RR */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]" style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{format(new Date(t.date), 'MMM d, yy')}</span>
                    <span>IN: <span style={{ color: '#fff' }}>{t.entryPrice}</span></span>
                    <span>OUT: <span style={{ color: '#fff' }}>{t.exitPrice}</span></span>
                    {t.riskRewardRatio > 0 && <span style={{ color: '#a78bfa' }}>{t.riskRewardRatio.toFixed(2)}R</span>}
                    {t.strategyUsed && <span style={{ color: 'rgba(255,255,255,0.3)' }}>{t.strategyUsed}</span>}
                  </div>
                  {/* Row 3: actions */}
                  <div className="flex gap-3">
                    <Link to={`/trades/${t._id}/edit`} className="text-[8px] uppercase tracking-wide transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>EDIT</Link>
                    <button onClick={() => { if (confirm('Delete?')) deleteTrade.mutate(t._id); }}
                      className="text-[8px] uppercase tracking-wide transition-colors hover:text-danger" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABLE VIEW — desktop only ── */}
          <div className={viewMode === 'cards' ? 'hidden' : 'hidden md:block'}>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]" style={{ fontFamily: 'monospace', minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['DATE','SYMBOL','DIR','ENTRY','EXIT','SL','R:R','P&L','STRATEGY','RESULT',''].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.1em]"
                          style={{ color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => (
                      <tr key={t._id} className="border-b transition-colors hover:bg-white/[0.015]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.3)' }}>{format(new Date(t.date), 'MMM d, yy')}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{t.symbol}</td>
                        <td className="px-3 py-2.5"><Badge>{t.direction}</Badge></td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.entryPrice}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.exitPrice}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.stopLoss || '–'}</td>
                        <td className="px-3 py-2.5" style={{ color: '#a78bfa' }}>{t.riskRewardRatio > 0 ? `${t.riskRewardRatio.toFixed(2)}R` : '–'}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: t.profitLoss >= 0 ? '#00ffb3' : '#ff3366' }}>{fmt$(t.profitLoss)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.strategyUsed || '–'}</td>
                        <td className="px-3 py-2.5"><Badge>{t.result}</Badge></td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-2">
                            <Link to={`/trades/${t._id}/edit`} className="text-[9px] hover:text-acid transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>EDIT</Link>
                            <button onClick={() => { if (confirm('Delete?')) deleteTrade.mutate(t._id); }}
                              className="text-[9px] hover:text-danger transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>DEL</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{data.total} trades</div>
          <div className="flex gap-2 items-center">
            <Btn variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Btn>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{page}/{data.pages}</span>
            <Btn variant="ghost" onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}>→</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

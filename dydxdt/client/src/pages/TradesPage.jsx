import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTrades, useDeleteTrade } from '../api/hooks';
import { PageHeader, Badge, Btn, Spinner, Empty, Card } from '../components/ui/index';

const FILTERS = ['ALL', 'WIN', 'LOSS', 'BE'];
const MARKETS = ['ALL', 'Forex', 'Futures', 'Commodities', 'Indices'];

export default function TradesPage() {
  const [result, setResult]     = useState('');
  const [market, setMarket]     = useState('');
  const [direction, setDir]     = useState('');
  const [symbol, setSymbol]     = useState('');
  const [page, setPage]         = useState(1);

  const params = {
    ...(result    && result !== 'ALL'    ? { result }    : {}),
    ...(market    && market !== 'ALL'    ? { marketType: market } : {}),
    ...(direction && direction !== 'ALL' ? { direction } : {}),
    ...(symbol    ? { symbol }           : {}),
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
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="// TRADE RECORD SYSTEM"
        title="TRADE JOURNAL"
        color="#e8ff00"
        action={
          <Link to="/trades/add">
            <Btn>+ LOG TRADE</Btn>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Result filter */}
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setResult(f === 'ALL' ? '' : f); setPage(1); }}
              className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                color: (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                background: (result === f || (f === 'ALL' && !result)) ? 'rgba(232,255,0,0.05)' : 'transparent',
              }}>{f}</button>
          ))}
        </div>

        {/* Direction */}
        <div className="flex gap-1">
          {['ALL','LONG','SHORT'].map(d => (
            <button key={d} onClick={() => { setDir(d === 'ALL' ? '' : d); setPage(1); }}
              className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (direction === d || (d === 'ALL' && !direction)) ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                color: (direction === d || (d === 'ALL' && !direction)) ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: 'transparent',
              }}>{d}</button>
          ))}
        </div>

        {/* Symbol search */}
        <input className="input-dark" style={{ width: 120, padding: '4px 10px', fontSize: '0.7rem' }}
          placeholder="SYMBOL..." value={symbol}
          onChange={e => { setSymbol(e.target.value.toUpperCase()); setPage(1); }} />
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : trades.length === 0 ? <Empty message="No trades match filters" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['DATE','SYMBOL','DIR','ENTRY','EXIT','SL','R:R','P&L','STRATEGY','SESSION','RESULT',''].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.12em]"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t._id} className="border-b transition-colors hover:bg-white/[0.015] cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {format(new Date(t.date), 'MMM d, yy')}
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{t.symbol}</td>
                    <td className="px-3 py-2.5"><Badge>{t.direction}</Badge></td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.entryPrice}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.exitPrice}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.stopLoss || '–'}</td>
                    <td className="px-3 py-2.5" style={{ color: '#a78bfa' }}>
                      {t.riskRewardRatio > 0 ? `${t.riskRewardRatio.toFixed(2)}R` : '–'}
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: t.profitLoss >= 0 ? '#00ffb3' : '#ff3366' }}>
                      {fmt$(t.profitLoss)}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.strategyUsed || '–'}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.session || '–'}</td>
                    <td className="px-3 py-2.5"><Badge>{t.result}</Badge></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <Link to={`/trades/${t._id}/edit`}
                          className="text-[9px] transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.2)' }}>EDIT</Link>
                        <button onClick={() => { if (confirm('Delete this trade?')) deleteTrade.mutate(t._id); }}
                          className="text-[9px] transition-colors hover:text-danger" style={{ color: 'rgba(255,255,255,0.2)' }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
              {data.total} total trades
            </div>
            <div className="flex gap-1">
              <Btn variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Btn>
              <span className="px-3 py-1 text-[9px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{page}/{data.pages}</span>
              <Btn variant="ghost" onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}>→</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

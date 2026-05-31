import { useState } from 'react';
import { useScan, useScannerFilters } from '../../api/market/hooks';
import { PageHeader, Card, CardLabel, Spinner, Empty } from '../../components/ui/index';

const fmt$ = v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : parseFloat((v||0).toFixed(4));
const fmtChg = v => `${v >= 0 ? '+' : ''}${(v||0).toFixed(2)}%`;

const CATEGORIES = ['','Indices','Forex','Crypto','Commodities','Futures','Indian Stocks','US Stocks'];

export default function ScannerPage() {
  const [activeFilter, setActiveFilter] = useState('');
  const [category,     setCategory]     = useState('');

  const { data: filters, isLoading: loadF } = useScannerFilters();
  const { data: results, isLoading: loadR, isFetching } = useScan(activeFilter, category);

  const rows = results?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader eyebrow="// MARKET SCREENER" title="SCANNER" color="#e8ff00" />

      {/* Filter chips */}
      <Card>
        <CardLabel>SCAN FILTERS</CardLabel>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('')}
            className="px-3 py-1.5 text-[9px] font-bold border transition-all"
            style={{
              fontFamily: 'monospace',
              borderColor: !activeFilter ? '#e8ff00' : 'rgba(255,255,255,0.08)',
              color:       !activeFilter ? '#e8ff00' : 'rgba(255,255,255,0.3)',
              background:  !activeFilter ? 'rgba(232,255,0,0.05)' : 'transparent',
            }}>ALL SIGNALS</button>
          {(filters || []).map(f => (
            <button key={f.id}
              onClick={() => setActiveFilter(activeFilter === f.id ? '' : f.id)}
              className="px-3 py-1.5 text-[9px] font-bold border transition-all flex items-center gap-1.5"
              style={{
                fontFamily: 'monospace',
                borderColor: activeFilter === f.id ? f.color : 'rgba(255,255,255,0.08)',
                color:       activeFilter === f.id ? f.color : 'rgba(255,255,255,0.35)',
                background:  activeFilter === f.id ? `${f.color}10` : 'transparent',
              }}>
              <span>{f.icon}</span>{f.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 mt-3 pt-3 border-t flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {CATEGORIES.map(cat => (
            <button key={cat || 'all'}
              onClick={() => setCategory(cat)}
              className="px-2.5 py-1 text-[9px] font-bold border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: category === cat ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                color:       category === cat ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                background:  category === cat ? 'rgba(167,139,250,0.06)' : 'transparent',
              }}>{cat || 'ALL MARKETS'}</button>
          ))}
        </div>
      </Card>

      {/* Results */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardLabel>SCAN RESULTS</CardLabel>
          <div className="flex items-center gap-2">
            {isFetching && <div className="w-3 h-3 border border-t-acid rounded-full animate-spin" style={{ borderColor: 'rgba(232,255,0,0.2)', borderTopColor: '#e8ff00' }} />}
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              {rows.length} MATCHES
            </div>
          </div>
        </div>

        {loadR ? <Spinner /> : rows.length === 0 ? <Empty message="No matches for current filter" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ fontFamily: 'monospace' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['SYMBOL','NAME','CAT','PRICE','CHANGE','RSI','VOL','SIGNALS'].map(h => (
                    <th key={h} className="text-left px-2 py-2.5 font-bold tracking-[0.1em]"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.symbol}
                    className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-2 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{r.symbol}</td>
                    <td className="px-2 py-2.5 max-w-[120px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.name}</td>
                    <td className="px-2 py-2.5">
                      <span className="px-1.5 py-0.5 text-[8px]" style={{
                        background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.2)',
                      }}>{r.category}</span>
                    </td>
                    <td className="px-2 py-2.5 font-bold" style={{ color: '#fff' }}>{fmt$(r.price)}</td>
                    <td className="px-2 py-2.5 font-bold" style={{ color: (r.change||0) >= 0 ? '#00ffb3' : '#ff3366' }}>
                      {fmtChg(r.change)}
                    </td>
                    <td className="px-2 py-2.5" style={{
                      color: r.rsi > 70 ? '#ff3366' : r.rsi < 30 ? '#00ffb3' : 'rgba(255,255,255,0.6)'
                    }}>{r.rsi}</td>
                    <td className="px-2 py-2.5" style={{ color: r.volSpike ? '#e8ff00' : 'rgba(255,255,255,0.35)' }}>
                      {r.volSpike ? '⚡' : ''}{fmt$(r.volume)}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.signals.slice(0, 3).map(sig => (
                          <span key={sig} className="px-1.5 py-0.5 text-[8px] font-bold"
                            style={{
                              background: sig.includes('Bullish') || sig.includes('High') || sig.includes('Gap Up') || sig.includes('Oversold')
                                ? 'rgba(0,255,179,0.08)' : 'rgba(255,51,102,0.08)',
                              color: sig.includes('Bullish') || sig.includes('High') || sig.includes('Gap Up') || sig.includes('Oversold')
                                ? '#00ffb3' : '#ff3366',
                              border: `1px solid ${sig.includes('Bullish') || sig.includes('High') || sig.includes('Gap Up') || sig.includes('Oversold')
                                ? 'rgba(0,255,179,0.15)' : 'rgba(255,51,102,0.15)'}`,
                            }}>{sig}</span>
                        ))}
                        {r.signals.length > 3 && (
                          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>+{r.signals.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Scanner legend */}
      <Card>
        <CardLabel>HOW THE SCANNER WORKS</CardLabel>
        <div className="grid md:grid-cols-2 gap-4 text-[9px]" style={{ fontFamily: 'monospace' }}>
          {[
            { label: 'RSI Oversold',         desc: 'RSI(14) below 30 — potential reversal zone' },
            { label: 'RSI Overbought',        desc: 'RSI(14) above 70 — potential reversal zone' },
            { label: 'MACD Bullish Cross',    desc: 'MACD histogram crossed from negative to positive' },
            { label: 'EMA Golden Cross',      desc: 'EMA20 crossed above EMA50 — bullish momentum' },
            { label: 'Volume Spike',          desc: 'Current volume > 2× 20-day average' },
            { label: '52W High/Low',          desc: 'Price within 0.1% of 52-week high or low' },
            { label: 'Gap Up/Down',           desc: 'Open price gapped >1% from previous close' },
            { label: 'Strong Move',           desc: 'Day change exceeds ±2% — momentum signal' },
          ].map(item => (
            <div key={item.label} className="flex gap-2">
              <div className="w-32 font-bold flex-shrink-0" style={{ color: '#e8ff00' }}>{item.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import {
  useWatchlist, useAddSymbol, useRemoveSymbol, useToggleFavorite,
  useAlerts, useCreateAlert, useDeleteAlert, useUpdateAlert,
  useSymbolSearch
} from '../../api/market/hooks';
import { PageHeader, Card, CardLabel, Input, Select, Btn, Spinner, Empty, Modal } from '../../components/ui/index';
import toast from 'react-hot-toast';

const ALERT_TYPES = [
  { value: 'PRICE_ABOVE',    label: 'Price Above' },
  { value: 'PRICE_BELOW',    label: 'Price Below' },
  { value: 'RSI_ABOVE',      label: 'RSI Above' },
  { value: 'RSI_BELOW',      label: 'RSI Below' },
  { value: 'MACD_CROSSOVER', label: 'MACD Crossover' },
  { value: 'EMA_CROSSOVER',  label: 'EMA Crossover' },
  { value: 'VOLUME_SPIKE',   label: 'Volume Spike' },
  { value: 'PERCENT_CHANGE', label: '% Change' },
];

const CATEGORIES = ['Forex','Futures','Commodities','Indices','Crypto','Indian Stocks','US Stocks'];

const fmt$ = v => v ? parseFloat((v||0).toFixed(5)) : '—';
const fmtChg = v => `${(v||0) >= 0 ? '+' : ''}${(v||0).toFixed(2)}%`;

export default function WatchlistPage() {
  const [tab, setTab]           = useState('watchlist'); // watchlist | alerts
  const [searchQ, setSearchQ]   = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertForm, setAlertForm]   = useState({
    symbol: '', type: 'PRICE_ABOVE', targetValue: '', message: '', notifyEmail: false,
  });

  const { data: watchlist, isLoading: loadWL } = useWatchlist();
  const { data: alerts,    isLoading: loadAl } = useAlerts();
  const { data: searched                      } = useSymbolSearch(searchQ.length >= 1 ? searchQ : null);

  const addSym    = useAddSymbol();
  const removeSym = useRemoveSymbol();
  const toggleFav = useToggleFavorite();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const updateAlert = useUpdateAlert();

  const symbols = watchlist?.symbols || [];
  const allAlerts = alerts || [];

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    await createAlert.mutateAsync({ ...alertForm, targetValue: parseFloat(alertForm.targetValue) });
    setAlertModal(false);
    setAlertForm({ symbol: '', type: 'PRICE_ABOVE', targetValue: '', message: '', notifyEmail: false });
  };

  const toggleAlertActive = (al) => updateAlert.mutate({ id: al._id, isActive: !al.isActive });

  const alertTypeLabel = (type) => ALERT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div>
          <div className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>// MARKET WATCH</div>
          <div className="font-display text-4xl" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>WATCHLIST & ALERTS</div>
        </div>
        <div className="flex gap-2">
          {tab === 'watchlist' && (
            <Btn onClick={() => setShowSearch(v => !v)} variant="outline">+ ADD SYMBOL</Btn>
          )}
          {tab === 'alerts' && (
            <Btn onClick={() => setAlertModal(true)}>+ NEW ALERT</Btn>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[['watchlist','WATCHLIST'],['alerts','ALERTS']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all"
            style={{
              fontFamily: 'monospace',
              color: tab === id ? '#e8ff00' : 'rgba(255,255,255,0.3)',
              borderBottom: tab === id ? '2px solid #e8ff00' : '2px solid transparent',
              background: 'transparent',
            }}>{label}
            {id === 'alerts' && allAlerts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[8px]" style={{ background: 'rgba(232,255,0,0.15)', color: '#e8ff00', fontFamily: 'monospace' }}>
                {allAlerts.filter(a => a.isActive).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'watchlist' ? (
        <>
          {/* Symbol search */}
          {showSearch && (
            <Card accent="#e8ff00">
              <CardLabel>SEARCH & ADD SYMBOL</CardLabel>
              <div className="relative">
                <Input
                  placeholder="Type symbol or name (e.g. Gold, AAPL, NIFTY...)"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
                {searched?.length > 0 && searchQ && (
                  <div className="absolute top-full left-0 right-0 z-50 border mt-1" style={{ background: '#0a0a0a', borderColor: 'rgba(232,255,0,0.15)' }}>
                    {searched.map(r => (
                      <div key={r.symbol}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <div>
                          <div className="text-[11px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{r.symbol}</div>
                          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{r.name} · {r.exchange}</div>
                        </div>
                        <Btn onClick={() => {
                          addSym.mutate({ symbol: r.symbol, name: r.name, category: 'US Stocks', exchange: r.exchange });
                          setSearchQ('');
                          setShowSearch(false);
                        }} variant="outline" className="text-[8px] px-2 py-1">ADD +</Btn>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Quick-add preset symbols */}
              <div className="mt-3">
                <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>QUICK ADD</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { symbol: 'XAUUSD', name: 'Gold',          category: 'Commodities' },
                    { symbol: 'BTCUSD', name: 'Bitcoin',        category: 'Crypto' },
                    { symbol: 'NIFTY50',name: 'Nifty 50',       category: 'Indices' },
                    { symbol: 'SPX',    name: 'S&P 500',        category: 'Indices' },
                    { symbol: 'AAPL',   name: 'Apple',          category: 'US Stocks' },
                    { symbol: 'NVDA',   name: 'NVIDIA',         category: 'US Stocks' },
                    { symbol: 'CRUDEOIL',name:'Crude Oil',      category: 'Commodities' },
                    { symbol: 'ETHUSD', name: 'Ethereum',       category: 'Crypto' },
                  ].map(s => (
                    <button key={s.symbol}
                      onClick={() => addSym.mutate(s)}
                      className="px-2.5 py-1 text-[9px] font-bold border transition-all hover:border-acid hover:text-acid"
                      style={{ fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                      + {s.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Watchlist table */}
          {loadWL ? <Spinner /> : symbols.length === 0 ? <Empty message="No symbols in watchlist — add some" /> : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]" style={{ fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['★','SYMBOL','NAME','CATEGORY','PRICE','CHANGE','HIGH','LOW','VOLUME',''].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.1em]"
                          style={{ color: 'rgba(255,255,255,0.2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {symbols.map(s => (
                      <tr key={s.symbol}
                        className="border-b transition-colors hover:bg-white/[0.02]"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-3 py-2.5">
                          <button onClick={() => toggleFav.mutate(s.symbol)}
                            className="text-sm transition-colors"
                            style={{ color: s.isFavorite ? '#e8ff00' : 'rgba(255,255,255,0.15)' }}>★</button>
                        </td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#e8ff00' }}>{s.symbol}</td>
                        <td className="px-3 py-2.5 max-w-[120px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.name}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 text-[8px]" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' }}>
                            {s.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: '#fff' }}>{fmt$(s.price)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: (s.change||0) >= 0 ? '#00ffb3' : '#ff3366' }}>
                          {fmtChg(s.change)}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt$(s.high)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt$(s.low)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {s.volume ? (s.volume >= 1e6 ? `${(s.volume/1e6).toFixed(1)}M` : s.volume >= 1000 ? `${(s.volume/1000).toFixed(0)}K` : s.volume) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-2">
                            <button onClick={() => {
                              setAlertForm(f => ({ ...f, symbol: s.symbol }));
                              setAlertModal(true);
                              setTab('alerts');
                            }} className="text-[8px] transition-colors hover:text-violet" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>ALERT</button>
                            <button onClick={() => {
                              if (confirm(`Remove ${s.symbol} from watchlist?`)) removeSym.mutate(s.symbol);
                            }} className="text-[8px] transition-colors hover:text-danger" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Alerts list */}
          {loadAl ? <Spinner /> : allAlerts.length === 0 ? <Empty message="No alerts set — create your first" icon="🔔" /> : (
            <div className="space-y-3">
              {allAlerts.map(al => (
                <div key={al._id} className="border p-4 flex items-center gap-4 transition-all card-glow"
                  style={{
                    background: 'rgba(10,10,10,0.9)',
                    borderColor: al.isActive ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${al.isActive ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                    opacity: al.isActive ? 1 : 0.5,
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="font-display text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>{al.symbol}</div>
                      <span className="text-[9px] px-2 py-0.5 font-bold" style={{
                        background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace',
                      }}>{alertTypeLabel(al.type)}</span>
                      {al.isTriggered && (
                        <span className="text-[9px] px-2 py-0.5 font-bold" style={{
                          background: 'rgba(0,255,179,0.1)', color: '#00ffb3',
                          border: '1px solid rgba(0,255,179,0.2)', fontFamily: 'monospace',
                        }}>TRIGGERED</span>
                      )}
                    </div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                      {al.targetValue !== undefined ? `Target: ${al.targetValue}` : ''}
                      {al.message ? ` · ${al.message}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle */}
                    <button onClick={() => toggleAlertActive(al)}
                      className="w-10 h-5 rounded-none relative transition-all"
                      style={{ background: al.isActive ? 'rgba(232,255,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${al.isActive ? '#e8ff00' : 'rgba(255,255,255,0.1)'}` }}>
                      <div className="absolute top-0.5 h-3.5 w-3.5 transition-all"
                        style={{ left: al.isActive ? 'calc(100% - 16px)' : '2px', background: al.isActive ? '#e8ff00' : 'rgba(255,255,255,0.2)' }} />
                    </button>
                    <button onClick={() => { if (confirm('Delete alert?')) deleteAlert.mutate(al._id); }}
                      className="text-[9px] transition-colors hover:text-danger" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create alert modal */}
      <Modal open={alertModal} onClose={() => setAlertModal(false)} title="CREATE ALERT">
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="SYMBOL *" placeholder="XAUUSD" value={alertForm.symbol}
              onChange={e => setAlertForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} required />
            <Select label="ALERT TYPE *" value={alertForm.type}
              onChange={e => setAlertForm(f => ({ ...f, type: e.target.value }))}>
              {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <Input label="TARGET VALUE" type="number" step="any" placeholder="e.g. 2400 for price, 70 for RSI"
            value={alertForm.targetValue}
            onChange={e => setAlertForm(f => ({ ...f, targetValue: e.target.value }))} />
          <Input label="NOTE (optional)" placeholder="Describe this alert..."
            value={alertForm.message}
            onChange={e => setAlertForm(f => ({ ...f, message: e.target.value }))} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="notify" checked={alertForm.notifyEmail}
              onChange={e => setAlertForm(f => ({ ...f, notifyEmail: e.target.checked }))} />
            <label htmlFor="notify" className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              Notify via email when triggered
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={createAlert.isPending} className="flex-1 py-2.5">
              {createAlert.isPending ? 'CREATING...' : 'CREATE ALERT →'}
            </Btn>
            <Btn variant="ghost" onClick={() => setAlertModal(false)}>CANCEL</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

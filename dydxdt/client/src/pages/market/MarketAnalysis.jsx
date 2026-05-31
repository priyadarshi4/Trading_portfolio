import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCandles, useAnalysis, useWatchlist, useAddSymbol, useRemoveSymbol, useToggleFavorite, useSymbolSearch } from '../../api/market/hooks';
import LightweightChart from '../../components/market/LightweightChart';
import { Spinner, Badge } from '../../components/ui/index';

const TIMEFRAMES = ['1m','5m','15m','30m','1H','4H','D1','W1','MN'];
const CHART_TYPES = [
  { id: 'candlestick', label: '🕯' },
  { id: 'heikinashi',  label: '⬛' },
  { id: 'line',        label: '📈' },
  { id: 'area',        label: '▲' },
];
const INDICATOR_OPTIONS = ['EMA20','EMA50','EMA200','SMA20','BB','VWAP'];
const CATEGORIES = ['All','Indices','Forex','Crypto','Commodities','Futures','Indian Stocks','US Stocks'];

const fmt$ = v => {
  if (!v && v !== 0) return '—';
  return v >= 1000 ? `${(v/1000).toFixed(2)}k` : parseFloat(v.toFixed(5));
};
const fmtChg = v => v >= 0 ? `+${v?.toFixed(2)}%` : `${v?.toFixed(2)}%`;

const SentimentMeter = ({ value = 50 }) => {
  const labels = ['Extreme Fear','Fear','Neutral','Greed','Extreme Greed'];
  const idx = Math.min(4, Math.floor(value / 20));
  const colors = ['#ff3366','#ff6b35','#e8ff00','#00ffb3','#00ff88'];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>MARKET SENTIMENT</div>
        <div className="text-[10px] font-bold" style={{ color: colors[idx], fontFamily: 'monospace' }}>{labels[idx]}</div>
      </div>
      <div className="relative h-2 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, #ff3366, #e8ff00, #00ffb3)`, clipPath: `inset(0 ${100-value}% 0 0)` }} />
        <div className="absolute top-0 h-full w-0.5" style={{ left: `${value}%`, background: '#fff', transform: 'translateX(-50%)' }} />
      </div>
      <div className="text-center font-display text-2xl" style={{ color: colors[idx] }}>{value}</div>
    </div>
  );
};

const MTFRow = ({ tf, trend, rsi, macd, recommendation }) => {
  const recColor = {
    'Strong Buy': '#00ffb3', 'Buy': '#e8ff00', 'Neutral': 'rgba(255,255,255,0.4)',
    'Sell': '#ff6b35', 'Strong Sell': '#ff3366',
  }[recommendation] || 'rgba(255,255,255,0.4)';
  return (
    <div className="flex items-center gap-2 py-2 border-b text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
      <div className="w-8 font-bold" style={{ color: '#e8ff00' }}>{tf}</div>
      <div className="w-16" style={{ color: trend === 'Bullish' ? '#00ffb3' : trend === 'Bearish' ? '#ff3366' : 'rgba(255,255,255,0.4)' }}>{trend}</div>
      <div className="w-12" style={{ color: rsi > 70 ? '#ff3366' : rsi < 30 ? '#00ffb3' : 'rgba(255,255,255,0.5)' }}>{rsi}</div>
      <div className="w-20" style={{ color: macd === 'Bullish' || macd?.includes('Bullish') ? '#00ffb3' : '#ff3366' }}>{macd}</div>
      <div className="flex-1 text-right font-bold" style={{ color: recColor }}>{recommendation}</div>
    </div>
  );
};

export default function MarketAnalysisPage() {
  const [symbol,       setSymbol]       = useState('XAUUSD');
  const [inputSym,     setInputSym]     = useState('XAUUSD');
  const [timeframe,    setTimeframe]    = useState('D1');
  const [chartType,    setChartType]    = useState('candlestick');
  const [activeInds,   setActiveInds]   = useState(['EMA20','EMA50']);
  const [searchQ,      setSearchQ]      = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [tab,          setTab]          = useState('analysis'); // analysis | mtf | signals | patterns

  const { data: marketData, isLoading: loadChart }    = useCandles(symbol, timeframe, 400);
  const { data: analysis,   isLoading: loadAnalysis } = useAnalysis(symbol, 'D1');
  const { data: watchlist                            } = useWatchlist();
  const { data: searched                             } = useSymbolSearch(searchQ.length >= 1 ? searchQ : null);
  const addSym      = useAddSymbol();
  const removeSym   = useRemoveSymbol();
  const toggleFav   = useToggleFavorite();

  const candles = marketData?.candles || [];
  const symbols = watchlist?.symbols || [];
  const filteredSymbols = catFilter === 'All' ? symbols : symbols.filter(s => s.category === catFilter);

  const toggleIndicator = (ind) =>
    setActiveInds(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);

  const trendColor = analysis?.trend === 'Bullish' ? '#00ffb3' : analysis?.trend === 'Bearish' ? '#ff3366' : '#e8ff00';

  return (
    <div className="flex h-full gap-0 animate-fade-in" style={{ height: 'calc(100vh - 90px)', overflow: 'hidden' }}>

      {/* LEFT — Watchlist panel */}
      <div className="flex-shrink-0 flex flex-col border-r" style={{ width: 220, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Search */}
        <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <input
            className="w-full px-2 py-1.5 text-[10px] outline-none border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#e8ff00', fontFamily: 'monospace' }}
            placeholder="Search symbol..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {/* Search results dropdown */}
          {searched?.length > 0 && searchQ && (
            <div className="absolute z-50 mt-1 border" style={{ width: 210, background: '#0a0a0a', borderColor: 'rgba(232,255,0,0.2)' }}>
              {searched.map(r => (
                <div key={r.symbol}
                  className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-white/5"
                  onClick={() => { setSymbol(r.symbol); setInputSym(r.symbol); setSearchQ(''); }}>
                  <div>
                    <div className="text-[10px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{r.symbol}</div>
                    <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{r.name}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); addSym.mutate({ symbol: r.symbol, name: r.name, category: 'US Stocks' }); }}
                    className="text-[9px] px-1.5 py-0.5 border" style={{ borderColor: 'rgba(232,255,0,0.2)', color: '#e8ff00', fontFamily: 'monospace' }}>+</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-px p-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {['All','Forex','Crypto','Indices','Commodities'].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className="px-1.5 py-0.5 text-[8px] font-bold tracking-wide"
              style={{
                fontFamily: 'monospace',
                background: catFilter === cat ? 'rgba(232,255,0,0.1)' : 'transparent',
                color: catFilter === cat ? '#e8ff00' : 'rgba(255,255,255,0.25)',
              }}>{cat}</button>
          ))}
        </div>

        {/* Symbol list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSymbols.map(s => (
            <div
              key={s.symbol}
              onClick={() => { setSymbol(s.symbol); setInputSym(s.symbol); }}
              className="flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors border-b hover:bg-white/[0.02]"
              style={{ borderColor: 'rgba(255,255,255,0.03)', background: symbol === s.symbol ? 'rgba(232,255,0,0.04)' : 'transparent', borderLeft: symbol === s.symbol ? '2px solid #e8ff00' : '2px solid transparent' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold truncate" style={{ color: symbol === s.symbol ? '#e8ff00' : '#fff', fontFamily: 'monospace' }}>{s.symbol}</div>
                <div className="text-[8px] truncate" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{s.name}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{fmt$(s.price)}</div>
                <div className="text-[8px]" style={{ color: (s.change||0) >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>{fmtChg(s.change)}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleFav.mutate(s.symbol); }}
                className="text-[10px]" style={{ color: s.isFavorite ? '#e8ff00' : 'rgba(255,255,255,0.15)' }}>★</button>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER — Chart + controls */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chart toolbar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b flex-shrink-0 flex-wrap"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* Symbol input */}
          <input
            className="px-2 py-1 text-[11px] font-bold border outline-none w-24"
            style={{ background: 'rgba(232,255,0,0.05)', borderColor: 'rgba(232,255,0,0.2)', color: '#e8ff00', fontFamily: 'monospace' }}
            value={inputSym}
            onChange={e => setInputSym(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') setSymbol(inputSym); }}
          />
          {/* Timeframes */}
          <div className="flex gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className="px-1.5 py-0.5 text-[9px] font-bold transition-all"
                style={{
                  fontFamily: 'monospace',
                  background: timeframe === tf ? '#e8ff00' : 'transparent',
                  color: timeframe === tf ? '#000' : 'rgba(255,255,255,0.3)',
                }}>{tf}</button>
            ))}
          </div>
          {/* Chart type */}
          <div className="flex gap-0.5 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {CHART_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setChartType(ct.id)}
                className="px-2 py-0.5 text-[11px] transition-all"
                style={{ background: chartType === ct.id ? 'rgba(232,255,0,0.1)' : 'transparent', borderRadius: 2 }}
                title={ct.id}>{ct.label}</button>
            ))}
          </div>
          {/* Indicators */}
          <div className="flex gap-1 border-l pl-3 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {INDICATOR_OPTIONS.map(ind => (
              <button key={ind} onClick={() => toggleIndicator(ind)}
                className="px-1.5 py-0.5 text-[8px] font-bold border transition-all"
                style={{
                  fontFamily: 'monospace',
                  borderColor: activeInds.includes(ind) ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                  color: activeInds.includes(ind) ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                  background: activeInds.includes(ind) ? 'rgba(232,255,0,0.08)' : 'transparent',
                }}>{ind}</button>
            ))}
          </div>
          {/* Price display */}
          <div className="ml-auto flex items-center gap-3">
            {marketData && (
              <>
                <div className="font-display text-lg" style={{ color: '#e8ff00' }}>{fmt$(marketData.price)}</div>
                <div className="text-[10px] font-bold" style={{ color: marketData.change >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                  {fmtChg(marketData.change)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          {loadChart ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-t-acid rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(232,255,0,0.15)', borderTopColor: '#e8ff00' }} />
                <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>Fetching {symbol}...</div>
              </div>
            </div>
          ) : candles.length > 0 ? (
            <LightweightChart
              candles={candles}
              symbol={symbol}
              indicators={activeInds}
              chartType={chartType}
              height={undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>No chart data available</div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Analysis panel */}
      <div className="flex-shrink-0 flex flex-col border-l overflow-y-auto" style={{ width: 280, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {[['analysis','ANALYSIS'],['mtf','MTF'],['patterns','PATTERNS']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 text-[8px] font-bold tracking-wider transition-all"
              style={{
                fontFamily: 'monospace',
                color: tab === id ? '#e8ff00' : 'rgba(255,255,255,0.25)',
                borderBottom: tab === id ? '2px solid #e8ff00' : '2px solid transparent',
                background: tab === id ? 'rgba(232,255,0,0.03)' : 'transparent',
              }}>{label}</button>
          ))}
        </div>

        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {loadAnalysis ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-t-acid rounded-full animate-spin" style={{ borderColor: 'rgba(232,255,0,0.1)', borderTopColor: '#e8ff00' }} />
            </div>
          ) : !analysis ? (
            <div className="text-center py-10 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>Select a symbol to analyze</div>
          ) : tab === 'analysis' ? (
            <>
              {/* Trend block */}
              <div className="p-3 border" style={{ borderColor: `${trendColor}30`, background: `${trendColor}08` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>TREND</div>
                  <div className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{analysis.trendStrength}</div>
                </div>
                <div className="font-display text-2xl" style={{ color: trendColor }}>{analysis.trend?.toUpperCase()}</div>
                <div className="text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Bias: <span style={{ color: analysis.bias === 'Long' ? '#00ffb3' : analysis.bias === 'Short' ? '#ff3366' : '#e8ff00' }}>{analysis.bias}</span></div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between text-[8px] mb-1" style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                  <span>CONFIDENCE</span><span style={{ color: '#e8ff00' }}>{analysis.confidence}%</span>
                </div>
                <div className="h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full" style={{ width: `${analysis.confidence}%`, background: 'linear-gradient(90deg, #a78bfa, #e8ff00)' }} />
                </div>
              </div>

              {/* Key metrics */}
              <div className="space-y-0">
                {[
                  { label: 'RSI (14)',     value: `${analysis.rsi}`, color: analysis.rsi > 70 ? '#ff3366' : analysis.rsi < 30 ? '#00ffb3' : '#e8ff00' },
                  { label: 'MACD',        value: analysis.macdSignal, color: analysis.macdSignal?.includes('Bullish') ? '#00ffb3' : '#ff3366' },
                  { label: 'VOLUME',      value: analysis.volumeStatus },
                  { label: 'RISK LEVEL',  value: analysis.riskLevel, color: analysis.riskLevel === 'High' ? '#ff3366' : analysis.riskLevel === 'Medium' ? '#e8ff00' : '#00ffb3' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between py-1.5 border-b text-[9px]" style={{ borderColor: 'rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</span>
                    <span style={{ color: m.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Sentiment */}
              <SentimentMeter value={analysis.sentiment} />

              {/* Support & Resistance */}
              <div>
                <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>RESISTANCE</div>
                {(analysis.resistanceLevels || []).slice(0,3).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,51,102,0.3)' }} />
                    <div className="text-[9px] font-bold" style={{ color: '#ff3366', fontFamily: 'monospace' }}>{fmt$(l)}</div>
                  </div>
                ))}
                <div className="my-2 text-center text-[8px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>── PRICE ──</div>
                <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>SUPPORT</div>
                {(analysis.supportLevels || []).slice(0,3).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="text-[9px] font-bold" style={{ color: '#00ffb3', fontFamily: 'monospace' }}>{fmt$(l)}</div>
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,255,179,0.3)' }} />
                  </div>
                ))}
              </div>

              {/* Trade Signal */}
              {analysis.signal && analysis.signal.type !== 'NEUTRAL' && (
                <div className="p-3 border" style={{
                  borderColor: analysis.signal.type === 'LONG' ? 'rgba(0,255,179,0.2)' : 'rgba(255,51,102,0.2)',
                  background: analysis.signal.type === 'LONG' ? 'rgba(0,255,179,0.04)' : 'rgba(255,51,102,0.04)',
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>TRADE SIGNAL</div>
                    <div className="text-[9px] font-bold" style={{ color: analysis.signal.type === 'LONG' ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                      {analysis.signal.type === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                    </div>
                  </div>
                  {[
                    { label: 'Entry',    value: fmt$(analysis.signal.entry) },
                    { label: 'SL',       value: fmt$(analysis.signal.stopLoss), color: '#ff3366' },
                    { label: 'Target 1', value: fmt$(analysis.signal.target1),  color: '#00ffb3' },
                    { label: 'Target 2', value: fmt$(analysis.signal.target2),  color: '#00ffb3' },
                    { label: 'R:R',      value: `${analysis.signal.rr}:1`,      color: '#a78bfa' },
                    { label: 'Conf.',    value: `${analysis.confidence}%`,       color: '#e8ff00' },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between text-[9px] py-0.5" style={{ fontFamily: 'monospace' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</span>
                      <span style={{ color: m.color || 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : tab === 'mtf' ? (
            <>
              <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>MULTI-TIMEFRAME ANALYSIS</div>
              <div className="flex text-[8px] mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                <div className="w-8">TF</div><div className="w-16">TREND</div><div className="w-12">RSI</div><div className="w-20">MACD</div><div className="flex-1 text-right">REC</div>
              </div>
              {(analysis.mtf || []).map(m => <MTFRow key={m.timeframe} {...m} />)}
            </>
          ) : tab === 'patterns' ? (
            <>
              <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>DETECTED PATTERNS</div>
              {(analysis.patterns || []).length === 0 ? (
                <div className="text-center py-8 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>No patterns detected</div>
              ) : (
                <div className="space-y-2">
                  {(analysis.patterns || []).map((p, i) => (
                    <div key={i} className="p-3 border" style={{
                      borderColor: p.direction === 'Bullish' ? 'rgba(0,255,179,0.15)' : p.direction === 'Bearish' ? 'rgba(255,51,102,0.15)' : 'rgba(255,255,255,0.06)',
                      background: 'rgba(10,10,10,0.9)',
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{p.name}</div>
                        <div className="text-[8px]" style={{ color: p.direction === 'Bullish' ? '#00ffb3' : p.direction === 'Bearish' ? '#ff3366' : '#e8ff00', fontFamily: 'monospace' }}>{p.direction}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full" style={{ width: `${p.confidence}%`, background: p.direction === 'Bullish' ? '#00ffb3' : '#ff3366' }} />
                        </div>
                        <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{p.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Indicators snapshot */}
              {analysis.indicators && (
                <div className="mt-4 space-y-0">
                  <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>INDICATORS</div>
                  {[
                    { label: 'EMA 20',  value: fmt$(analysis.indicators.ema20) },
                    { label: 'EMA 50',  value: fmt$(analysis.indicators.ema50) },
                    { label: 'EMA 200', value: fmt$(analysis.indicators.ema200) },
                    { label: 'BB Upper', value: fmt$(analysis.indicators.bbUpper) },
                    { label: 'BB Lower', value: fmt$(analysis.indicators.bbLower) },
                    { label: 'ATR(14)',  value: fmt$(analysis.indicators.atr) },
                    { label: 'Stoch K', value: `${analysis.indicators.stochK}` },
                    { label: 'Supertrend', value: analysis.indicators.supertrendBull ? 'Bullish' : 'Bearish', color: analysis.indicators.supertrendBull ? '#00ffb3' : '#ff3366' },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between py-1 border-b text-[9px]" style={{ borderColor: 'rgba(255,255,255,0.03)', fontFamily: 'monospace' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</span>
                      <span style={{ color: m.color || 'rgba(255,255,255,0.6)' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

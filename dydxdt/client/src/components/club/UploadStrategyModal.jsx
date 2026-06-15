import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateStrategyListing, useUpdateStrategyListing, useStrategyCategories } from '../../api/club/strategyHooks';

const ASSET_CLASSES  = ['Stocks','Forex','Futures','Crypto','Commodities','Indices','Options','Mixed'];
const DIFFICULTIES   = ['Beginner','Intermediate','Advanced','Expert'];
const COMMON_INDICATORS = ['RSI','MACD','EMA','SMA','Bollinger Bands','ATR','VWAP','Supertrend','Stochastic','CCI','Volume','Price Action'];
const COMMON_TIMEFRAMES  = ['1m','5m','15m','30m','1H','4H','Daily','Weekly','Monthly'];

const EMPTY_FORM = {
  title:'', tagline:'', description:'', category:'Swing Trading Strategies',
  assetClass:'Stocks', difficulty:'Intermediate',
  markets: [{ symbol:'', exchange:'' }],
  stats: { totalTrades:0, avgGainPerTrade:0, winRate:0, profitFactor:0, annualReturn:0, maxDrawdown:0, sharpeRatio:0, backtestPeriod:'' },
  coverImage:{ url:'', publicId:'' },
  equityCurveImage:{ url:'', publicId:'' },
  images:[],
  entryRules:[''], exitRules:[''], riskRules:[''],
  indicators:[], timeframes:[], tags:'',
  isFree:true, price:0,
};

export default function UploadStrategyModal({ open, onClose, editing = null }) {
  const { data: categories } = useStrategyCategories();
  const createListing = useCreateStrategyListing();
  const updateListing = useUpdateStrategyListing();

  const [form, setForm]     = useState(EMPTY_FORM);
  const [step, setStep]     = useState(1);   // 1-basic 2-stats 3-rules 4-media
  const TOTAL_STEPS = 4;

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setForm({
        ...EMPTY_FORM, ...editing,
        tags:       (editing.tags || []).join(', '),
        markets:    editing.markets?.length ? editing.markets : [{ symbol:'', exchange:'' }],
        entryRules: editing.entryRules?.length ? editing.entryRules : [''],
        exitRules:  editing.exitRules?.length  ? editing.exitRules  : [''],
        riskRules:  editing.riskRules?.length  ? editing.riskRules  : [''],
        stats:      { ...EMPTY_FORM.stats, ...(editing.stats || {}) },
        coverImage: editing.coverImage || { url:'', publicId:'' },
        equityCurveImage: editing.equityCurveImage || { url:'', publicId:'' },
        images:     editing.images || [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setStep(1);
  }, [editing, open]);

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setStat = (k, v) => setForm(p => ({ ...p, stats: { ...p.stats, [k]: v } }));

  // Rules helpers
  const addRule = (field) => set(field, [...form[field], '']);
  const setRule = (field, i, v) => set(field, form[field].map((r, idx) => idx === i ? v : r));
  const delRule = (field, i) => set(field, form[field].filter((_, idx) => idx !== i));

  // Markets helpers
  const addMarket   = () => set('markets', [...form.markets, { symbol:'', exchange:'' }]);
  const setMarket   = (i, k, v) => set('markets', form.markets.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  const delMarket   = (i) => set('markets', form.markets.filter((_, idx) => idx !== i));

  // Images
  const addImage    = () => {
    const url = prompt('Paste image URL (TradingView screenshot, imgur, etc.):');
    if (url && url.startsWith('http')) set('images', [...form.images, { url, caption:'' }]);
  };
  const delImage    = (i) => set('images', form.images.filter((_, idx) => idx !== i));

  // Toggle indicator / timeframe
  const toggleInd = (ind) => set('indicators', form.indicators.includes(ind) ? form.indicators.filter(x => x !== ind) : [...form.indicators, ind]);
  const toggleTf  = (tf)  => set('timeframes',  form.timeframes.includes(tf)   ? form.timeframes.filter(x => x !== tf)   : [...form.timeframes, tf]);

  const handleSubmit = async () => {
    const payload = {
      ...form,
      tags:    form.tags.split(',').map(t => t.trim()).filter(Boolean),
      markets: form.markets.filter(m => m.symbol.trim()),
      entryRules: form.entryRules.filter(r => r.trim()),
      exitRules:  form.exitRules.filter(r => r.trim()),
      riskRules:  form.riskRules.filter(r => r.trim()),
      stats: {
        ...form.stats,
        totalTrades:     parseFloat(form.stats.totalTrades)     || 0,
        avgGainPerTrade: parseFloat(form.stats.avgGainPerTrade) || 0,
        winRate:         parseFloat(form.stats.winRate)         || 0,
        profitFactor:    parseFloat(form.stats.profitFactor)    || 0,
        annualReturn:    parseFloat(form.stats.annualReturn)    || 0,
        maxDrawdown:     parseFloat(form.stats.maxDrawdown)     || 0,
        sharpeRatio:     parseFloat(form.stats.sharpeRatio)     || 0,
      },
      price: form.isFree ? 0 : parseFloat(form.price) || 0,
    };
    if (editing) {
      await updateListing.mutateAsync({ id: editing._id, ...payload });
    } else {
      await createListing.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createListing.isPending || updateListing.isPending;

  // ── STEP INDICATOR ────────────────────────────────────────────────────────
  const StepDot = ({ n }) => (
    <div className="flex items-center gap-1">
      <div className="w-6 h-6 flex items-center justify-center text-[9px] font-bold border"
        style={{
          background: step >= n ? '#e8ff00' : 'transparent',
          borderColor: step >= n ? '#e8ff00' : 'rgba(255,255,255,0.15)',
          color: step >= n ? '#000' : 'rgba(255,255,255,0.3)',
          fontFamily: 'monospace',
        }}>{n}</div>
      {n < TOTAL_STEPS && <div className="w-6 h-px" style={{ background: step > n ? '#e8ff00' : 'rgba(255,255,255,0.1)' }} />}
    </div>
  );

  const inputClass = "input-dark";
  const labelClass = "label-mono";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
        <motion.div
          initial={{ opacity:0, y:40 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:40 }}
          transition={{ duration:0.2 }}
          className="w-full sm:max-w-2xl max-h-[94vh] overflow-y-auto border"
          style={{ background:'#080808', borderColor:'rgba(232,255,0,0.18)', borderRadius: '4px 4px 0 0' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background:'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:'rgba(255,255,255,0.07)' }}>
            <div>
              <div className="text-[8px] tracking-[0.3em] uppercase mb-0.5" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>// STRATEGY MARKETPLACE</div>
              <div className="font-display text-xl" style={{ color:'#e8ff00', letterSpacing:'0.05em' }}>
                {editing ? 'EDIT STRATEGY' : 'PUBLISH STRATEGY'}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-sm hover:text-white transition-colors" style={{ color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>✕</button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 px-5 py-3 border-b" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            {[1,2,3,4].map(n => <StepDot key={n} n={n} />)}
            <div className="ml-4 text-[9px]" style={{ color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>
              {['BASIC INFO','STATISTICS','RULES','MEDIA & PUBLISH'][step-1]}
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* ── STEP 1: BASIC INFO ── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={labelClass}>STRATEGY TITLE *</label>
                  <input className={inputClass} placeholder="e.g. Triple RSI Trading Strategy – S&P 500"
                    value={form.title} onChange={e => set('title', e.target.value)} maxLength={150} />
                </div>

                {/* Tagline */}
                <div>
                  <label className={labelClass}>TAGLINE (1 sentence)</label>
                  <input className={inputClass} placeholder="Short punchy description shown on the card..."
                    value={form.tagline} onChange={e => set('tagline', e.target.value)} maxLength={200} />
                </div>

                {/* Category */}
                <div>
                  <label className={labelClass}>STRATEGY CATEGORY *</label>
                  <select className={inputClass} style={{ background:'#0a0a0a', minHeight:42 }}
                    value={form.category} onChange={e => set('category', e.target.value)}>
                    {(categories || []).filter(c => c !== 'All Strategies').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Asset class + difficulty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>ASSET CLASS</label>
                    <select className={inputClass} style={{ background:'#0a0a0a', minHeight:42 }}
                      value={form.assetClass} onChange={e => set('assetClass', e.target.value)}>
                      {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>DIFFICULTY</label>
                    <select className={inputClass} style={{ background:'#0a0a0a', minHeight:42 }}
                      value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                      {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Markets */}
                <div>
                  <label className={labelClass}>MARKETS / SYMBOLS</label>
                  {form.markets.map((m, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input className={inputClass} placeholder="Symbol (e.g. SPY, NIFTY)"
                        value={m.symbol} onChange={e => setMarket(i, 'symbol', e.target.value.toUpperCase())} />
                      <input className={inputClass} style={{ width:100 }} placeholder="Exchange"
                        value={m.exchange} onChange={e => setMarket(i, 'exchange', e.target.value.toUpperCase())} />
                      {form.markets.length > 1 && (
                        <button type="button" onClick={() => delMarket(i)} className="px-2 text-sm" style={{ color:'#ff3366' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addMarket}
                    className="text-[9px] font-bold transition-colors hover:text-acid"
                    style={{ color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>+ ADD MARKET</button>
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>FULL DESCRIPTION *</label>
                  <textarea className={inputClass} rows={5}
                    placeholder="Explain the strategy in detail — when it works, why it works, market conditions, history..."
                    value={form.description} onChange={e => set('description', e.target.value)} maxLength={8000} />
                  <div className="text-right text-[8px] mt-0.5" style={{ color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>
                    {form.description.length}/8000
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className={labelClass}>TAGS (comma-separated)</label>
                  <input className={inputClass} placeholder="mean-reversion, rsi, spy, backtest..."
                    value={form.tags} onChange={e => set('tags', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── STEP 2: STATISTICS ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-[9px] px-3 py-2 border-l-2" style={{ borderColor:'#e8ff00', background:'rgba(232,255,0,0.04)', color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>
                  Enter your backtest or live trading statistics. These appear as the headline stats on your card — like the checkmarks in the quantifiedstrategies.com layout. Leave 0 if not applicable.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key:'totalTrades',     label:'TOTAL TRADES',        ph:'97'     },
                    { key:'winRate',          label:'WIN RATE (%)',         ph:'65'     },
                    { key:'avgGainPerTrade',  label:'AVG GAIN / TRADE (%)', ph:'1.2'   },
                    { key:'profitFactor',     label:'PROFIT FACTOR',        ph:'2.5'   },
                    { key:'annualReturn',     label:'ANNUAL RETURN (%)',     ph:'18.5'  },
                    { key:'maxDrawdown',      label:'MAX DRAWDOWN (%)',      ph:'12.0'  },
                    { key:'sharpeRatio',      label:'SHARPE RATIO',          ph:'1.8'   },
                    { key:'avgHoldingDays',   label:'AVG HOLDING (DAYS)',    ph:'3'     },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <input className={inputClass} type="number" step="any" placeholder={f.ph}
                        value={form.stats[f.key] || ''} onChange={e => setStat(f.key, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className={labelClass}>BACKTEST PERIOD (e.g. 2010–2024)</label>
                  <input className={inputClass} placeholder="2010–2024"
                    value={form.stats.backtestPeriod || ''}
                    onChange={e => setStat('backtestPeriod', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── STEP 3: RULES ── */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Indicators */}
                <div>
                  <label className={labelClass}>INDICATORS USED</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {COMMON_INDICATORS.map(ind => (
                      <button key={ind} type="button" onClick={() => toggleInd(ind)}
                        className="px-2.5 py-1.5 text-[9px] font-bold border transition-all"
                        style={{
                          fontFamily:'monospace',
                          borderColor: form.indicators.includes(ind) ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                          color:       form.indicators.includes(ind) ? '#38bdf8' : 'rgba(255,255,255,0.3)',
                          background:  form.indicators.includes(ind) ? 'rgba(56,189,248,0.08)' : 'transparent',
                        }}>{ind}</button>
                    ))}
                  </div>
                  <input className={`${inputClass} mt-2`} placeholder="Type custom indicator..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { set('indicators', [...form.indicators, v]); e.target.value = ''; } }}} />
                </div>

                {/* Timeframes */}
                <div>
                  <label className={labelClass}>TIMEFRAMES</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {COMMON_TIMEFRAMES.map(tf => (
                      <button key={tf} type="button" onClick={() => toggleTf(tf)}
                        className="px-2.5 py-1.5 text-[9px] font-bold border transition-all"
                        style={{
                          fontFamily:'monospace',
                          borderColor: form.timeframes.includes(tf) ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                          color:       form.timeframes.includes(tf) ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                          background:  form.timeframes.includes(tf) ? 'rgba(167,139,250,0.08)' : 'transparent',
                        }}>{tf}</button>
                    ))}
                  </div>
                </div>

                {/* Rules sections */}
                {[
                  { field:'entryRules', label:'ENTRY RULES', color:'#00ffb3', ph:'e.g. RSI(2) closes below 10' },
                  { field:'exitRules',  label:'EXIT RULES',  color:'#ff3366', ph:'e.g. Price closes above 5-day high' },
                  { field:'riskRules',  label:'RISK RULES',  color:'#e8ff00', ph:'e.g. Never risk more than 1% per trade' },
                ].map(({ field, label, color, ph }) => (
                  <div key={field}>
                    <label className={labelClass} style={{ color: `${color}80` }}>{label}</label>
                    {form[field].map((rule, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <div className="flex-shrink-0 w-5 h-9 flex items-center justify-center text-[9px] font-bold mt-0.5"
                          style={{ color, fontFamily:'monospace' }}>{i+1}.</div>
                        <input className={`${inputClass} flex-1`} placeholder={ph}
                          value={rule} onChange={e => setRule(field, i, e.target.value)} />
                        {form[field].length > 1 && (
                          <button type="button" onClick={() => delRule(field, i)}
                            className="px-2 text-sm flex-shrink-0" style={{ color:'rgba(255,255,255,0.2)' }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addRule(field)}
                      className="text-[9px] font-bold hover:text-acid transition-colors"
                      style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>+ ADD {label.split(' ')[0]} RULE</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 4: MEDIA + PUBLISH ── */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Cover image URL */}
                <div>
                  <label className={labelClass}>COVER IMAGE URL</label>
                  <div className="text-[8px] mb-1" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>
                    Paste any public image URL (TradingView screenshot, Imgur, etc.). This shows as the card background.
                  </div>
                  <input className={inputClass} placeholder="https://..."
                    value={form.coverImage?.url || ''} onChange={e => set('coverImage', { url:e.target.value, publicId:'' })} />
                  {form.coverImage?.url && (
                    <img src={form.coverImage.url} alt="cover preview"
                      className="mt-2 w-full h-24 object-cover border" style={{ borderColor:'rgba(255,255,255,0.08)' }}
                      onError={e => e.target.style.display='none'} />
                  )}
                </div>

                {/* Equity curve image */}
                <div>
                  <label className={labelClass}>EQUITY CURVE IMAGE URL</label>
                  <div className="text-[8px] mb-1" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>
                    Upload your backtest equity curve chart (shows in bottom-right of card like the screenshot).
                  </div>
                  <input className={inputClass} placeholder="https://..."
                    value={form.equityCurveImage?.url || ''}
                    onChange={e => set('equityCurveImage', { url:e.target.value, publicId:'' })} />
                </div>

                {/* Gallery images */}
                <div>
                  <label className={labelClass}>STRATEGY GALLERY (up to 8 images)</label>
                  <div className="text-[8px] mb-2" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>
                    Add TradingView chart screenshots, entry examples, backtest results etc.
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.url} alt={`img ${i+1}`}
                          className="w-full h-16 object-cover border" style={{ borderColor:'rgba(255,255,255,0.08)' }}
                          onError={e => e.target.style.display='none'} />
                        <button type="button" onClick={() => delImage(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background:'rgba(0,0,0,0.8)', color:'#ff3366' }}>✕</button>
                      </div>
                    ))}
                    {form.images.length < 8 && (
                      <button type="button" onClick={addImage}
                        className="h-16 flex flex-col items-center justify-center gap-1 border transition-all hover:border-acid/30"
                        style={{ borderColor:'rgba(255,255,255,0.08)', borderStyle:'dashed', color:'rgba(255,255,255,0.2)' }}>
                        <span className="text-lg">+</span>
                        <span className="text-[7px]" style={{ fontFamily:'monospace' }}>ADD URL</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <label className={labelClass}>PRICING</label>
                  <div className="flex gap-3 mb-3">
                    {[true, false].map(isFree => (
                      <button key={String(isFree)} type="button" onClick={() => set('isFree', isFree)}
                        className="flex-1 py-3 text-[10px] font-bold border transition-all"
                        style={{
                          fontFamily:'monospace',
                          background: form.isFree === isFree ? (isFree ? 'rgba(0,255,179,0.1)' : 'rgba(232,255,0,0.1)') : 'transparent',
                          borderColor: form.isFree === isFree ? (isFree ? 'rgba(0,255,179,0.3)' : 'rgba(232,255,0,0.3)') : 'rgba(255,255,255,0.08)',
                          color: form.isFree === isFree ? (isFree ? '#00ffb3' : '#e8ff00') : 'rgba(255,255,255,0.3)',
                        }}>{isFree ? '🆓 FREE' : '💰 PAID'}</button>
                    ))}
                  </div>
                  {!form.isFree && (
                    <input className={inputClass} type="number" step="0.01" placeholder="Price in USD (e.g. 199)"
                      value={form.price || ''} onChange={e => set('price', e.target.value)} />
                  )}
                </div>

                {/* Summary before publish */}
                <div className="border p-4 space-y-2" style={{ borderColor:'rgba(232,255,0,0.15)', background:'rgba(232,255,0,0.03)' }}>
                  <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>// PUBLISH SUMMARY</div>
                  {[
                    { label:'Title',      value: form.title || '—'         },
                    { label:'Category',   value: form.category              },
                    { label:'Asset',      value: form.assetClass            },
                    { label:'Difficulty', value: form.difficulty            },
                    { label:'Markets',    value: form.markets.filter(m=>m.symbol).map(m=>m.symbol).join(', ') || '—' },
                    { label:'Price',      value: form.isFree ? 'FREE' : `$${form.price} USD` },
                    { label:'Entry Rules',value: `${form.entryRules.filter(r=>r.trim()).length} rules` },
                    { label:'Images',     value: `${form.images.length} uploaded` },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-[9px]" style={{ fontFamily:'monospace' }}>
                      <span style={{ color:'rgba(255,255,255,0.3)', minWidth:80 }}>{r.label}</span>
                      <span style={{ color:'rgba(255,255,255,0.7)' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="px-4 py-3 text-[10px] font-bold border transition-all"
                  style={{ fontFamily:'monospace', borderColor:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)' }}>
                  ← BACK
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button type="button" onClick={() => {
                  if (step === 1 && !form.title.trim()) return alert('Title is required');
                  if (step === 1 && !form.description.trim()) return alert('Description is required');
                  setStep(s => s + 1);
                }}
                  className="btn-acid flex-1 py-3">
                  NEXT →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit}
                  disabled={isPending || !form.title.trim() || !form.description.trim()}
                  className="btn-acid flex-1 py-3 disabled:opacity-40">
                  {isPending ? 'PUBLISHING...' : editing ? 'UPDATE STRATEGY →' : 'PUBLISH STRATEGY →'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

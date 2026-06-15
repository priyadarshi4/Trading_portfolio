import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStrategyListing, useToggleStrategyLike, useToggleStrategySave } from '../../api/club/strategyHooks';

const StatBox = ({ label, value, color = '#e8ff00' }) => (
  <div className="border p-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
    <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{label}</div>
    <div className="font-display text-xl" style={{ color, letterSpacing: '0.04em' }}>{value}</div>
  </div>
);

export default function StrategyDetailModal({ listingId, onClose }) {
  const [imgTab, setImgTab] = useState(0);
  const { data: listing, isLoading } = useStrategyListing(listingId);
  const toggleLike = useToggleStrategyLike();
  const toggleSave = useToggleStrategySave();

  if (!listingId) return null;

  const s = listing?.stats || {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[92vh] overflow-y-auto border"
          style={{ background: '#080808', borderColor: 'rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(232,255,0,0.15)', borderTopColor: '#e8ff00' }} />
            </div>
          ) : !listing ? (
            <div className="py-20 text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Not found</div>
          ) : (
            <>
              {/* Hero image / colour header */}
              <div className="relative" style={{ background: '#1a1a2e', minHeight: 200 }}>
                {listing.coverImage?.url ? (
                  <img src={listing.coverImage.url} alt={listing.title}
                    className="w-full object-cover" style={{ maxHeight: 240, objectFit: 'cover' }} />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ minHeight: 180, background: 'linear-gradient(135deg, rgba(232,255,0,0.1), rgba(167,139,250,0.1))' }}>
                    <div className="font-display text-4xl" style={{ color: 'rgba(232,255,0,0.2)' }}>STRATEGY</div>
                  </div>
                )}

                {/* Close */}
                <button onClick={onClose}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center border"
                  style={{ background: 'rgba(0,0,0,0.7)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>✕</button>

                {/* Category tag */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-[9px] font-bold px-2 py-1" style={{ background: 'rgba(0,0,0,0.8)', color: '#e8ff00', fontFamily: 'monospace', border: '1px solid rgba(232,255,0,0.2)' }}>
                    {listing.category}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl sm:text-3xl mb-1" style={{ color: '#fff', letterSpacing: '0.04em' }}>{listing.title}</h1>
                    {listing.tagline && (
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{listing.tagline}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        by <span style={{ color: 'rgba(255,255,255,0.6)' }}>{listing.author?.name}</span>
                      </span>
                      {listing.difficulty && (
                        <span className="text-[8px] px-2 py-0.5 font-bold" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace' }}>
                          {listing.difficulty}
                        </span>
                      )}
                      {listing.assetClass && (
                        <span className="text-[8px] px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                          {listing.assetClass}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="font-display text-2xl" style={{ color: listing.isFree ? '#00ffb3' : '#e8ff00' }}>
                      {listing.isFree ? 'FREE' : `$${listing.price}`}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleLike.mutate(listing._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border transition-all"
                        style={{
                          border: `1px solid ${listing.isLiked ? 'rgba(232,255,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          color: listing.isLiked ? '#e8ff00' : 'rgba(255,255,255,0.4)',
                          background: listing.isLiked ? 'rgba(232,255,0,0.08)' : 'transparent',
                        }}>
                        <span>{listing.isLiked ? '♥' : '♡'}</span>
                        <span className="text-[9px]" style={{ fontFamily: 'monospace' }}>{listing.likesCount}</span>
                      </button>
                      <button onClick={() => toggleSave.mutate(listing._id)}
                        className="px-3 py-1.5 border transition-all"
                        style={{
                          border: `1px solid ${listing.isSaved ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          color: listing.isSaved ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                          background: listing.isSaved ? 'rgba(167,139,250,0.08)' : 'transparent',
                        }}>🔖</button>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                {Object.values(s).some(v => v > 0) && (
                  <div>
                    <div className="text-[8px] tracking-[0.25em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// BACKTEST STATISTICS</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {s.totalTrades   > 0 && <StatBox label="TOTAL TRADES"      value={s.totalTrades}                              color="#e8ff00" />}
                      {s.winRate       > 0 && <StatBox label="WIN RATE"           value={`${s.winRate.toFixed(1)}%`}                 color="#00ffb3" />}
                      {s.avgGainPerTrade > 0 && <StatBox label="AVG GAIN/TRADE"  value={`${s.avgGainPerTrade.toFixed(2)}%`}          color="#00ffb3" />}
                      {s.profitFactor  > 0 && <StatBox label="PROFIT FACTOR"     value={s.profitFactor.toFixed(1)}                   color="#e8ff00" />}
                      {s.annualReturn  > 0 && <StatBox label="ANNUAL RETURN"     value={`${s.annualReturn.toFixed(1)}%`}             color="#00ffb3" />}
                      {s.maxDrawdown   > 0 && <StatBox label="MAX DRAWDOWN"      value={`-${s.maxDrawdown.toFixed(1)}%`}             color="#ff3366" />}
                      {s.sharpeRatio   > 0 && <StatBox label="SHARPE RATIO"      value={s.sharpeRatio.toFixed(2)}                    color="#a78bfa" />}
                      {s.backtestPeriod    && <StatBox label="BACKTEST PERIOD"   value={s.backtestPeriod}                            color="rgba(255,255,255,0.5)" />}
                    </div>
                  </div>
                )}

                {/* Markets */}
                {listing.markets?.length > 0 && (
                  <div>
                    <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// MARKETS TRADED</div>
                    <div className="flex flex-wrap gap-2">
                      {listing.markets.map((m, i) => (
                        <span key={i} className="px-3 py-1 text-[10px] font-bold border" style={{ borderColor: 'rgba(232,255,0,0.2)', color: '#e8ff00', background: 'rgba(232,255,0,0.05)', fontFamily: 'monospace' }}>
                          {m.symbol} {m.exchange && <span style={{ color: 'rgba(255,255,255,0.3)' }}>({m.exchange})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// STRATEGY DESCRIPTION</div>
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                    {listing.description}
                  </p>
                </div>

                {/* Rules */}
                {[
                  { label: 'ENTRY RULES',   rules: listing.entryRules,  color: '#00ffb3' },
                  { label: 'EXIT RULES',    rules: listing.exitRules,   color: '#ff3366' },
                  { label: 'RISK RULES',    rules: listing.riskRules,   color: '#e8ff00' },
                ].filter(r => r.rules?.length > 0).map(r => (
                  <div key={r.label}>
                    <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// {r.label}</div>
                    <div className="space-y-1.5">
                      {r.rules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-[10px]" style={{ fontFamily: 'monospace' }}>
                          <span style={{ color: r.color, flexShrink: 0 }}>{i + 1}.</span>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Indicators + Timeframes */}
                <div className="grid grid-cols-2 gap-4">
                  {listing.indicators?.length > 0 && (
                    <div>
                      <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// INDICATORS</div>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.indicators.map(ind => (
                          <span key={ind} className="px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', fontFamily: 'monospace' }}>
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.timeframes?.length > 0 && (
                    <div>
                      <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// TIMEFRAMES</div>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.timeframes.map(tf => (
                          <span key={tf} className="px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace' }}>
                            {tf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gallery */}
                {listing.images?.length > 0 && (
                  <div>
                    <div className="text-[8px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>// CHART GALLERY</div>
                    <div className="space-y-2">
                      <img src={listing.images[imgTab]?.url} alt="strategy chart"
                        className="w-full border" style={{ borderColor: 'rgba(255,255,255,0.08)', maxHeight: 300, objectFit: 'contain', background: '#000' }} />
                      {listing.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {listing.images.map((img, i) => (
                            <button key={i} onClick={() => setImgTab(i)}
                              className="flex-shrink-0 w-14 h-10 overflow-hidden border transition-all"
                              style={{ borderColor: imgTab === i ? '#e8ff00' : 'rgba(255,255,255,0.06)' }}>
                              <img src={img.url} alt={`view ${i+1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {listing.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {listing.tags.map(tag => (
                      <span key={tag} className="text-[8px] px-2 py-0.5" style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', fontFamily: 'monospace' }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToggleStrategyLike, useToggleStrategySave, useDeleteStrategyListing } from '../../api/club/strategyHooks';
import useAuthStore from '../../store/authStore';

// Category accent colours — mirrors the colourful cards in the screenshot
const CAT_COLORS = {
  'Oscillator Strategies':              { card: '#7c3aed', text: '#fff' },
  'Day Trading Strategies':             { card: '#0ea5e9', text: '#fff' },
  'Seasonal Strategies':                { card: '#f59e0b', text: '#000' },
  'Swing Trading Strategies':           { card: '#10b981', text: '#fff' },
  'Overnight Strategies':               { card: '#6366f1', text: '#fff' },
  'Short Strategies':                   { card: '#ef4444', text: '#fff' },
  'Trend-Following Strategies':         { card: '#3b82f6', text: '#fff' },
  'Breakout Strategies':                { card: '#f97316', text: '#fff' },
  'Mean Reversion Strategies':          { card: '#14b8a6', text: '#fff' },
  'Momentum & Volatility Strategies':   { card: '#8b5cf6', text: '#fff' },
  'Combination Strategies':             { card: '#ec4899', text: '#fff' },
  'Rotation Strategies':                { card: '#84cc16', text: '#000' },
  'Options Strategies':                 { card: '#06b6d4', text: '#fff' },
  'Crypto Strategies':                  { card: '#f59e0b', text: '#000' },
  'Futures Strategies':                 { card: '#e8ff00', text: '#000' },
  'Scalping Strategies':                { card: '#ff3366', text: '#fff' },
  'Price Action Strategies':            { card: '#a78bfa', text: '#fff' },
  'ICT / Smart Money':                  { card: '#00ffb3', text: '#000' },
  'Strategy Bundles':                   { card: '#f43f5e', text: '#fff' },
  'All Strategies':                     { card: '#1a1a1a', text: '#e8ff00' },
};

const getColor = (category) => CAT_COLORS[category] || { card: '#1e293b', text: '#e8ff00' };

const StatPill = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px]">{icon}</span>
    <span className="text-[9px] font-bold" style={{ color: color || '#fff', fontFamily: 'monospace' }}>{value}</span>
    <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{label}</span>
  </div>
);

export default function StrategyCard({ listing, onClick, onEdit }) {
  const { user }  = useAuthStore();
  const toggleLike = useToggleStrategyLike();
  const toggleSave = useToggleStrategySave();
  const deleteListing = useDeleteStrategyListing();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwn  = listing.author?._id === user?._id || listing.author?._id?.toString() === user?._id?.toString();
  const colors = getColor(listing.category);
  const s      = listing.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col overflow-hidden cursor-pointer group"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a' }}
    >
      {/* ── CARD HEADER — coloured like the screenshot ── */}
      <div
        className="relative p-4 flex flex-col gap-2"
        style={{ background: colors.card, minHeight: 160 }}
        onClick={onClick}
      >
        {/* Verified badge */}
        {listing.isVerified && (
          <div className="absolute top-3 right-3 px-2 py-0.5 text-[8px] font-bold"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'monospace' }}>
            ✓ VERIFIED
          </div>
        )}

        {/* Featured ribbon */}
        {listing.isFeatured && (
          <div className="absolute top-3 left-0 px-2 py-0.5 text-[8px] font-bold"
            style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>
            ★ FEATURED
          </div>
        )}

        {/* Cover image — behind tinted overlay */}
        {listing.coverImage?.url && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={listing.coverImage.url} alt={listing.title}
              className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
          </div>
        )}

        {/* Category label */}
        <div className="relative text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: colors.text, opacity: 0.7, fontFamily: 'monospace' }}>
          {listing.category}
        </div>

        {/* Title */}
        <h3 className="relative font-display text-xl leading-tight" style={{ color: colors.text, letterSpacing: '0.03em' }}>
          {listing.title}
        </h3>

        {/* Market pills */}
        {listing.markets?.length > 0 && (
          <div className="relative flex flex-wrap gap-1">
            {listing.markets.slice(0, 3).map((m, i) => (
              <span key={i} className="text-[8px] font-bold px-1.5 py-0.5"
                style={{ background: 'rgba(0,0,0,0.25)', color: colors.text, fontFamily: 'monospace' }}>
                {m.symbol}
              </span>
            ))}
            {listing.markets.length > 3 && (
              <span className="text-[8px]" style={{ color: colors.text, opacity: 0.7, fontFamily: 'monospace' }}>
                +{listing.markets.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Headline stats — checkmark list like the screenshot */}
        {(s.totalTrades > 0 || s.winRate > 0 || s.profitFactor > 0 || s.avgGainPerTrade > 0) && (
          <div className="relative space-y-0.5 mt-1">
            {s.totalTrades > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: colors.text, fontFamily: 'monospace' }}>
                <span style={{ color: colors.text === '#000' ? '#16a34a' : '#4ade80' }}>✓</span>
                <span className="font-bold">{s.totalTrades}</span> trades
              </div>
            )}
            {s.avgGainPerTrade > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: colors.text, fontFamily: 'monospace' }}>
                <span style={{ color: colors.text === '#000' ? '#16a34a' : '#4ade80' }}>✓</span>
                <span className="font-bold">{s.avgGainPerTrade.toFixed(2)}%</span> avg gain/trade
              </div>
            )}
            {s.winRate > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: colors.text, fontFamily: 'monospace' }}>
                <span style={{ color: colors.text === '#000' ? '#16a34a' : '#4ade80' }}>✓</span>
                <span className="font-bold">{s.winRate.toFixed(0)}%</span> win rate
              </div>
            )}
            {s.profitFactor > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: colors.text, fontFamily: 'monospace' }}>
                <span style={{ color: colors.text === '#000' ? '#16a34a' : '#4ade80' }}>✓</span>
                Profit factor: <span className="font-bold">{s.profitFactor.toFixed(1)}</span>
              </div>
            )}
            {s.annualReturn > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]" style={{ color: colors.text, fontFamily: 'monospace' }}>
                <span style={{ color: colors.text === '#000' ? '#16a34a' : '#4ade80' }}>✓</span>
                <span className="font-bold">{s.annualReturn.toFixed(1)}%</span> annual return
              </div>
            )}
          </div>
        )}

        {/* Candlestick chart image if provided */}
        {listing.equityCurveImage?.url && (
          <div className="absolute bottom-0 right-0 w-24 h-16 overflow-hidden opacity-60">
            <img src={listing.equityCurveImage.url} alt="equity" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* ── CARD FOOTER — title + price + actions ── */}
      <div className="p-3 flex flex-col gap-2" style={{ background: 'rgba(10,10,10,0.98)' }}>
        {/* Author + difficulty */}
        <div className="flex items-center justify-between">
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            by <span style={{ color: 'rgba(255,255,255,0.6)' }}>{listing.author?.name || 'Trader'}</span>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 font-bold" style={{
            background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace',
          }}>{listing.difficulty}</span>
        </div>

        {/* Tagline */}
        {listing.tagline && (
          <p className="text-[9px] line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
            {listing.tagline}
          </p>
        )}

        {/* Tags */}
        {listing.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[7px] px-1.5 py-0.5"
                style={{ background: 'rgba(232,255,0,0.06)', color: 'rgba(232,255,0,0.6)', fontFamily: 'monospace' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row — price + engagement */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {/* Price */}
          <div className="font-display text-base" style={{ color: listing.isFree ? '#00ffb3' : '#e8ff00', letterSpacing: '0.05em' }}>
            {listing.isFree ? 'FREE' : `$${listing.price} ${listing.currency}`}
          </div>

          {/* Engagement */}
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); toggleLike.mutate(listing._id); }}
              className="flex items-center gap-1 px-2 py-1.5 transition-all active:scale-95"
              style={{
                border: `1px solid ${listing.isLiked ? 'rgba(232,255,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                color: listing.isLiked ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                background: listing.isLiked ? 'rgba(232,255,0,0.06)' : 'transparent',
                minHeight: 32,
              }}>
              <span className="text-[10px]">{listing.isLiked ? '♥' : '♡'}</span>
              <span className="text-[8px]" style={{ fontFamily: 'monospace' }}>{listing.likesCount || 0}</span>
            </button>

            <button onClick={e => { e.stopPropagation(); toggleSave.mutate(listing._id); }}
              className="flex items-center gap-1 px-2 py-1.5 transition-all active:scale-95"
              style={{
                border: `1px solid ${listing.isSaved ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                color: listing.isSaved ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: listing.isSaved ? 'rgba(167,139,250,0.06)' : 'transparent',
                minHeight: 32,
              }}>
              <span className="text-[10px]">🔖</span>
            </button>

            {/* Owner menu */}
            {isOwn && (
              <div className="relative">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                  className="px-2 py-1.5 text-base" style={{ color: 'rgba(255,255,255,0.2)', minHeight: 32 }}>⋯</button>
                {menuOpen && (
                  <div className="absolute bottom-8 right-0 z-30 border shadow-xl"
                    style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', minWidth: 100 }}>
                    <button onClick={e => { e.stopPropagation(); onEdit?.(listing); setMenuOpen(false); }}
                      className="w-full px-3 py-2.5 text-[9px] text-left hover:bg-white/5"
                      style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>EDIT</button>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Remove this strategy?')) { deleteListing.mutate(listing._id); setMenuOpen(false); } }}
                      className="w-full px-3 py-2.5 text-[9px] text-left hover:bg-white/5"
                      style={{ color: '#ff3366', fontFamily: 'monospace' }}>DELETE</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats mini row */}
        <div className="flex items-center gap-3 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <StatPill icon="👁" label="views" value={listing.viewsCount || 0} />
          <StatPill icon="💬" label="comments" value={listing.commentsCount || 0} />
          {listing.assetClass && (
            <span className="ml-auto text-[8px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{listing.assetClass}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useToggleLike, useToggleSave, useDeletePost } from '../../api/club/hooks';
import useAuthStore from '../../store/authStore';
import useClubStore from '../../store/clubStore';

const CATEGORY_COLORS = {
  'Trading Idea':   '#e8ff00', 'Swing Trading':  '#00ffb3',
  'Intraday':       '#a78bfa', 'Options':        '#ff6b35',
  'Crypto':         '#38bdf8', 'Market News':    '#f472b6',
  'Educational':    '#34d399', 'Trade Review':   '#fbbf24',
  'Stock Analysis': '#e8ff00', 'General':        'rgba(255,255,255,0.4)',
};
const DIRECTION_BADGE = {
  LONG:    { color: '#00ffb3', bg: 'rgba(0,255,179,0.1)',  label: '▲ LONG'    },
  SHORT:   { color: '#ff3366', bg: 'rgba(255,51,102,0.1)', label: '▼ SHORT'   },
  NEUTRAL: { color: '#e8ff00', bg: 'rgba(232,255,0,0.1)',  label: '◆ NEUTRAL' },
};
const LEVEL_COLORS = {
  Beginner:'rgba(255,255,255,0.3)', Intermediate:'#e8ff00',
  Advanced:'#00ffb3', Professional:'#a78bfa', Expert:'#ff6b35',
};

export default function PostCard({ post, onOpenComments, compact = false }) {
  const { user }          = useAuthStore();
  const { openCreateModal } = useClubStore();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const deletePost = useDeletePost();
  const [imgExpanded, setImgExpanded] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const isOwn    = post.author?._id === user?._id || post.author?._id?.toString() === user?._id?.toString();
  const catColor = CATEGORY_COLORS[post.category] || '#e8ff00';
  const dirBadge = post.direction ? DIRECTION_BADGE[post.direction] : null;
  const timeAgo  = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : '';
  const level    = post.authorProfile?.experience || 'Beginner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border card-glow transition-all"
      style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.07)', borderLeft: `3px solid ${catColor}` }}
    >
      {/* Header */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[10px] font-black"
            style={{ background: `linear-gradient(135deg, ${catColor}60, #a78bfa60)`, color: '#fff', fontFamily: 'monospace' }}>
            {post.author?.name?.slice(0,2).toUpperCase() || 'TR'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>
                {post.author?.name || 'Trader'}
              </span>
              {post.authorProfile?.isVerified && (
                <span className="text-[7px] px-1 py-0.5 font-bold" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>✓</span>
              )}
              <span className="text-[8px] font-bold" style={{ color: LEVEL_COLORS[level], fontFamily: 'monospace' }}>{level}</span>
            </div>
            <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{timeAgo}</div>
          </div>
        </div>

        <div className="flex items-start gap-1.5 flex-shrink-0">
          <span className="text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 hidden xs:inline-block" style={{
            background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`, fontFamily: 'monospace',
          }}>{post.category}</span>

          {isOwn && (
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)}
                className="w-7 h-7 flex items-center justify-center text-base"
                style={{ color: 'rgba(255,255,255,0.2)' }}>⋯</button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 border shadow-xl" style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', minWidth: 110 }}>
                  <button onClick={() => { openCreateModal(post); setMenuOpen(false); }}
                    className="w-full px-3 py-2.5 text-[9px] text-left hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>EDIT</button>
                  <button onClick={() => { if (confirm('Delete?')) { deletePost.mutate(post._id); setMenuOpen(false); } }}
                    className="w-full px-3 py-2.5 text-[9px] text-left hover:bg-white/5" style={{ color: '#ff3366', fontFamily: 'monospace' }}>DELETE</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Symbol + direction + title */}
      <div className="px-3 sm:px-4 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {post.symbol && (
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5" style={{ background: 'rgba(232,255,0,0.1)', color: '#e8ff00', border: '1px solid rgba(232,255,0,0.2)', fontFamily: 'monospace' }}>
              ${post.symbol}
            </span>
          )}
          {dirBadge && (
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5" style={{ background: dirBadge.bg, color: dirBadge.color, fontFamily: 'monospace' }}>
              {dirBadge.label}
            </span>
          )}
        </div>
        <h3 className="text-[12px] sm:text-[13px] font-bold leading-snug" style={{ color: '#fff', fontFamily: 'monospace' }}>{post.title}</h3>
      </div>

      {/* Description */}
      {!compact && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-[9px] sm:text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            {post.description.length > 200 ? post.description.slice(0, 200) + '...' : post.description}
          </p>
        </div>
      )}

      {/* Image */}
      {post.images?.length > 0 && (
        <div className="px-3 sm:px-4 pb-3">
          <div className="overflow-hidden cursor-zoom-in border"
            style={{ borderColor: 'rgba(255,255,255,0.06)', maxHeight: imgExpanded ? 500 : 200 }}
            onClick={() => setImgExpanded(v => !v)}>
            <img src={post.images[0].url} alt="chart"
              className="w-full object-cover transition-all duration-300" style={{ filter: 'brightness(0.95)' }} />
          </div>
          {imgExpanded && post.images[0].caption && (
            <div className="text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{post.images[0].caption}</div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-3 sm:px-4 pb-3 flex flex-wrap gap-1">
          {post.tags.map(tag => (
            <span key={tag} className="text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontFamily: 'monospace' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement bar — larger touch targets on mobile */}
      <div className="px-3 sm:px-4 py-2 border-t flex items-center gap-1" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button onClick={() => toggleLike.mutate(post._id)}
          className="flex items-center gap-1.5 px-2.5 py-2 transition-all active:scale-95"
          style={{
            background: post.isLiked ? 'rgba(232,255,0,0.08)' : 'transparent',
            border: `1px solid ${post.isLiked ? 'rgba(232,255,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
            color: post.isLiked ? '#e8ff00' : 'rgba(255,255,255,0.35)',
            minHeight: 36,
          }}>
          <span className="text-[11px]">{post.isLiked ? '♥' : '♡'}</span>
          <span className="text-[9px] font-bold" style={{ fontFamily: 'monospace' }}>{post.likesCount || 0}</span>
        </button>

        <button onClick={() => onOpenComments?.(post._id)}
          className="flex items-center gap-1.5 px-2.5 py-2 transition-all active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', minHeight: 36 }}>
          <span className="text-[11px]">💬</span>
          <span className="text-[9px] font-bold" style={{ fontFamily: 'monospace' }}>{post.commentsCount || 0}</span>
        </button>

        <button onClick={() => toggleSave.mutate(post._id)}
          className="flex items-center gap-1.5 px-2.5 py-2 transition-all active:scale-95"
          style={{
            background: post.isSaved ? 'rgba(167,139,250,0.08)' : 'transparent',
            border: `1px solid ${post.isSaved ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
            color: post.isSaved ? '#a78bfa' : 'rgba(255,255,255,0.35)',
            minHeight: 36,
          }}>
          <span className="text-[11px]">🔖</span>
          <span className="text-[9px] font-bold" style={{ fontFamily: 'monospace' }}>{post.savesCount || 0}</span>
        </button>

        <div className="ml-auto flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <span className="text-[9px]">👁</span>
          <span className="text-[8px]" style={{ fontFamily: 'monospace' }}>{post.viewsCount || 0}</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useTrending } from '../../api/club/hooks';
import { formatDistanceToNow } from 'date-fns';
import useClubStore from '../../store/clubStore';

const LEVEL_COLORS = {
  Beginner:'rgba(255,255,255,0.3)', Intermediate:'#e8ff00',
  Advanced:'#00ffb3', Professional:'#a78bfa', Expert:'#ff6b35',
};

export default function TrendingSidebar() {
  const { data: trending, isLoading } = useTrending();
  const { setCategory } = useClubStore();

  if (isLoading) return (
    <div className="space-y-4 p-3">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
    </div>
  );

  return (
    <div className="p-3 space-y-5 overflow-y-auto">

      {/* Trending symbols */}
      {trending?.symbols?.length > 0 && (
        <div>
          <div className="text-[8px] font-bold tracking-[0.25em] uppercase mb-2 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            🔥 TRENDING STOCKS
          </div>
          <div className="space-y-1.5">
            {trending.symbols.slice(0, 6).map((s, i) => (
              <div key={s.symbol} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                onClick={() => setCategory(`#${s.symbol}`)}>
                <div className="text-[8px] w-4" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{i + 1}</div>
                <div className="flex-1 text-[10px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>${s.symbol}</div>
                <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{s.count} posts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending tags */}
      {trending?.tags?.length > 0 && (
        <div>
          <div className="text-[8px] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            🔥 TRENDING TAGS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trending.tags.slice(0, 10).map(t => (
              <span key={t.tag}
                className="px-2 py-0.5 text-[8px] cursor-pointer transition-all hover:scale-105"
                style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)', fontFamily: 'monospace' }}
                onClick={() => {}}>
                #{t.tag} <span style={{ opacity: 0.5 }}>·{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Most liked posts */}
      {trending?.topPosts?.length > 0 && (
        <div>
          <div className="text-[8px] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            🔥 MOST LIKED THIS WEEK
          </div>
          <div className="space-y-2">
            {trending.topPosts.slice(0, 4).map(post => (
              <div key={post._id} className="p-2 border transition-all hover:border-acid/20 cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                <div className="text-[9px] font-bold truncate" style={{ color: '#fff', fontFamily: 'monospace' }}>{post.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>by {post.author?.name}</span>
                  <span className="text-[8px]" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>♥ {post.likesCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top traders */}
      {trending?.topTraders?.length > 0 && (
        <div>
          <div className="text-[8px] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            🔥 TOP TRADERS
          </div>
          <div className="space-y-2">
            {trending.topTraders.slice(0, 5).map((t, i) => (
              <div key={t._id || i} className="flex items-center gap-2 px-2 py-1.5">
                <div className="text-[8px] w-3" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{i + 1}</div>
                <div className="w-7 h-7 flex items-center justify-center text-[9px] font-black flex-shrink-0"
                  style={{ background: 'rgba(232,255,0,0.15)', color: '#e8ff00', fontFamily: 'monospace' }}>
                  {(t.name || 'TR').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold truncate" style={{ color: '#fff', fontFamily: 'monospace' }}>{t.name}</div>
                  <div className="text-[7px]" style={{ color: LEVEL_COLORS[t.profile?.experience] || 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    {t.profile?.experience || 'Beginner'} · {t.profile?.followersCount || 0} followers
                  </div>
                </div>
                {t.profile?.isVerified && <span className="text-[8px]" style={{ color: '#38bdf8' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

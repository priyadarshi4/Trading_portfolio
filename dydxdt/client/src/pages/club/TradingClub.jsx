import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useClubPosts, useClubSearch } from '../../api/club/hooks';
import useClubStore from '../../store/clubStore';
import PostCard from '../../components/club/PostCard';
import CommentsPanel from '../../components/club/CommentsPanel';
import CreatePostModal from '../../components/club/CreatePostModal';
import TrendingSidebar from '../../components/club/TrendingSidebar';
import { Spinner } from '../../components/ui/index';

const CATEGORIES = [
  { label: 'All Posts',      icon: '◈' },
  { label: 'Trading Idea',   icon: '💡' },
  { label: 'Swing Trading',  icon: '📊' },
  { label: 'Intraday',       icon: '⚡' },
  { label: 'Options',        icon: '🎯' },
  { label: 'Crypto',         icon: '🔗' },
  { label: 'Market News',    icon: '📰' },
  { label: 'Educational',    icon: '📚' },
  { label: 'Trade Review',   icon: '🔍' },
  { label: 'Stock Analysis', icon: '📈' },
  { label: 'My Posts',       icon: '✦' },
  { label: 'Saved Posts',    icon: '🔖' },
];

const SORT_OPTIONS = [
  { value: 'latest',    label: 'LATEST'    },
  { value: 'popular',   label: 'POPULAR'   },
  { value: 'discussed', label: 'DISCUSSED' },
];

export default function TradingClubPage() {
  const {
    activeCategory, activeSort, activeFeed, searchQuery, searchOpen,
    setCategory, setSort, setFeed, setSearch, toggleSearch,
    openCreateModal, connectSocket, disconnectSocket,
  } = useClubStore();

  const [activeCommentPost, setActiveCommentPost] = useState(null);

  // Map "Saved Posts" to saved endpoint, "My Posts" passes category
  const isSaved = activeCategory === 'Saved Posts';

  const queryParams = {
    category: activeCategory === 'All Posts' || isSaved ? '' : activeCategory,
    sort:     activeSort,
    ...(activeFeed === 'followed' ? { feed: 'followed' } : {}),
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useClubPosts(
    isSaved ? null : queryParams,
    { enabled: !isSaved }
  );

  // Search
  const [searchInput, setSearchInput] = useState('');
  const { data: searchResults, isFetching: searchFetching } = useClubSearch(
    searchInput, searchInput.length >= 2
  );

  // Socket
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  // Infinite scroll
  const loaderRef = useRef(null);
  const observer  = useRef(null);
  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    if (loaderRef.current) observer.current.observe(loaderRef.current);
    return () => observer.current?.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages?.flatMap(p => p.data) || [];

  return (
    <div className="flex h-full animate-fade-in" style={{ height: 'calc(100vh - 84px)' }}>

      {/* LEFT — Category sidebar */}
      <div className="flex-shrink-0 border-r overflow-y-auto"
        style={{ width: 200, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="font-display text-lg leading-none" style={{
            background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.04em',
          }}>TRADING CLUB</div>
          <div className="text-[7px] tracking-[0.3em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            COMMUNITY FEED
          </div>
        </div>

        {/* Feed toggle */}
        <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex gap-1">
            {[['all','ALL'],['followed','FOLLOWING']].map(([val, label]) => (
              <button key={val} onClick={() => setFeed(val)}
                className="flex-1 py-1 text-[8px] font-bold transition-all"
                style={{
                  fontFamily: 'monospace',
                  background: activeFeed === val ? 'rgba(232,255,0,0.1)' : 'transparent',
                  color:      activeFeed === val ? '#e8ff00' : 'rgba(255,255,255,0.25)',
                  border:     `1px solid ${activeFeed === val ? 'rgba(232,255,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Category list */}
        <nav className="py-1">
          {CATEGORIES.map(cat => (
            <button key={cat.label}
              onClick={() => setCategory(cat.label)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-100"
              style={{
                background:  activeCategory === cat.label ? 'rgba(232,255,0,0.06)' : 'transparent',
                borderLeft:  `2px solid ${activeCategory === cat.label ? '#e8ff00' : 'transparent'}`,
              }}>
              <span className="text-sm flex-shrink-0">{cat.icon}</span>
              <span className="text-[9px] font-bold tracking-wide uppercase truncate"
                style={{ fontFamily: 'monospace', color: activeCategory === cat.label ? '#e8ff00' : 'rgba(255,255,255,0.3)' }}>
                {cat.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* CENTER — Feed */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Feed toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>

          {/* Category label */}
          <div className="font-display text-base" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>
            {activeCategory.toUpperCase()}
          </div>

          {/* Sort tabs */}
          <div className="flex gap-0.5 ml-2">
            {SORT_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setSort(s.value)}
                className="px-2.5 py-1 text-[8px] font-bold transition-all"
                style={{
                  fontFamily: 'monospace',
                  background: activeSort === s.value ? 'rgba(232,255,0,0.1)' : 'transparent',
                  color:      activeSort === s.value ? '#e8ff00' : 'rgba(255,255,255,0.25)',
                  borderBottom: `1px solid ${activeSort === s.value ? '#e8ff00' : 'transparent'}`,
                }}>{s.label}</button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search toggle */}
            <button onClick={toggleSearch}
              className="px-3 py-1.5 text-[9px] font-bold border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: searchOpen ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                color:       searchOpen ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background:  searchOpen ? 'rgba(167,139,250,0.08)' : 'transparent',
              }}>🔍 SEARCH</button>

            {/* Share Idea FAB */}
            <button onClick={() => openCreateModal()}
              className="px-4 py-1.5 text-[9px] font-bold transition-all hover:scale-105"
              style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>
              + SHARE IDEA
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,5,0.98)' }}>
            <input
              className="w-full px-3 py-2 text-[11px] outline-none border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(167,139,250,0.2)', color: '#fff', fontFamily: 'monospace' }}
              placeholder="Search posts, symbols, strategies, tags... (e.g. NIFTY, Breakout, RSI)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              autoFocus
            />
            {searchInput.length >= 2 && (
              <div className="mt-1 text-[8px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {searchFetching ? 'Searching...' : `${(searchResults?.posts?.length || 0) + (searchResults?.users?.length || 0)} results`}
              </div>
            )}
          </div>
        )}

        {/* Feed content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

            {/* Search results */}
            {searchOpen && searchInput.length >= 2 ? (
              <>
                {searchResults?.users?.length > 0 && (
                  <div>
                    <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>TRADERS</div>
                    <div className="flex flex-wrap gap-2">
                      {searchResults.users.map(u => (
                        <div key={u._id} className="flex items-center gap-2 px-3 py-2 border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.9)' }}>
                          <div className="w-7 h-7 flex items-center justify-center text-[9px] font-black" style={{ background: 'rgba(232,255,0,0.15)', color: '#e8ff00', fontFamily: 'monospace' }}>
                            {u.name?.slice(0,2).toUpperCase()}
                          </div>
                          <div className="text-[10px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{u.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults?.posts?.map(post => (
                  <PostCard key={post._id} post={post} onOpenComments={setActiveCommentPost} />
                ))}
                {!searchFetching && !searchResults?.posts?.length && !searchResults?.users?.length && (
                  <div className="text-center py-12 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    No results for "{searchInput}"
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Normal feed */}
                {isLoading ? (
                  <Spinner />
                ) : allPosts.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="text-4xl">📊</div>
                    <div className="font-display text-xl" style={{ color: 'rgba(255,255,255,0.15)' }}>NO POSTS YET</div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                      Be the first to share a trading idea
                    </div>
                    <button onClick={() => openCreateModal()}
                      className="px-5 py-2 text-[9px] font-bold mt-2"
                      style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>
                      + SHARE FIRST IDEA
                    </button>
                  </div>
                ) : (
                  allPosts.map(post => (
                    <PostCard key={post._id} post={post} onOpenComments={setActiveCommentPost} />
                  ))
                )}

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="py-4 text-center">
                  {isFetchingNextPage && (
                    <div className="w-5 h-5 border border-t-acid rounded-full animate-spin mx-auto"
                      style={{ borderColor: 'rgba(232,255,0,0.15)', borderTopColor: '#e8ff00' }} />
                  )}
                  {!hasNextPage && allPosts.length > 0 && (
                    <div className="text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
                      — END OF FEED —
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — Trending sidebar (hidden when comments open) */}
      <AnimatePresence mode="wait">
        {activeCommentPost ? (
          <CommentsPanel
            key="comments"
            postId={activeCommentPost}
            onClose={() => setActiveCommentPost(null)}
          />
        ) : (
          <div key="trending" className="flex-shrink-0 border-l overflow-hidden"
            style={{ width: 240, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="text-[8px] font-bold tracking-[0.25em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                TRENDING NOW
              </div>
            </div>
            <TrendingSidebar />
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit post modal */}
      <CreatePostModal />
    </div>
  );
}

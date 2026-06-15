import { useState, useRef, useEffect } from 'react';
import { useStrategyListings, useStrategyCategories } from '../../api/club/strategyHooks';
import StrategyCard from '../../components/club/StrategyCard';
import StrategyDetailModal from '../../components/club/StrategyDetailModal';
import UploadStrategyModal from '../../components/club/UploadStrategyModal';
import { Spinner } from '../../components/ui/index';

const SORT_OPTIONS = [
  { value:'newest',   label:'NEWEST'    },
  { value:'popular',  label:'MOST LIKED'},
  { value:'toprated', label:'TOP RATED' },
  { value:'featured', label:'FEATURED'  },
];

const ASSET_FILTERS = ['All','Stocks','Forex','Futures','Crypto','Commodities','Indices','Options'];
const DIFF_FILTERS  = ['All','Beginner','Intermediate','Advanced','Expert'];

export default function StrategyMarketplace() {
  const [activeCategory, setActiveCategory] = useState('All Strategies');
  const [sort,           setSort]           = useState('newest');
  const [assetClass,     setAssetClass]     = useState('');
  const [difficulty,     setDifficulty]     = useState('');
  const [searchQ,        setSearchQ]        = useState('');
  const [searchInput,    setSearchInput]    = useState('');
  const [detailId,       setDetailId]       = useState(null);
  const [uploadOpen,     setUploadOpen]     = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [categoryOpen,   setCategoryOpen]   = useState(false);
  const [isMobile,       setIsMobile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { data: categories } = useStrategyCategories();

  const params = {
    sort,
    ...(activeCategory !== 'All Strategies' ? { category: activeCategory } : {}),
    ...(assetClass && assetClass !== 'All' ? { assetClass }  : {}),
    ...(difficulty && difficulty !== 'All' ? { difficulty }  : {}),
    ...(searchQ ? { q: searchQ } : {}),
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useStrategyListings(params);
  const allListings = data?.pages?.flatMap(p => p.data) || [];
  const totalCount  = data?.pages?.[0]?.total || 0;

  // Infinite scroll
  const loaderRef = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = (e) => { e.preventDefault(); setSearchQ(searchInput); };

  const handleEdit = (listing) => {
    setEditing(listing);
    setUploadOpen(true);
  };

  const handleCloseUpload = () => { setUploadOpen(false); setEditing(null); };

  return (
    <div className="flex h-full animate-fade-in" style={{ minHeight: 'calc(100vh - 84px)' }}>

      {/* ── LEFT SIDEBAR — category dropdown like the screenshot ── */}
      {!isMobile && (
        <div className="flex-shrink-0 border-r overflow-y-auto"
          style={{ width: 220, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="font-display text-xl mb-0.5" style={{
              background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.04em'
            }}>STRATEGIES</div>
            <div className="text-[7px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              TRADING MARKETPLACE
            </div>
          </div>

          <nav className="py-2">
            {(categories || []).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all duration-100"
                style={{
                  background:  activeCategory === cat ? 'rgba(232,255,0,0.06)' : 'transparent',
                  borderLeft: `2px solid ${activeCategory === cat ? '#e8ff00' : 'transparent'}`,
                }}>
                <span className="text-[9px] font-bold tracking-wide uppercase truncate"
                  style={{ fontFamily: 'monospace', color: activeCategory === cat ? '#e8ff00' : 'rgba(255,255,255,0.35)' }}>
                  {cat === 'All Strategies' ? '◈ All Strategies' : cat}
                </span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b flex-shrink-0" style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)' }}>

          {/* Row 1: search + upload CTA */}
          <div className="flex items-center gap-2 mb-3">
            {/* Mobile category button */}
            {isMobile && (
              <button onClick={() => setCategoryOpen(v => !v)}
                className="flex-shrink-0 px-3 py-2 text-[9px] font-bold border"
                style={{ fontFamily:'monospace', borderColor:'rgba(232,255,0,0.2)', color:'#e8ff00', background:'rgba(232,255,0,0.05)' }}>
                ◈ {activeCategory === 'All Strategies' ? 'ALL' : activeCategory.replace(' Strategies','').slice(0,10)}
              </button>
            )}

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                className="input-dark flex-1"
                style={{ padding: '8px 12px' }}
                placeholder="Search strategies, symbols, indicators..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button type="submit" className="px-3 py-2 text-[9px] font-bold flex-shrink-0"
                style={{ background: 'rgba(232,255,0,0.1)', color: '#e8ff00', border: '1px solid rgba(232,255,0,0.2)', fontFamily: 'monospace' }}>
                🔍
              </button>
            </form>

            {/* Upload CTA */}
            <button onClick={() => { setEditing(null); setUploadOpen(true); }}
              className="btn-acid px-4 py-2 flex-shrink-0 text-[10px]">
              {isMobile ? '+' : '+ PUBLISH STRATEGY'}
            </button>
          </div>

          {/* Row 2: sort + filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {SORT_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)}
                  className="flex-shrink-0 px-2.5 py-1.5 text-[8px] font-bold transition-all"
                  style={{
                    fontFamily: 'monospace',
                    background: sort === s.value ? 'rgba(232,255,0,0.1)' : 'transparent',
                    color:      sort === s.value ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                    borderBottom: `1px solid ${sort === s.value ? '#e8ff00' : 'transparent'}`,
                  }}>{s.label}</button>
              ))}
            </div>

            <div className="h-4 border-l mx-1 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Asset class filter */}
            <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {ASSET_FILTERS.map(a => (
                <button key={a} onClick={() => setAssetClass(a === 'All' ? '' : a)}
                  className="flex-shrink-0 px-2 py-1 text-[8px] font-bold border transition-all"
                  style={{
                    fontFamily: 'monospace',
                    borderColor: (assetClass === a || (a === 'All' && !assetClass)) ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                    color:       (assetClass === a || (a === 'All' && !assetClass)) ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    background:  (assetClass === a || (a === 'All' && !assetClass)) ? 'rgba(167,139,250,0.06)' : 'transparent',
                  }}>{a}</button>
              ))}
            </div>

            {/* Result count */}
            <div className="ml-auto text-[8px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              {totalCount} {totalCount === 1 ? 'strategy' : 'strategies'}
            </div>
          </div>
        </div>

        {/* Mobile category strip */}
        {isMobile && categoryOpen && (
          <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
            {(categories || []).map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setCategoryOpen(false); }}
                className="flex-shrink-0 px-3 py-1.5 text-[9px] font-bold border transition-all"
                style={{
                  fontFamily: 'monospace',
                  borderColor: activeCategory === cat ? 'rgba(232,255,0,0.3)' : 'rgba(255,255,255,0.08)',
                  color:       activeCategory === cat ? '#e8ff00' : 'rgba(255,255,255,0.4)',
                  background:  activeCategory === cat ? 'rgba(232,255,0,0.06)' : 'transparent',
                }}>{cat}</button>
            ))}
          </div>
        )}

        {/* Category hero banner */}
        {activeCategory !== 'All Strategies' && (
          <div className="px-4 sm:px-6 py-5 border-b" style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'linear-gradient(135deg, rgba(232,255,0,0.04), rgba(167,139,250,0.04))'
          }}>
            <div className="text-[8px] tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              // BROWSING CATEGORY
            </div>
            <h2 className="font-display text-2xl sm:text-3xl" style={{ color: '#e8ff00', letterSpacing: '0.04em' }}>
              {activeCategory.toUpperCase()}
            </h2>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <Spinner />
          ) : allListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-4xl">📊</div>
              <div className="font-display text-2xl" style={{ color: 'rgba(255,255,255,0.1)' }}>NO STRATEGIES YET</div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                Be the first to publish in this category
              </div>
              <button onClick={() => { setEditing(null); setUploadOpen(true); }} className="btn-acid px-6 py-2.5 mt-2">
                + PUBLISH FIRST STRATEGY
              </button>
            </div>
          ) : (
            <>
              {/* Responsive grid: 1 col mobile → 2 md → 3 lg → 4 xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allListings.map(listing => (
                  <StrategyCard
                    key={listing._id}
                    listing={listing}
                    onClick={() => setDetailId(listing._id)}
                    onEdit={handleEdit}
                  />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={loaderRef} className="py-6 text-center">
                {isFetchingNextPage && (
                  <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: 'rgba(232,255,0,0.15)', borderTopColor: '#e8ff00' }} />
                )}
                {!hasNextPage && allListings.length > 6 && (
                  <div className="text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'monospace' }}>
                    — END OF MARKETPLACE —
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detailId && (
        <StrategyDetailModal listingId={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Upload / Edit modal */}
      <UploadStrategyModal
        open={uploadOpen}
        onClose={handleCloseUpload}
        editing={editing}
      />
    </div>
  );
}

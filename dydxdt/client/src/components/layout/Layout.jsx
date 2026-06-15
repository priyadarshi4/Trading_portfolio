// ============================================================
// MODIFIED FILE: client/src/components/layout/Layout.jsx
// Change: Add "TRADING STRATEGIES" item to COMMUNITY nav section
// ============================================================

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const NAV_SECTIONS = [
  {
    label: 'TRADING',
    items: [
      { to: '/dashboard',  icon: '◈', label: 'OVERVIEW'     },
      { to: '/trades',     icon: '▤', label: 'TRADES'        },
      { to: '/trades/add', icon: '+', label: 'LOG TRADE'     },
      { to: '/analytics',  icon: '⬡', label: 'ANALYTICS'    },
      { to: '/equity',     icon: '◉', label: 'EQUITY'        },
      { to: '/calendar',   icon: '▦', label: 'CALENDAR'      },
      { to: '/strategies', icon: '◎', label: 'STRATEGIES'    },
      { to: '/risk',       icon: '◇', label: 'RISK CALC'     },
      { to: '/journal',    icon: '✦', label: 'JOURNAL'       },
      { to: '/stats',      icon: '★', label: 'HALL OF STATS' },
      { to: '/reports',    icon: '↓', label: 'REPORTS'       },
    ],
  },
  {
    label: 'MARKET ANALYSIS',
    items: [
      { to: '/market',            icon: '📊', label: 'MARKET CHART'  },
      { to: '/signals',           icon: '⚡', label: 'SIGNALS'       },
      { to: '/scanner',           icon: '🔍', label: 'SCANNER'       },
      { to: '/watchlist',         icon: '☆',  label: 'WATCHLIST'     },
      { to: '/calendar/economic', icon: '📅', label: 'ECO CALENDAR'  },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { to: '/club',              icon: '📢', label: 'TRADING CLUB'       },
      { to: '/club/strategies',   icon: '📈', label: 'STRATEGIES'         }, // ← NEW
      { to: '/club/profile',      icon: '👤', label: 'MY PROFILE'         },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: '⚙', label: 'SETTINGS' },
    ],
  },
];

// Bottom nav for mobile — 5 most important items
const BOTTOM_NAV = [
  { to: '/dashboard',       icon: '◈', label: 'Home'       },
  { to: '/trades',          icon: '▤', label: 'Trades'      },
  { to: '/trades/add',      icon: '+', label: 'Log'         },
  { to: '/club/strategies', icon: '📈', label: 'Strategies' }, // ← NEW (replaced Market)
  { to: '/club',            icon: '📢', label: 'Club'       },
];

const TICKERS = [
  { sym: 'XAUUSD', val: '2,318.40', chg: '+1.2%', up: true  },
  { sym: 'NQ',     val: '17,842',   chg: '+0.8%', up: true  },
  { sym: 'EURUSD', val: '1.0892',   chg: '-0.3%', up: false },
  { sym: 'GBPUSD', val: '1.2734',   chg: '+0.5%', up: true  },
  { sym: 'BTCUSD', val: '67,240',   chg: '+2.1%', up: true  },
  { sym: 'USDJPY', val: '157.34',   chg: '-0.2%', up: false },
];

export default function Layout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const location         = useLocation();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile && location.pathname === '/market') setCollapsed(true);
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  // Pages that need edge-to-edge layout (no padding)
  const isFullHeight = ['/market', '/club'].some(p => location.pathname.startsWith(p));

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DX';

  // ── Shared sidebar content ──────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl leading-none" style={{
              background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.04em'
            }}>Dy/Dx/Dt</div>
            <div className="text-[8px] tracking-[0.28em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>TRADER ANALYTICS</div>
          </div>
          {isMobile ? (
            <button onClick={() => setMobileOpen(false)} className="text-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
          ) : !collapsed ? (
            <button onClick={() => setCollapsed(true)} className="text-xs hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.18)' }}>◀</button>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#00ffb3', boxShadow: '0 0 6px #00ffb3' }} />
        <span className="text-[8px] tracking-widest" style={{ color: 'rgba(0,255,179,0.5)', fontFamily: 'monospace' }}>REPLAY MODE</span>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="px-4 pt-3 pb-1 text-[7px] font-bold tracking-[0.3em] uppercase"
              style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace' }}>
              {section.label}
            </div>
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to}
                end={['/trades','/calendar','/club'].includes(item.to)}
                style={{ textDecoration: 'none' }}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 px-4 py-2.5 transition-all duration-100 cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(232,255,0,0.06)' : 'transparent',
                      borderLeft: `2px solid ${isActive ? '#e8ff00' : 'transparent'}`,
                    }}>
                    <span className="flex-shrink-0 text-base leading-none" style={{
                      width: 18, fontFamily: 'monospace',
                      color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.2)',
                    }}>{item.icon}</span>
                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{
                      fontFamily: 'monospace',
                      color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                    }}>{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t p-3 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[10px] font-black"
            style={{ background: 'linear-gradient(135deg, #e8ff00, #a78bfa)', color: '#000', fontFamily: 'monospace' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{user?.name || 'Trader'}</div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-[8px] hover:text-red-400 transition-colors" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              logout
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden noise-bg scanlines" style={{ background: '#030303' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: collapsed ? 52 : 220 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(5,5,5,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {collapsed ? (
            <>
              <div className="px-2 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <button onClick={() => setCollapsed(false)} className="w-full text-center font-display text-base" style={{ color: '#e8ff00' }}>dx</button>
              </div>
              <nav className="flex-1 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {NAV_SECTIONS.map(section => (
                  <div key={section.label}>
                    <div className="py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                    {section.items.map(item => (
                      <NavLink key={item.to} to={item.to}
                        end={['/trades','/calendar','/club'].includes(item.to)}
                        style={{ textDecoration: 'none' }}
                      >
                        {({ isActive }) => (
                          <div className="flex items-center justify-center py-2.5 cursor-pointer transition-all"
                            title={item.label}
                            style={{ borderLeft: `2px solid ${isActive ? '#e8ff00' : 'transparent'}`, background: isActive ? 'rgba(232,255,0,0.06)' : 'transparent' }}>
                            <span style={{ color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 14 }}>{item.icon}</span>
                          </div>
                        )}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="border-t p-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 flex items-center justify-center text-[9px] font-black mx-auto"
                  style={{ background: 'linear-gradient(135deg, #e8ff00, #a78bfa)', color: '#000', fontFamily: 'monospace' }}>
                  {initials}
                </div>
              </div>
            </>
          ) : (
            <SidebarContent />
          )}
        </motion.aside>
      )}

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 h-full z-50 flex flex-col"
              style={{ width: 260, background: 'rgba(5,5,5,0.99)', borderRight: '1px solid rgba(255,255,255,0.08)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)', minHeight: 44 }}>

          <button onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(v => !v)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-base transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>☰</button>

          <div className="flex items-center gap-4 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
            {TICKERS.map(t => (
              <div key={t.sym} className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[8px] font-bold hidden sm:inline" style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>{t.sym}</span>
                <span className="text-[9px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{t.sym.replace('USD','')}</span>
                <span className="text-[8px]" style={{ color: t.up ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>{t.chg}</span>
              </div>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#e8ff00' }} />
            <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
            </span>
          </div>
        </div>

        {/* Page content */}
        <main
          className={`flex-1 overflow-y-auto ${isFullHeight ? '' : 'p-3 sm:p-5 hatching-bg'}`}
          style={{ paddingBottom: isMobile && !isFullHeight ? '72px' : undefined }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-stretch">
            {BOTTOM_NAV.map(item => (
              <NavLink key={item.to} to={item.to}
                end={['/trades','/club'].includes(item.to)}
                style={{ textDecoration: 'none', flex: 1 }}
              >
                {({ isActive }) => (
                  <div className="flex flex-col items-center justify-center py-2 gap-0.5"
                    style={{ background: isActive ? 'rgba(232,255,0,0.06)' : 'transparent', borderTop: `2px solid ${isActive ? '#e8ff00' : 'transparent'}` }}>
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-[8px] font-bold tracking-wide" style={{ fontFamily: 'monospace', color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.3)' }}>
                      {item.label}
                    </span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

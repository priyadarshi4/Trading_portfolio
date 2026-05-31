// ============================================================
// MODIFIED FILE: client/src/components/layout/Layout.jsx
// Change: Add Trading Club section to NAV_SECTIONS
// Find the 'SYSTEM' section and insert COMMUNITY before it
// ============================================================

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  // ← NEW SECTION
  {
    label: 'COMMUNITY',
    items: [
      { to: '/club',         icon: '📢', label: 'TRADING CLUB'  },
      { to: '/club/profile', icon: '👤', label: 'MY PROFILE'    },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: '⚙', label: 'SETTINGS' },
    ],
  },
];

const TICKERS = [
  { sym: 'XAUUSD', val: '2,318.40', chg: '+1.2%', up: true },
  { sym: 'NQ',     val: '17,842',   chg: '+0.8%', up: true },
  { sym: 'EURUSD', val: '1.0892',   chg: '-0.3%', up: false },
  { sym: 'GBPUSD', val: '1.2734',   chg: '+0.5%', up: true },
  { sym: 'ES',     val: '5,241',    chg: '+0.6%', up: true },
  { sym: 'USDJPY', val: '157.34',   chg: '-0.2%', up: false },
  { sym: 'BTCUSD', val: '67,240',   chg: '+2.1%', up: true },
  { sym: 'XAGUSD', val: '27.48',    chg: '-0.4%', up: false },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick]           = useState(0);
  const { user, logout }          = useAuthStore();
  const navigate                  = useNavigate();
  const location                  = useLocation();

  useEffect(() => {
    if (location.pathname === '/market') setCollapsed(true);
  }, [location.pathname]);

  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % 60), 1000);
    return () => clearInterval(t);
  }, []);

  // Trading Club needs full height (no padding)
  const isFullHeight = ['/market', '/club'].some(p => location.pathname.startsWith(p));

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DX';

  return (
    <div className="flex h-screen overflow-hidden noise-bg scanlines" style={{ background: '#030303' }}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 52 : 220 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'rgba(5,5,5,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className="px-3 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: 60 }}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl leading-none" style={{
                  background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.04em'
                }}>Dy/Dx/Dt</div>
                <div className="text-[8px] tracking-[0.28em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>TRADER ANALYTICS</div>
              </div>
              <button onClick={() => setCollapsed(true)} className="text-xs hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.18)' }}>◀</button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="w-full text-center font-display text-base" style={{ color: '#e8ff00' }}>dx</button>
          )}
        </div>

        {/* Status */}
        {!collapsed && (
          <div className="px-3 py-1.5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#00ffb3', boxShadow: '0 0 6px #00ffb3' }} />
            <span className="text-[8px] tracking-widest" style={{ color: 'rgba(0,255,179,0.5)', fontFamily: 'monospace' }}>REPLAY MODE</span>
          </div>
        )}

        {/* Nav with sections */}
        <nav className="flex-1 py-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 pt-3 pb-1 text-[7px] font-bold tracking-[0.3em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace' }}>
                  {section.label}
                </div>
              )}
              {collapsed && <div className="py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />}

              {section.items.map(item => (
                <NavLink key={item.to} to={item.to}
                  end={['/trades','/calendar','/club'].includes(item.to)}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-2.5 px-3 py-2 transition-all duration-100 cursor-pointer"
                      style={{
                        background: isActive ? 'rgba(232,255,0,0.06)' : 'transparent',
                        borderLeft: `2px solid ${isActive ? '#e8ff00' : 'transparent'}`,
                      }}>
                      <span className="flex-shrink-0 text-sm leading-none text-center" style={{
                        width: 16, fontFamily: 'monospace',
                        color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.2)',
                      }}>{item.icon}</span>
                      {!collapsed && (
                        <span className="text-[9px] font-bold tracking-[0.12em] uppercase truncate" style={{
                          fontFamily: 'monospace',
                          color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.28)',
                        }}>{item.label}</span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t p-2.5 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[9px] font-black"
              style={{ background: 'linear-gradient(135deg, #e8ff00, #a78bfa)', color: '#000', fontFamily: 'monospace' }}>
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{user?.name || 'Trader'}</div>
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="text-[8px] hover:text-danger transition-colors" style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>logout</button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)', minHeight: 40 }}>
          <button onClick={() => setCollapsed(v => !v)} className="text-sm flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>☰</button>

          <div className="flex items-center gap-5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {TICKERS.map(t => (
              <div key={t.sym} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>{t.sym}</span>
                <span className="text-[9px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{t.val}</span>
                <span className="text-[8px]" style={{ color: t.up ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>{t.chg}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#e8ff00' }} />
            <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
            </span>
          </div>
        </div>

        {/* Page content — no padding for full-height pages */}
        <main className={`flex-1 overflow-y-auto ${isFullHeight ? '' : 'p-5 hatching-bg'}`}>
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
    </div>
  );
}

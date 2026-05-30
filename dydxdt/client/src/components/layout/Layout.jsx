import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const NAV = [
  { to: '/dashboard',  icon: '◈', label: 'OVERVIEW'    },
  { to: '/trades',     icon: '▤', label: 'TRADES'       },
  { to: '/trades/add', icon: '+', label: 'LOG TRADE'    },
  { to: '/analytics',  icon: '⬡', label: 'ANALYTICS'   },
  { to: '/equity',     icon: '◉', label: 'EQUITY'       },
  { to: '/calendar',   icon: '▦', label: 'CALENDAR'     },
  { to: '/strategies', icon: '◎', label: 'STRATEGIES'   },
  { to: '/risk',       icon: '◇', label: 'RISK CALC'    },
  { to: '/journal',    icon: '✦', label: 'JOURNAL'      },
  { to: '/stats',      icon: '★', label: 'HALL OF STATS'},
  { to: '/reports',    icon: '↓', label: 'REPORTS'      },
  { to: '/settings',   icon: '⚙', label: 'SETTINGS'     },
];

const TICKERS = [
  { sym: 'XAUUSD', val: '2,318.40', chg: '+1.2%', up: true },
  { sym: 'NQ',     val: '17,842',   chg: '+0.8%', up: true },
  { sym: 'EURUSD', val: '1.0892',   chg: '-0.3%', up: false },
  { sym: 'GBPUSD', val: '1.2734',   chg: '+0.5%', up: true },
  { sym: 'ES',     val: '5,241',    chg: '+0.6%', up: true },
  { sym: 'USDJPY', val: '157.34',   chg: '-0.2%', up: false },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick] = useState(0);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % 60), 1000);
    return () => clearInterval(t);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DX';

  return (
    <div className="flex h-screen overflow-hidden noise-bg scanlines" style={{ background: '#030303' }}>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'rgba(5,5,5,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className="px-3 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: 64 }}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl leading-none" style={{
                  background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.04em'
                }}>Dy/Dx/Dt</div>
                <div className="text-[8px] tracking-[0.3em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>TRADER ANALYTICS</div>
              </div>
              <button onClick={() => setCollapsed(true)} className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>◀</button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="w-full text-center font-display text-base" style={{ color: '#e8ff00' }}>dx</button>
          )}
        </div>

        {/* Replay status */}
        {!collapsed && (
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#00ffb3', boxShadow: '0 0 6px #00ffb3' }} />
            <span className="text-[9px] tracking-widest" style={{ color: 'rgba(0,255,179,0.6)', fontFamily: 'monospace' }}>REPLAY MODE</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/trades'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 transition-all duration-150 w-full
                ${isActive ? 'bg-acid/5 border-l-2 border-acid' : 'border-l-2 border-transparent hover:bg-white/[0.02]'}
              `}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <>
                  <span className="text-sm leading-none flex-shrink-0 text-center" style={{
                    width: 16, fontFamily: 'monospace',
                    color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.2)'
                  }}>{item.icon}</span>
                  {!collapsed && (
                    <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{
                      fontFamily: 'monospace',
                      color: isActive ? '#e8ff00' : 'rgba(255,255,255,0.3)'
                    }}>{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[10px] font-black" style={{
              background: 'linear-gradient(135deg, #e8ff00, #a78bfa)', color: '#000', fontFamily: 'monospace'
            }}>{initials}</div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{user?.name || 'Trader'}</div>
                <button onClick={() => { logout(); navigate('/login'); }} className="text-[9px] hover:text-danger transition-colors" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>logout</button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b flex-shrink-0"
          style={{ background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.05)', minHeight: 44 }}>

          {/* Ticker */}
          <div className="flex items-center gap-5 overflow-x-auto flex-1 no-scrollbar">
            {TICKERS.map(t => (
              <div key={t.sym} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{t.sym}</span>
                <span className="text-[10px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{t.val}</span>
                <span className="text-[9px] font-bold" style={{ color: t.up ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>{t.chg}</span>
              </div>
            ))}
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#e8ff00' }} />
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 hatching-bg">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

// ── KPI CARD ─────────────────────────────────────────────────────────────────
export const KPICard = ({ label, value, sub, color = '#e8ff00', prefix = '', suffix = '', loading }) => (
  <div className="relative overflow-hidden p-3 sm:p-4 card-glow border"
    style={{ background: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.06)', borderLeft: `3px solid ${color}` }}>
    {loading ? (
      <div className="animate-pulse space-y-2">
        <div className="h-2 w-16 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-5 w-24 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    ) : (
      <>
        <div className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{label}</div>
        <div className="text-lg sm:text-2xl font-display leading-none" style={{ color, letterSpacing: '0.03em', textShadow: `0 0 20px ${color}30` }}>
          {prefix}{value}{suffix}
        </div>
        {sub && <div className="text-[8px] mt-1 hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{sub}</div>}
      </>
    )}
    <div className="absolute -right-4 -bottom-4 w-14 h-14 rounded-full opacity-10" style={{ background: color, filter: 'blur(20px)' }} />
  </div>
);

// ── GLITCH HEADING ────────────────────────────────────────────────────────────
export const Glitch = ({ text, size = 'text-3xl sm:text-4xl', color = '#e8ff00' }) => (
  <span className={`font-display ${size} inline-block`} style={{
    color, letterSpacing: '0.05em',
    textShadow: `2px 0 0 rgba(255,0,100,0.4), -2px 0 0 rgba(0,200,255,0.4)`
  }}>{text}</span>
);

// ── PAGE HEADER ───────────────────────────────────────────────────────────────
export const PageHeader = ({ eyebrow, title, color = '#e8ff00', action }) => (
  <div className="flex items-start sm:items-end justify-between gap-3 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
    <div>
      {eyebrow && <div className="text-[8px] tracking-[0.3em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{eyebrow}</div>}
      <Glitch text={title} color={color} />
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ── CARD ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', accent }) => (
  <div className={`border p-3 sm:p-4 card-glow ${className}`}
    style={{
      background: 'rgba(10,10,10,0.9)',
      borderColor: 'rgba(255,255,255,0.06)',
      ...(accent && { borderTop: `2px solid ${accent}` })
    }}>
    {children}
  </div>
);

// ── CARD LABEL ────────────────────────────────────────────────────────────────
export const CardLabel = ({ children }) => (
  <div className="text-[8px] sm:text-[9px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
    // {children}
  </div>
);

// ── BUTTON ─────────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'acid', disabled, type = 'button', className = '' }) => {
  const styles = {
    acid:    { background: '#e8ff00', color: '#000' },
    ghost:   { background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' },
    danger:  { background: 'rgba(255,51,102,0.15)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)' },
    outline: { background: 'transparent', color: '#e8ff00', border: '1px solid rgba(232,255,0,0.3)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-3 sm:px-4 py-2 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px] ${className}`}
      style={{ fontFamily: 'monospace', ...styles[variant] }}>
      {children}
    </button>
  );
};

// ── BADGE ──────────────────────────────────────────────────────────────────────
export const Badge = ({ children, color }) => {
  const map = {
    WIN:   { bg: 'rgba(232,255,0,0.1)',    text: '#e8ff00',  border: 'rgba(232,255,0,0.2)' },
    LOSS:  { bg: 'rgba(255,51,102,0.1)',   text: '#ff3366',  border: 'rgba(255,51,102,0.2)' },
    BE:    { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    LONG:  { bg: 'rgba(0,255,179,0.1)',    text: '#00ffb3',  border: 'rgba(0,255,179,0.2)' },
    SHORT: { bg: 'rgba(255,51,102,0.1)',   text: '#ff3366',  border: 'rgba(255,51,102,0.2)' },
  };
  const s = map[children] || map[color] || map.BE;
  return (
    <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-wider"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontFamily: 'monospace' }}>
      {children}
    </span>
  );
};

// ── INPUT ──────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label-mono">{label}</label>}
    <input className="input-dark" style={{ minHeight: 40 }} {...props} />
    {error && <p className="text-[9px] mt-1" style={{ color: '#ff3366', fontFamily: 'monospace' }}>{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label-mono">{label}</label>}
    <textarea className="input-dark resize-none" {...props} />
    {error && <p className="text-[9px] mt-1" style={{ color: '#ff3366', fontFamily: 'monospace' }}>{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="label-mono">{label}</label>}
    <select className="input-dark" style={{ background: '#0a0a0a', minHeight: 40 }} {...props}>{children}</select>
    {error && <p className="text-[9px] mt-1" style={{ color: '#ff3366', fontFamily: 'monospace' }}>{error}</p>}
  </div>
);

// ── CHART TOOLTIP ─────────────────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 text-[10px]" style={{
      background: '#0a0a0a', border: '1px solid rgba(232,255,0,0.2)', fontFamily: 'monospace'
    }}>
      {label && <div className="mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.value >= 0 ? '#e8ff00' : '#ff3366' }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

// ── SPINNER ───────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-2 border-t-acid rounded-full animate-spin" style={{ borderColor: 'rgba(232,255,0,0.15)', borderTopColor: '#e8ff00' }} />
  </div>
);

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export const Empty = ({ message = 'No data yet', icon = '◈' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="text-3xl" style={{ color: 'rgba(255,255,255,0.1)' }}>{icon}</div>
    <div className="text-[9px] tracking-widest uppercase text-center" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{message}</div>
  </div>
);

// ── STAT ROW ──────────────────────────────────────────────────────────────────
export const StatRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{label}</span>
    <span className="text-[10px] font-bold" style={{ color: color || '#fff', fontFamily: 'monospace' }}>{value}</span>
  </div>
);

// ── DIRECTION TOGGLE ──────────────────────────────────────────────────────────
export const DirectionToggle = ({ value, onChange }) => (
  <div className="flex gap-2">
    {['LONG', 'SHORT'].map(d => (
      <button key={d} type="button" onClick={() => onChange(d)}
        className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-all min-h-[44px]"
        style={{
          fontFamily: 'monospace',
          background: value === d ? (d === 'LONG' ? 'rgba(0,255,179,0.12)' : 'rgba(255,51,102,0.12)') : 'rgba(255,255,255,0.02)',
          color: value === d ? (d === 'LONG' ? '#00ffb3' : '#ff3366') : 'rgba(255,255,255,0.25)',
          border: `1px solid ${value === d ? (d === 'LONG' ? 'rgba(0,255,179,0.3)' : 'rgba(255,51,102,0.3)') : 'rgba(255,255,255,0.06)'}`,
        }}>
        {d === 'LONG' ? '▲ LONG' : '▼ SHORT'}
      </button>
    ))}
  </div>
);

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = '#e8ff00' }) => (
  <div className="h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
    <div className="h-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
  </div>
);

// ── MODAL ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full sm:max-w-lg border sm:rounded-none max-h-[90vh] overflow-y-auto"
        style={{ background: '#080808', borderColor: 'rgba(232,255,0,0.15)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="font-display text-xl" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>{title}</div>
          <button onClick={onClose} className="text-sm p-1 hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>✕</button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
};

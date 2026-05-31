import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useEconomicCalendar } from '../../api/market/hooks';
import { PageHeader, Card, CardLabel, Spinner, Empty } from '../../components/ui/index';

const IMPACT_CONFIG = {
  High:   { color: '#ff3366', bg: 'rgba(255,51,102,0.1)',  border: 'rgba(255,51,102,0.25)', label: '●●●' },
  Medium: { color: '#e8ff00', bg: 'rgba(232,255,0,0.08)',  border: 'rgba(232,255,0,0.2)',   label: '●●○' },
  Low:    { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', label: '●○○' },
};

const CURRENCY_FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  INR: '🇮🇳', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭',
};

const FILTERS = ['ALL','HIGH','MEDIUM','LOW','USD','EUR','GBP','INR'];

export default function EconomicCalendarPage() {
  const [impactFilter,   setImpactFilter]   = useState('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('');

  const { data: events, isLoading } = useEconomicCalendar();

  const filtered = (events || []).filter(e => {
    if (impactFilter === 'ALL') return true;
    if (['HIGH','MEDIUM','LOW'].includes(impactFilter)) return e.impact.toUpperCase() === impactFilter;
    return e.currency === impactFilter;
  });

  // Group by date
  const grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });
  const sortedDates = Object.keys(grouped).sort();

  const dateLabel = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      if (isToday(d))    return 'TODAY';
      if (isTomorrow(d)) return 'TOMORROW';
      return format(d, 'EEEE, MMMM d').toUpperCase();
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader eyebrow="// MACRO EVENTS" title="ECONOMIC CALENDAR" color="#a78bfa" />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f}
              onClick={() => {
                if (['HIGH','MEDIUM','LOW'].includes(f)) { setImpactFilter(f === impactFilter ? 'ALL' : f); }
                else if (f === 'ALL') { setImpactFilter('ALL'); setCurrencyFilter(''); }
                else setCurrencyFilter(f === currencyFilter ? '' : f);
              }}
              className="px-3 py-1.5 text-[9px] font-bold border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (impactFilter === f || currencyFilter === f) ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                color:       (impactFilter === f || currencyFilter === f) ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                background:  (impactFilter === f || currencyFilter === f) ? 'rgba(167,139,250,0.08)' : 'transparent',
              }}>
              {CURRENCY_FLAGS[f] ? `${CURRENCY_FLAGS[f]} ${f}` : f}
            </button>
          ))}
        </div>
      </Card>

      {/* Impact legend */}
      <div className="flex gap-6">
        {Object.entries(IMPACT_CONFIG).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: val.color, fontFamily: 'monospace' }}>{val.label}</span>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{key} Impact</span>
          </div>
        ))}
      </div>

      {/* Events by date */}
      {isLoading ? <Spinner /> : !filtered.length ? <Empty message="No events match filter" icon="📅" /> : (
        <div className="space-y-6">
          {sortedDates.map(dateStr => (
            <div key={dateStr}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="font-display text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>
                  {dateLabel(dateStr)}
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                  {grouped[dateStr].length} EVENTS
                </div>
              </div>

              {/* Events */}
              <div className="space-y-2">
                {grouped[dateStr].map(event => {
                  const cfg = IMPACT_CONFIG[event.impact] || IMPACT_CONFIG.Low;
                  return (
                    <div key={event.id}
                      className="border p-3 flex items-center gap-4 transition-all hover:brightness-110"
                      style={{ background: cfg.bg, borderColor: cfg.border, borderLeft: `3px solid ${cfg.color}` }}>
                      {/* Time */}
                      <div className="text-center flex-shrink-0" style={{ width: 52 }}>
                        <div className="text-[11px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{event.time}</div>
                        <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>UTC</div>
                      </div>

                      {/* Currency */}
                      <div className="flex-shrink-0 text-center" style={{ width: 44 }}>
                        <div className="text-base">{CURRENCY_FLAGS[event.currency] || '🌐'}</div>
                        <div className="text-[8px] font-bold" style={{ color: cfg.color, fontFamily: 'monospace' }}>{event.currency}</div>
                      </div>

                      {/* Event name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate" style={{ color: '#fff', fontFamily: 'monospace' }}>{event.event}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-bold" style={{ color: cfg.color, fontFamily: 'monospace' }}>{cfg.label}</span>
                          <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{event.impact} Impact</span>
                        </div>
                      </div>

                      {/* Forecast / Previous */}
                      <div className="flex gap-6 flex-shrink-0 text-right">
                        <div>
                          <div className="text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>FORECAST</div>
                          <div className="text-[10px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{event.forecast || '—'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>PREVIOUS</div>
                          <div className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{event.previous || '—'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Market Hours Reference */}
      <Card>
        <CardLabel>MAJOR MARKET SESSIONS (UTC)</CardLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'SYDNEY',   open: '22:00', close: '07:00', color: '#a78bfa', pairs: 'AUD, NZD' },
            { name: 'TOKYO',    open: '00:00', close: '09:00', color: '#38bdf8', pairs: 'JPY, AUD' },
            { name: 'LONDON',   open: '08:00', close: '17:00', color: '#e8ff00', pairs: 'EUR, GBP, CHF' },
            { name: 'NEW YORK', open: '13:00', close: '22:00', color: '#00ffb3', pairs: 'USD, CAD, MXN' },
          ].map(s => (
            <div key={s.name} className="p-3 border" style={{ borderColor: `${s.color}20`, background: `${s.color}06` }}>
              <div className="font-display text-base mb-1" style={{ color: s.color }}>{s.name}</div>
              <div className="text-[9px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>{s.open} – {s.close}</div>
              <div className="text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{s.pairs}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { useTradeSummary, useTrades } from '../api/hooks';
import { PageHeader, Card, CardLabel, Spinner } from '../components/ui/index';

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const { data: summary, isLoading } = useTradeSummary();
  const calData = summary?.calendar || [];

  // Build map: dateStr -> {pnl, trades, wins}
  const calMap = {};
  calData.forEach(d => { calMap[d.date] = d; });

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart); // 0=Sun

  const selectedDay = selected ? calMap[format(selected, 'yyyy-MM-dd')] : null;

  // Get trades for selected day
  const selectedDate = selected ? format(selected, 'yyyy-MM-dd') : null;
  const { data: dayTrades } = useTrades(
    selectedDate ? { from: selectedDate, to: selectedDate, limit: 50 } : {},
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader eyebrow="// TRADING CALENDAR" title={format(current, 'MMMM yyyy').toUpperCase()} color="#e8ff00" />
        <div className="flex gap-2">
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="px-3 py-1 text-[10px] border transition-all hover:border-acid"
            style={{ fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>←</button>
          <button onClick={() => setCurrent(new Date())}
            className="px-3 py-1 text-[10px] border transition-all hover:border-acid"
            style={{ fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>TODAY</button>
          <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="px-3 py-1 text-[10px] border transition-all hover:border-acid"
            style={{ fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>→</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-7 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
              <div key={d} className="py-2 text-center text-[8px] tracking-widest font-bold"
                style={{ background: '#050505', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{d}</div>
            ))}
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16" style={{ background: '#040404' }} />
            ))}
            {/* Day cells */}
            {days.map(day => {
              const key  = format(day, 'yyyy-MM-dd');
              const data = calMap[key];
              const isSelected = selected && isSameDay(day, selected);
              const isToday = isSameDay(day, new Date());
              const pnl = data?.pnl ?? null;

              return (
                <div key={key} onClick={() => setSelected(isSameDay(day, selected) ? null : day)}
                  className="h-16 p-1.5 flex flex-col cursor-pointer transition-all duration-150 hover:brightness-125"
                  style={{
                    background: isSelected
                      ? 'rgba(232,255,0,0.08)'
                      : pnl === null
                        ? '#050505'
                        : pnl > 0
                          ? `rgba(232,255,0,${Math.min(pnl / 2000 * 0.2, 0.18)})`
                          : `rgba(255,51,102,${Math.min(Math.abs(pnl) / 1000 * 0.2, 0.18)})`,
                    borderTop: isSelected
                      ? '2px solid #e8ff00'
                      : pnl !== null
                        ? `2px solid ${pnl > 0 ? 'rgba(232,255,0,0.35)' : 'rgba(255,51,102,0.35)'}`
                        : '2px solid transparent',
                    outline: isSelected ? '1px solid rgba(232,255,0,0.3)' : 'none',
                  }}>
                  <div className="text-[9px]" style={{
                    color: isToday ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                    fontFamily: 'monospace', fontWeight: isToday ? 700 : 400
                  }}>{format(day, 'd')}</div>
                  {pnl !== null && (
                    <>
                      <div className="text-[10px] font-bold mt-0.5" style={{
                        color: pnl > 0 ? '#e8ff00' : '#ff3366', fontFamily: 'monospace'
                      }}>{pnl > 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}</div>
                      <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                        {data.trades}t
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-3">
            {[
              { color: 'rgba(232,255,0,0.3)', label: 'Profitable day' },
              { color: 'rgba(255,51,102,0.3)', label: 'Loss day' },
              { color: 'rgba(255,255,255,0.1)', label: 'No trades' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3" style={{ background: l.color }} />
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <Card className="h-fit">
          {!selected ? (
            <div className="py-10 text-center">
              <div className="text-2xl mb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>▦</div>
              <div className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                SELECT A DAY
              </div>
            </div>
          ) : (
            <>
              <CardLabel>{format(selected, 'EEEE, MMM d yyyy').toUpperCase()}</CardLabel>
              {selectedDay ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>DAY P&L</div>
                    <div className="font-display text-2xl" style={{
                      color: selectedDay.pnl >= 0 ? '#00ffb3' : '#ff3366',
                    }}>{selectedDay.pnl >= 0 ? '+' : ''}${selectedDay.pnl.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-4 text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    <span>{selectedDay.trades} trades</span>
                    <span style={{ color: '#00ffb3' }}>{selectedDay.wins}W</span>
                    <span style={{ color: '#ff3366' }}>{selectedDay.trades - selectedDay.wins}L</span>
                  </div>
                  <div className="border-t pt-3 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {(dayTrades?.data || []).map(t => (
                      <div key={t._id} className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{t.symbol}</div>
                          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.direction} · {t.strategyUsed || '—'}</div>
                        </div>
                        <div className="text-[10px] font-bold" style={{ color: t.profitLoss >= 0 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                          {t.profitLoss >= 0 ? '+' : ''}${t.profitLoss.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                  No trades on this day
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSettings } from '../api/hooks';
import { PageHeader, Card, CardLabel, Input, Select, StatRow } from '../components/ui/index';

export default function RiskPage() {
  const { data: settings } = useSettings();

  const [capital,    setCapital]    = useState('10000');
  const [riskPct,    setRiskPct]    = useState('1');
  const [entry,      setEntry]      = useState('');
  const [sl,         setSl]         = useState('');
  const [tp,         setTp]         = useState('');
  const [direction,  setDirection]  = useState('LONG');

  useEffect(() => {
    if (settings) {
      setCapital(String(settings.currentCapital || 10000));
      setRiskPct(String(settings.riskPercent || 1));
    }
  }, [settings]);

  const riskAmt    = (parseFloat(capital) || 0) * ((parseFloat(riskPct) || 0) / 100);
  const slDist     = Math.abs((parseFloat(entry) || 0) - (parseFloat(sl) || 0));
  const tpDist     = Math.abs((parseFloat(tp) || 0) - (parseFloat(entry) || 0));
  const posSize    = slDist ? (riskAmt / slDist).toFixed(4) : '—';
  const rr         = slDist && tpDist ? (tpDist / slDist).toFixed(2) : '—';
  const reward     = slDist && tpDist ? (riskAmt * (tpDist / slDist)).toFixed(2) : '—';
  const maxLoss    = riskAmt.toFixed(2);
  const marginUsed = posSize !== '—' && entry ? (parseFloat(posSize) * parseFloat(entry)).toFixed(2) : '—';

  const rrNum = parseFloat(rr);
  const rrColor = isNaN(rrNum) ? 'rgba(255,255,255,0.3)' : rrNum >= 2 ? '#00ffb3' : rrNum >= 1 ? '#e8ff00' : '#ff3366';

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <PageHeader eyebrow="// RISK ENGINE" title="RISK CALCULATOR" color="#ff3366" />

      <Card accent="#ff3366">
        <CardLabel>ACCOUNT PARAMETERS</CardLabel>
        <div className="space-y-3">
          <Input label="ACCOUNT CAPITAL ($)" type="number" value={capital} onChange={e => setCapital(e.target.value)} />
          <div>
            <label className="label-mono">RISK PER TRADE (%)</label>
            <div className="flex gap-2">
              {['0.5','1','1.5','2','3'].map(r => (
                <button key={r} onClick={() => setRiskPct(r)}
                  className="flex-1 py-1.5 text-[9px] font-bold border transition-all"
                  style={{
                    fontFamily: 'monospace',
                    borderColor: riskPct === r ? '#ff3366' : 'rgba(255,255,255,0.08)',
                    color: riskPct === r ? '#ff3366' : 'rgba(255,255,255,0.3)',
                    background: riskPct === r ? 'rgba(255,51,102,0.08)' : 'transparent',
                  }}>{r}%</button>
              ))}
            </div>
            <input type="range" min="0.1" max="5" step="0.1" value={riskPct}
              onChange={e => setRiskPct(e.target.value)}
              className="w-full mt-2" style={{ accentColor: '#ff3366' }} />
          </div>
        </div>
      </Card>

      <Card>
        <CardLabel>TRADE PARAMETERS</CardLabel>
        <div className="space-y-3">
          <div className="flex gap-2 mb-2">
            {['LONG','SHORT'].map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className="flex-1 py-2 text-[9px] font-bold tracking-widest uppercase border transition-all"
                style={{
                  fontFamily: 'monospace',
                  background: direction === d ? (d === 'LONG' ? 'rgba(0,255,179,0.1)' : 'rgba(255,51,102,0.1)') : 'transparent',
                  color: direction === d ? (d === 'LONG' ? '#00ffb3' : '#ff3366') : 'rgba(255,255,255,0.25)',
                  border: `1px solid ${direction === d ? (d === 'LONG' ? 'rgba(0,255,179,0.3)' : 'rgba(255,51,102,0.3)') : 'rgba(255,255,255,0.06)'}`,
                }}>{d === 'LONG' ? '▲ LONG' : '▼ SHORT'}</button>
            ))}
          </div>
          <Input label="ENTRY PRICE" type="number" step="any" placeholder="0.00000" value={entry} onChange={e => setEntry(e.target.value)} />
          <Input label="STOP LOSS"   type="number" step="any" placeholder="0.00000" value={sl}    onChange={e => setSl(e.target.value)}    />
          <Input label="TAKE PROFIT" type="number" step="any" placeholder="0.00000" value={tp}    onChange={e => setTp(e.target.value)}    />
        </div>
      </Card>

      {/* Results */}
      <Card accent="#e8ff00">
        <CardLabel>CALCULATED RESULTS</CardLabel>

        {/* Big RR display */}
        <div className="flex items-center justify-between px-4 py-4 mb-4 border"
          style={{ background: 'rgba(232,255,0,0.03)', borderColor: 'rgba(232,255,0,0.1)' }}>
          <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>RISK / REWARD RATIO</div>
          <div className="font-display text-3xl" style={{ color: rrColor }}>{rr === '—' ? '—' : `${rr}R`}</div>
        </div>

        <div className="space-y-0">
          <StatRow label="Risk Amount ($)"    value={`$${maxLoss}`}   color="#ff3366" />
          <StatRow label="SL Distance (pts)"  value={slDist.toFixed(5) || '—'} />
          <StatRow label="Position Size"      value={posSize}          color="#e8ff00" />
          <StatRow label="Potential Reward"   value={reward !== '—' ? `$${reward}` : '—'} color="#00ffb3" />
          <StatRow label="Notional Value"     value={marginUsed !== '—' ? `$${marginUsed}` : '—'} />
          <StatRow label="Risk % of Capital"  value={`${riskPct}%`}   color="#a78bfa" />
        </div>
      </Card>

      {/* Risk guidelines */}
      <Card>
        <CardLabel>RISK GUIDELINES</CardLabel>
        <div className="space-y-2 text-[10px]" style={{ fontFamily: 'monospace' }}>
          {[
            { pct: '≤ 1%', label: 'Conservative',  color: '#00ffb3', tip: 'Best for beginners and funded accounts' },
            { pct: '1–2%', label: 'Moderate',       color: '#e8ff00', tip: 'Standard professional risk' },
            { pct: '2–3%', label: 'Aggressive',     color: '#a78bfa', tip: 'Higher drawdown risk' },
            { pct: '> 3%', label: 'Dangerous',      color: '#ff3366', tip: 'Avoid — account destruction risk' },
          ].map(g => (
            <div key={g.pct} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="w-12 font-bold" style={{ color: g.color }}>{g.pct}</div>
              <div className="w-24" style={{ color: g.color }}>{g.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)' }}>{g.tip}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

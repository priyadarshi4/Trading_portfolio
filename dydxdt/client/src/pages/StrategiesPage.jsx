import { useState } from 'react';
import { useStrategies, useCreateStrategy, useSyncStrategy } from '../api/hooks';
import { PageHeader, Card, CardLabel, Input, Textarea, Btn, Spinner, Empty, ProgressBar } from '../components/ui/index';

export default function StrategiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', rules:'', color:'#e8ff00', timeframes:'', markets:'' });

  const { data: strategies, isLoading } = useStrategies();
  const createStrategy = useCreateStrategy();
  const syncStrategy   = useSyncStrategy();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    await createStrategy.mutateAsync({
      ...form,
      rules:      form.rules.split('\n').filter(Boolean),
      timeframes: form.timeframes.split(',').map(t => t.trim()).filter(Boolean),
      markets:    form.markets.split(',').map(m => m.trim()).filter(Boolean),
    });
    setShowForm(false);
    setForm({ name:'', description:'', rules:'', color:'#e8ff00', timeframes:'', markets:'' });
  };

  const fmt$ = v => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader eyebrow="// PLAYBOOK" title="STRATEGY LAB" color="#a78bfa"
        action={<Btn onClick={() => setShowForm(v => !v)} variant="outline">{showForm ? 'CANCEL' : '+ NEW'}</Btn>} />

      {/* Create form */}
      {showForm && (
        <Card accent="#a78bfa">
          <CardLabel>NEW STRATEGY</CardLabel>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="STRATEGY NAME *" placeholder="BOS+OB" value={form.name} onChange={set('name')} required />
              <div>
                <label className="label-mono">COLOR</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={set('color')}
                    className="w-10 h-10 border-0 cursor-pointer rounded" style={{ background: 'transparent' }} />
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{form.color}</span>
                </div>
              </div>
            </div>
            <Textarea label="DESCRIPTION" rows={2} placeholder="Brief setup overview..." value={form.description} onChange={set('description')} />
            <Textarea label="RULES (one per line)" rows={3} placeholder={"1. Wait for BOS\n2. Mark OB\n3. Enter retest"} value={form.rules} onChange={set('rules')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="TIMEFRAMES" placeholder="H1, H4, D1" value={form.timeframes} onChange={set('timeframes')} />
              <Input label="MARKETS"    placeholder="Forex, Futures" value={form.markets}    onChange={set('markets')} />
            </div>
            <Btn type="submit" disabled={createStrategy.isPending} className="w-full py-3">
              {createStrategy.isPending ? 'CREATING...' : 'CREATE STRATEGY →'}
            </Btn>
          </form>
        </Card>
      )}

      {/* Strategy grid — 1 col mobile, 2 md, 3 lg */}
      {isLoading ? <Spinner /> : !strategies?.length ? <Empty message="No strategies — create your first" icon="◎" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map(s => (
            <Card key={s._id} className="flex flex-col gap-3" accent={s.color || '#e8ff00'}>
              <div className="flex items-start justify-between">
                <div className="font-display text-lg" style={{ color: s.color || '#e8ff00', letterSpacing: '0.05em' }}>{s.name}</div>
                <div className="flex gap-2">
                  <span className="text-[8px] px-2 py-0.5 font-bold" style={{
                    background: s.winRate >= 60 ? 'rgba(0,255,179,0.1)' : 'rgba(255,51,102,0.1)',
                    color: s.winRate >= 60 ? '#00ffb3' : '#ff3366', fontFamily: 'monospace',
                    border: `1px solid ${s.winRate >= 60 ? 'rgba(0,255,179,0.2)' : 'rgba(255,51,102,0.2)'}`,
                  }}>{(s.winRate||0).toFixed(1)}% WR</span>
                  <button onClick={() => syncStrategy.mutate(s._id)}
                    className="text-[8px] transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>SYNC</button>
                </div>
              </div>
              {s.description && <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{s.description}</div>}
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

              {/* Stats 2×3 grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'WIN RATE',   value: `${(s.winRate||0).toFixed(1)}%`, color: s.winRate >= 60 ? '#00ffb3' : '#e8ff00' },
                  { label: 'NET P&L',    value: fmt$(s.netProfit||0), color: (s.netProfit||0) >= 0 ? '#00ffb3' : '#ff3366' },
                  { label: 'TRADES',     value: s.totalTrades || 0 },
                  { label: 'EXPECTANCY', value: `$${(s.expectancy||0).toFixed(2)}` },
                  { label: 'AVG R:R',    value: `${(s.avgRR||0).toFixed(2)}R`, color: '#a78bfa' },
                  { label: 'P. FACTOR',  value: (s.profitFactor||0).toFixed(2) },
                ].map(m => (
                  <div key={m.label} className="border p-2" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                    <div className="text-[7px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{m.label}</div>
                    <div className="text-[10px] font-bold" style={{ color: m.color || 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {s.winRate > 0 && <ProgressBar value={s.winRate} color={s.color || '#e8ff00'} />}
            </Card>
          ))}

          {/* Add new card */}
          <div className="border p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-acid/20 min-h-[160px]"
            onClick={() => setShowForm(true)}
            style={{ background: 'rgba(10,10,10,0.5)', borderColor: 'rgba(255,255,255,0.04)', borderStyle: 'dashed' }}>
            <div className="text-2xl" style={{ color: 'rgba(255,255,255,0.15)' }}>+</div>
            <div className="text-[9px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>NEW STRATEGY</div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTrade, useStrategies } from '../api/hooks';
import { PageHeader, Card, Input, Select, Textarea, Btn, DirectionToggle } from '../components/ui/index';

const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1'];
const SESSIONS   = ['Asian','London','New York','London/NY Overlap','Other'];
const MARKETS    = ['Forex','Futures','Commodities','Indices','Crypto','Stocks'];

const calcRR = (entry, exit, sl, direction) => {
  const e = parseFloat(entry), x = parseFloat(exit), s = parseFloat(sl);
  if (!e || !x || !s) return null;
  const risk   = Math.abs(e - s);
  const reward = Math.abs(x - e);
  if (!risk) return null;
  const rr = reward / risk;
  if (direction === 'LONG'  && x < e) return -rr;
  if (direction === 'SHORT' && x > e) return -rr;
  return rr;
};

export default function AddTrade() {
  const navigate = useNavigate();
  const createTrade = useCreateTrade();
  const { data: strategies } = useStrategies();

  const [form, setForm] = useState({
    symbol: '', direction: 'LONG', date: new Date().toISOString().split('T')[0],
    entryPrice: '', exitPrice: '', stopLoss: '', takeProfit: '', quantity: '',
    timeframe: 'H1', session: 'London', marketType: 'Forex',
    strategyUsed: '', notes: '', tags: '', mood: '',
    followedRules: '',
  });
  const [rr, setRR] = useState(null);

  useEffect(() => {
    const r = calcRR(form.entryPrice, form.exitPrice, form.stopLoss, form.direction);
    setRR(r);
  }, [form.entryPrice, form.exitPrice, form.stopLoss, form.direction]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      entryPrice:  parseFloat(form.entryPrice),
      exitPrice:   parseFloat(form.exitPrice),
      stopLoss:    form.stopLoss    ? parseFloat(form.stopLoss)    : undefined,
      takeProfit:  form.takeProfit  ? parseFloat(form.takeProfit)  : undefined,
      quantity:    parseFloat(form.quantity),
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      mood:        form.mood        ? parseInt(form.mood)          : undefined,
      followedRules: form.followedRules === 'true' ? true : form.followedRules === 'false' ? false : undefined,
    };
    await createTrade.mutateAsync(payload);
    navigate('/trades');
  };

  const rrColor = rr === null ? 'rgba(255,255,255,0.3)' : rr >= 2 ? '#00ffb3' : rr >= 1 ? '#e8ff00' : '#ff3366';

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader eyebrow="// TRADE INTAKE" title="LOG NEW TRADE" color="#00ffb3" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SYMBOL *" placeholder="XAUUSD" value={form.symbol}
              onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} required />
            <Input label="DATE *" type="date" value={form.date} onChange={set('date')} required />
          </div>
        </Card>

        <Card>
          <label className="label-mono">DIRECTION *</label>
          <DirectionToggle value={form.direction} onChange={v => setForm(p => ({ ...p, direction: v }))} />
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="ENTRY PRICE *" type="number" step="any" placeholder="0.00000"
              value={form.entryPrice} onChange={set('entryPrice')} required />
            <Input label="EXIT PRICE *"  type="number" step="any" placeholder="0.00000"
              value={form.exitPrice}  onChange={set('exitPrice')}  required />
            <Input label="STOP LOSS"     type="number" step="any" placeholder="0.00000"
              value={form.stopLoss}   onChange={set('stopLoss')}   />
            <Input label="TAKE PROFIT"   type="number" step="any" placeholder="0.00000"
              value={form.takeProfit} onChange={set('takeProfit')} />
          </div>

          {/* Live RR display */}
          <div className="flex items-center justify-between px-4 py-3 border" style={{
            background: rr !== null ? `rgba(${rr >= 1 ? '232,255,0' : '255,51,102'},0.04)` : 'rgba(255,255,255,0.02)',
            borderColor: rr !== null ? `rgba(${rr >= 1 ? '232,255,0' : '255,51,102'},0.2)` : 'rgba(255,255,255,0.06)'
          }}>
            <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              CALCULATED RISK / REWARD
            </div>
            <div className="font-display text-2xl" style={{ color: rrColor }}>
              {rr !== null ? `${rr.toFixed(2)}R` : '– – –'}
            </div>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Input label="QUANTITY / LOTS *" type="number" step="any" placeholder="0.10"
              value={form.quantity} onChange={set('quantity')} required />
            <Select label="TIMEFRAME" value={form.timeframe} onChange={set('timeframe')}>
              {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
            </Select>
            <Select label="SESSION" value={form.session} onChange={set('session')}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </Select>
            <Select label="MARKET TYPE" value={form.marketType} onChange={set('marketType')}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </Select>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Select label="STRATEGY" value={form.strategyUsed} onChange={set('strategyUsed')}>
              <option value="">— SELECT —</option>
              {(strategies || []).map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </Select>
            <Select label="FOLLOWED RULES?" value={form.followedRules} onChange={set('followedRules')}>
              <option value="">— SELECT —</option>
              <option value="true">YES ✓</option>
              <option value="false">NO ✗</option>
            </Select>
          </div>
          <div className="mt-4">
            <Textarea label="TRADE NOTES" rows={3} placeholder="Confluences, what did you see, why this trade..."
              value={form.notes} onChange={set('notes')} />
          </div>
          <div className="mt-4">
            <Input label="TAGS (comma-separated)" placeholder="ict, fvg, london-session"
              value={form.tags} onChange={set('tags')} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Btn type="submit" disabled={createTrade.isPending} className="flex-1 py-3">
            {createTrade.isPending ? 'LOGGING...' : 'RECORD TRADE →'}
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/trades')}>CANCEL</Btn>
        </div>
      </form>
    </div>
  );
}

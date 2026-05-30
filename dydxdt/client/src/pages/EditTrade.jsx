import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUpdateTrade, useStrategies } from '../api/hooks';
import { PageHeader, Card, Input, Select, Textarea, Btn, DirectionToggle } from '../components/ui/index';
import { Spinner } from '../components/ui/index';
import api from '../api/client';

const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1'];
const SESSIONS   = ['Asian','London','New York','London/NY Overlap','Other'];
const MARKETS    = ['Forex','Futures','Commodities','Indices','Crypto','Stocks'];

export default function EditTrade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateTrade = useUpdateTrade();
  const { data: strategies } = useStrategies();

  const { data, isLoading } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => api.get(`/trades/${id}`).then(r => r.data.data),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data) {
      setForm({
        symbol:      data.symbol || '',
        direction:   data.direction || 'LONG',
        date:        new Date(data.date).toISOString().split('T')[0],
        entryPrice:  data.entryPrice || '',
        exitPrice:   data.exitPrice  || '',
        stopLoss:    data.stopLoss   || '',
        takeProfit:  data.takeProfit || '',
        quantity:    data.quantity   || '',
        timeframe:   data.timeframe  || 'H1',
        session:     data.session    || 'London',
        marketType:  data.marketType || 'Forex',
        strategyUsed: data.strategyUsed || '',
        notes:       data.notes || '',
        tags:        (data.tags || []).join(', '),
        followedRules: data.followedRules === true ? 'true' : data.followedRules === false ? 'false' : '',
      });
    }
  }, [data]);

  if (isLoading || !form) return <Spinner />;

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice:  parseFloat(form.exitPrice),
      stopLoss:   form.stopLoss   ? parseFloat(form.stopLoss)   : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      quantity:   parseFloat(form.quantity),
      tags:       form.tags.split(',').map(t => t.trim()).filter(Boolean),
      followedRules: form.followedRules === 'true' ? true : form.followedRules === 'false' ? false : undefined,
    };
    await updateTrade.mutateAsync({ id, ...payload });
    navigate('/trades');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader eyebrow="// EDIT RECORD" title="EDIT TRADE" color="#a78bfa" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SYMBOL *" value={form.symbol}
              onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} required />
            <Input label="DATE *" type="date" value={form.date} onChange={set('date')} required />
          </div>
        </Card>
        <Card>
          <label className="label-mono">DIRECTION</label>
          <DirectionToggle value={form.direction} onChange={v => setForm(p => ({ ...p, direction: v }))} />
        </Card>
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ENTRY *" type="number" step="any" value={form.entryPrice} onChange={set('entryPrice')} required />
            <Input label="EXIT *"  type="number" step="any" value={form.exitPrice}  onChange={set('exitPrice')}  required />
            <Input label="STOP LOSS"    type="number" step="any" value={form.stopLoss}   onChange={set('stopLoss')}   />
            <Input label="TAKE PROFIT"  type="number" step="any" value={form.takeProfit} onChange={set('takeProfit')} />
            <Input label="QUANTITY *"   type="number" step="any" value={form.quantity}   onChange={set('quantity')} required />
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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select label="STRATEGY" value={form.strategyUsed} onChange={set('strategyUsed')}>
              <option value="">— SELECT —</option>
              {(strategies || []).map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </Select>
            <Select label="FOLLOWED RULES?" value={form.followedRules} onChange={set('followedRules')}>
              <option value="">—</option>
              <option value="true">YES ✓</option>
              <option value="false">NO ✗</option>
            </Select>
          </div>
          <Textarea label="NOTES" rows={3} value={form.notes} onChange={set('notes')} />
          <div className="mt-4">
            <Input label="TAGS" value={form.tags} onChange={set('tags')} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Btn type="submit" disabled={updateTrade.isPending} className="flex-1 py-3">
            {updateTrade.isPending ? 'SAVING...' : 'SAVE CHANGES →'}
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/trades')}>CANCEL</Btn>
        </div>
      </form>
    </div>
  );
}

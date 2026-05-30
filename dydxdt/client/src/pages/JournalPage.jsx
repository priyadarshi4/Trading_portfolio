// JournalPage.jsx
import { useState } from 'react';
import { format } from 'date-fns';
import { useJournalEntries, useCreateJournal } from '../api/hooks';
import { PageHeader, Card, CardLabel, Input, Textarea, Select, Btn, Spinner, Empty } from '../components/ui/index';

const MOODS = ['excellent','good','neutral','bad','terrible'];
const MOOD_ICONS = { excellent:'🟢', good:'🟡', neutral:'⚪', bad:'🟠', terrible:'🔴' };
const MOOD_COLORS = { excellent:'#00ffb3', good:'#e8ff00', neutral:'rgba(255,255,255,0.4)', bad:'#a78bfa', terrible:'#ff3366' };

export function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: 'neutral', confidenceScore: '7',
    wentWell: '', mistakes: '', lessons: '', planForTomorrow: '',
    followedRules: '', emotionalState: '', remarks: '',
  });

  const { data, isLoading } = useJournalEntries({ limit: 30 });
  const createEntry = useCreateJournal();
  const entries = data?.data || [];

  const set = k => e => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    await createEntry.mutateAsync({ ...form, confidenceScore: parseInt(form.confidenceScore), followedRules: form.followedRules === 'true' });
    setShowForm(false);
    setForm(f => ({ ...f, wentWell: '', mistakes: '', lessons: '', planForTomorrow: '', emotionalState: '', remarks: '' }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader eyebrow="// DAILY REFLECTION" title="TRADE JOURNAL" color="#00ffb3"
        action={<Btn onClick={() => setShowForm(v => !v)}>{showForm ? 'CANCEL' : '+ NEW ENTRY'}</Btn>} />

      {showForm && (
        <Card accent="#00ffb3">
          <CardLabel>NEW JOURNAL ENTRY</CardLabel>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="DATE" type="date" value={form.date} onChange={set('date')} />
              <div>
                <label className="label-mono">CONFIDENCE (1-10)</label>
                <input type="range" min="1" max="10" value={form.confidenceScore}
                  onChange={set('confidenceScore')} className="w-full mt-1" style={{ accentColor: '#e8ff00' }} />
                <div className="text-center text-[10px] mt-1" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>{form.confidenceScore}/10</div>
              </div>
            </div>

            <div>
              <label className="label-mono">MOOD TODAY</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m} type="button" onClick={() => setForm(p => ({ ...p, mood: m }))}
                    className="flex-1 py-1.5 text-[9px] font-bold border transition-all capitalize"
                    style={{
                      fontFamily: 'monospace',
                      borderColor: form.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.06)',
                      color: form.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.25)',
                      background: form.mood === m ? `${MOOD_COLORS[m]}15` : 'transparent',
                    }}>{m}</button>
                ))}
              </div>
            </div>

            {[
              { label: 'WHAT WENT WELL?',      key: 'wentWell',        ph: 'Describe your best trades and decisions...' },
              { label: 'MISTAKES MADE',         key: 'mistakes',        ph: 'What would you do differently?' },
              { label: 'LESSONS LEARNED',       key: 'lessons',         ph: 'Key takeaways from today...' },
              { label: 'PLAN FOR TOMORROW',     key: 'planForTomorrow', ph: 'Specific goals and focus areas...' },
              { label: 'EMOTIONAL STATE NOTES', key: 'emotionalState',  ph: 'How did emotions affect your trading?' },
            ].map(f => (
              <Textarea key={f.key} label={f.label} rows={2} placeholder={f.ph}
                value={form[f.key]} onChange={set(f.key)} />
            ))}

            <div className="grid grid-cols-2 gap-4">
              <Select label="FOLLOWED RULES?" value={form.followedRules} onChange={set('followedRules')}>
                <option value="">—</option>
                <option value="true">YES ✓</option>
                <option value="false">NO ✗</option>
              </Select>
              <Input label="SHORT REMARK" placeholder="One-liner..." value={form.remarks} onChange={set('remarks')} />
            </div>

            <Btn type="submit" disabled={createEntry.isPending} className="w-full py-3">
              {createEntry.isPending ? 'SAVING...' : 'SAVE JOURNAL ENTRY →'}
            </Btn>
          </form>
        </Card>
      )}

      {/* Entries list */}
      {isLoading ? <Spinner /> : entries.length === 0 ? <Empty message="No journal entries yet" icon="✦" /> : (
        <div className="space-y-3">
          {entries.map(e => (
            <Card key={e._id} className="cursor-pointer card-glow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-display text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>
                    {format(new Date(e.date), 'EEEE, MMMM d yyyy').toUpperCase()}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px]" style={{ color: MOOD_COLORS[e.mood], fontFamily: 'monospace', textTransform: 'capitalize' }}>
                      {MOOD_ICONS[e.mood]} {e.mood}
                    </span>
                    {e.confidenceScore && (
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        Confidence: {e.confidenceScore}/10
                      </span>
                    )}
                    {e.followedRules !== undefined && (
                      <span className="text-[9px]" style={{ color: e.followedRules ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                        Rules: {e.followedRules ? 'FOLLOWED ✓' : 'BROKE ✗'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {e.wentWell && (
                <div className="mb-2">
                  <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: 'rgba(0,255,179,0.5)', fontFamily: 'monospace' }}>WENT WELL</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{e.wentWell}</div>
                </div>
              )}
              {e.mistakes && (
                <div>
                  <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: 'rgba(255,51,102,0.5)', fontFamily: 'monospace' }}>MISTAKES</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{e.mistakes}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalPage;

import { useState } from 'react';
import { format } from 'date-fns';
import { useJournalEntries, useCreateJournal } from '../api/hooks';
import { PageHeader, Card, CardLabel, Input, Textarea, Select, Btn, Spinner, Empty } from '../components/ui/index';

const MOODS = ['excellent','good','neutral','bad','terrible'];
const MOOD_ICONS   = { excellent:'🟢', good:'🟡', neutral:'⚪', bad:'🟠', terrible:'🔴' };
const MOOD_COLORS  = { excellent:'#00ffb3', good:'#e8ff00', neutral:'rgba(255,255,255,0.4)', bad:'#a78bfa', terrible:'#ff3366' };

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: 'neutral', confidenceScore: '7',
    wentWell: '', mistakes: '', lessons: '', planForTomorrow: '', emotionalState: '', remarks: '', followedRules: '',
  });

  const { data, isLoading } = useJournalEntries({ limit: 30 });
  const createEntry = useCreateJournal();
  const entries = data?.data || [];

  const set = k => e => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    await createEntry.mutateAsync({ ...form, confidenceScore: parseInt(form.confidenceScore), followedRules: form.followedRules === 'true' });
    setShowForm(false);
    setForm(f => ({ ...f, wentWell:'', mistakes:'', lessons:'', planForTomorrow:'', emotionalState:'', remarks:'' }));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader eyebrow="// DAILY REFLECTION" title="TRADE JOURNAL" color="#00ffb3"
        action={
          <Btn onClick={() => setShowForm(v => !v)}>
            {showForm ? 'CANCEL' : '+ ENTRY'}
          </Btn>
        }
      />

      {/* Create form */}
      {showForm && (
        <Card accent="#00ffb3">
          <CardLabel>NEW JOURNAL ENTRY</CardLabel>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="DATE" type="date" value={form.date} onChange={set('date')} />
              <div>
                <label className="label-mono">CONFIDENCE ({form.confidenceScore}/10)</label>
                <input type="range" min="1" max="10" value={form.confidenceScore}
                  onChange={set('confidenceScore')} className="w-full mt-2" style={{ accentColor: '#e8ff00' }} />
              </div>
            </div>

            {/* Mood selector — horizontal scroll on mobile */}
            <div>
              <label className="label-mono">MOOD TODAY</label>
              <div className="flex gap-1.5 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
                {MOODS.map(m => (
                  <button key={m} type="button" onClick={() => setForm(p => ({ ...p, mood: m }))}
                    className="flex-shrink-0 px-3 py-2 text-[9px] font-bold border transition-all capitalize"
                    style={{
                      fontFamily: 'monospace', minHeight: 36,
                      borderColor: form.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.06)',
                      color:       form.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.25)',
                      background:  form.mood === m ? `${MOOD_COLORS[m]}15` : 'transparent',
                    }}>{MOOD_ICONS[m]} {m}</button>
                ))}
              </div>
            </div>

            {[
              { label:'WHAT WENT WELL?',   key:'wentWell',        ph:'Describe your wins...' },
              { label:'MISTAKES MADE',      key:'mistakes',        ph:'What to do differently?' },
              { label:'LESSONS LEARNED',    key:'lessons',         ph:'Key takeaways...' },
              { label:'PLAN FOR TOMORROW',  key:'planForTomorrow', ph:'Specific goals...' },
            ].map(f => (
              <Textarea key={f.key} label={f.label} rows={2} placeholder={f.ph}
                value={form[f.key]} onChange={set(f.key)} />
            ))}

            <div className="grid grid-cols-2 gap-3">
              <Select label="FOLLOWED RULES?" value={form.followedRules} onChange={set('followedRules')}>
                <option value="">—</option>
                <option value="true">YES ✓</option>
                <option value="false">NO ✗</option>
              </Select>
              <Input label="SHORT REMARK" placeholder="One-liner..." value={form.remarks} onChange={set('remarks')} />
            </div>

            <Btn type="submit" disabled={createEntry.isPending} className="w-full py-3">
              {createEntry.isPending ? 'SAVING...' : 'SAVE ENTRY →'}
            </Btn>
          </form>
        </Card>
      )}

      {/* Entries */}
      {isLoading ? <Spinner /> : entries.length === 0 ? <Empty message="No journal entries yet" icon="✦" /> : (
        <div className="space-y-3">
          {entries.map(e => {
            const isExp = expanded === e._id;
            return (
              <div key={e._id}
                className="border card-glow cursor-pointer"
                style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => setExpanded(isExp ? null : e._id)}>

                {/* Header — always visible */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display text-base sm:text-lg" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>
                        {format(new Date(e.date), 'EEE, MMM d yyyy').toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        <span className="text-[9px]" style={{ color: MOOD_COLORS[e.mood], fontFamily: 'monospace', textTransform: 'capitalize' }}>
                          {MOOD_ICONS[e.mood]} {e.mood}
                        </span>
                        {e.confidenceScore && (
                          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                            {e.confidenceScore}/10
                          </span>
                        )}
                        {e.followedRules !== undefined && (
                          <span className="text-[9px]" style={{ color: e.followedRules ? '#00ffb3' : '#ff3366', fontFamily: 'monospace' }}>
                            {e.followedRules ? 'RULES ✓' : 'RULES ✗'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                      {isExp ? '▲' : '▼'}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExp && (
                  <div className="px-3 sm:px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    onClick={e => e.stopPropagation()}>
                    {[
                      { key: 'wentWell',       label: 'WENT WELL',        color: 'rgba(0,255,179,0.5)'  },
                      { key: 'mistakes',        label: 'MISTAKES',          color: 'rgba(255,51,102,0.5)' },
                      { key: 'lessons',         label: 'LESSONS',           color: 'rgba(232,255,0,0.5)'  },
                      { key: 'planForTomorrow', label: 'PLAN FOR TOMORROW', color: 'rgba(167,139,250,0.5)'},
                      { key: 'emotionalState',  label: 'EMOTIONAL STATE',   color: 'rgba(255,255,255,0.3)'},
                    ].filter(f => e[f.key]).map(f => (
                      <div key={f.key} className="pt-3">
                        <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color: f.color, fontFamily: 'monospace' }}>{f.label}</div>
                        <div className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{e[f.key]}</div>
                      </div>
                    ))}
                    {e.remarks && (
                      <div className="pt-2 text-[9px] italic" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>"{e.remarks}"</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

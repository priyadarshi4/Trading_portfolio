import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../api/hooks';
import { PageHeader, Card, CardLabel, Input, Select, Btn, Spinner, StatRow } from '../components/ui/index';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import toast from 'react-hot-toast';

const TRADING_STYLES = ['Intraday','Swing','Scalp','Position','Mixed'];
const MARKETS = ['Forex','Futures','Commodities','Indices','Crypto'];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    initialCapital:'', riskPercent:'', broker:'', tradingStyle:'Intraday', preferredMarkets:[], timezone:'UTC',
  });
  const [profileForm, setProfileForm] = useState({ name:'', email:'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'' });
  const [activeSection, setActiveSection] = useState('trading');

  useEffect(() => {
    if (settings) setForm({
      initialCapital:   String(settings.initialCapital || ''),
      riskPercent:      String(settings.riskPercent    || ''),
      broker:           settings.broker                || '',
      tradingStyle:     settings.tradingStyle          || 'Intraday',
      preferredMarkets: settings.preferredMarkets      || [],
      timezone:         settings.timezone              || 'UTC',
    });
  }, [settings]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const toggleMarket = m => setForm(p => ({
    ...p,
    preferredMarkets: p.preferredMarkets.includes(m)
      ? p.preferredMarkets.filter(x => x !== m)
      : [...p.preferredMarkets, m],
  }));

  const handleSave = async e => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      ...form,
      initialCapital: parseFloat(form.initialCapital),
      riskPercent: parseFloat(form.riskPercent),
    });
  };

  const handleProfile = async e => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/me', profileForm);
      updateUser(data.user);
      toast.success('Profile updated ✓');
    } catch { toast.error('Failed'); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast.error('New password must be 6+ chars');
    try {
      await api.put('/auth/password', pwForm);
      setPwForm({ currentPassword:'', newPassword:'' });
      toast.success('Password changed ✓');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (isLoading) return <Spinner />;

  const SECTIONS = [
    { id:'trading', label:'TRADING'  },
    { id:'profile', label:'PROFILE'  },
    { id:'security',label:'SECURITY' },
  ];

  return (
    <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
      <PageHeader eyebrow="// CONFIGURATION" title="SETTINGS" color="#a78bfa" />

      {/* Section tabs — horizontal scroll on mobile */}
      <div className="flex gap-1 overflow-x-auto border-b pb-0" style={{ borderColor: 'rgba(255,255,255,0.06)', scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="flex-shrink-0 px-4 py-2.5 text-[9px] font-bold tracking-widest uppercase transition-all"
            style={{
              fontFamily: 'monospace',
              color:        activeSection === s.id ? '#e8ff00' : 'rgba(255,255,255,0.3)',
              borderBottom: `2px solid ${activeSection === s.id ? '#e8ff00' : 'transparent'}`,
              background:   'transparent',
            }}>{s.label}</button>
        ))}
      </div>

      {/* Trading settings */}
      {activeSection === 'trading' && (
        <form onSubmit={handleSave} className="space-y-4">
          <Card accent="#a78bfa">
            <CardLabel>TRADING PROFILE</CardLabel>
            <div className="space-y-4">
              <Input label="INITIAL CAPITAL ($)" type="number" value={form.initialCapital}
                onChange={e => setForm(p => ({ ...p, initialCapital: e.target.value }))} />

              <div>
                <label className="label-mono">RISK PER TRADE (%)</label>
                <input type="range" min="0.1" max="5" step="0.1" value={form.riskPercent}
                  onChange={e => setForm(p => ({ ...p, riskPercent: e.target.value }))}
                  className="w-full mt-1" style={{ accentColor: '#a78bfa' }} />
                <div className="text-center text-[10px] mt-1" style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{form.riskPercent}%</div>
              </div>

              <Input label="BROKER / PLATFORM" placeholder="MetaTrader 5, NinjaTrader..."
                value={form.broker} onChange={e => setForm(p => ({ ...p, broker: e.target.value }))} />

              <Select label="TRADING STYLE" value={form.tradingStyle}
                onChange={e => setForm(p => ({ ...p, tradingStyle: e.target.value }))}>
                {TRADING_STYLES.map(s => <option key={s}>{s}</option>)}
              </Select>

              <div>
                <label className="label-mono">PREFERRED MARKETS</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {MARKETS.map(m => (
                    <button key={m} type="button" onClick={() => toggleMarket(m)}
                      className="px-3 py-2 text-[9px] font-bold border transition-all"
                      style={{
                        fontFamily: 'monospace',
                        borderColor: form.preferredMarkets.includes(m) ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                        color:       form.preferredMarkets.includes(m) ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                        background:  form.preferredMarkets.includes(m) ? 'rgba(167,139,250,0.08)' : 'transparent',
                      }}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <Btn type="submit" disabled={updateSettings.isPending} className="mt-5 w-full py-3" variant="outline">
              {updateSettings.isPending ? 'SAVING...' : 'SAVE SETTINGS →'}
            </Btn>
          </Card>

          {/* Summary */}
          <Card>
            <CardLabel>ACCOUNT SUMMARY</CardLabel>
            <StatRow label="Initial Capital" value={`$${settings?.initialCapital?.toFixed(2)||'0.00'}`} />
            <StatRow label="Current Capital" value={`$${settings?.currentCapital?.toFixed(2)||'0.00'}`} color="#e8ff00" />
            <StatRow label="Risk Per Trade"  value={`${settings?.riskPercent||0}%`} color="#ff3366" />
            <StatRow label="Broker"          value={settings?.broker||'—'} />
            <StatRow label="Style"           value={settings?.tradingStyle||'—'} />
          </Card>
        </form>
      )}

      {/* Profile */}
      {activeSection === 'profile' && (
        <form onSubmit={handleProfile}>
          <Card>
            <CardLabel>YOUR PROFILE</CardLabel>
            <div className="space-y-3">
              <Input label="DISPLAY NAME" value={profileForm.name}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
              <Input label="EMAIL" type="email" value={profileForm.email}
                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <Btn type="submit" className="mt-4 w-full py-3" variant="ghost">UPDATE PROFILE</Btn>
          </Card>
        </form>
      )}

      {/* Security */}
      {activeSection === 'security' && (
        <form onSubmit={handlePassword}>
          <Card>
            <CardLabel>CHANGE PASSWORD</CardLabel>
            <div className="space-y-3">
              <Input label="CURRENT PASSWORD" type="password" value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
              <Input label="NEW PASSWORD (min 6)" type="password" value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <Btn type="submit" className="mt-4 w-full py-3" variant="ghost">CHANGE PASSWORD</Btn>
          </Card>
        </form>
      )}
    </div>
  );
}

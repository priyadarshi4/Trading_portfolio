import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', initialCapital: '10000' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ ...form, initialCapital: parseFloat(form.initialCapital) });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg scanlines hatching-bg" style={{ background: '#030303' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-sm px-4">

        <div className="text-center mb-8">
          <div className="font-display text-5xl mb-1" style={{
            background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.04em'
          }}>Dy/Dx/Dt</div>
          <div className="text-[9px] tracking-[0.35em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>CREATE YOUR TRADING PROFILE</div>
        </div>

        <div className="border p-6 space-y-4" style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>// NEW ACCOUNT</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'FULL NAME',        key: 'name',           type: 'text',     ph: 'Priyadarshi Prince' },
              { label: 'EMAIL',            key: 'email',          type: 'email',    ph: 'trader@example.com' },
              { label: 'PASSWORD',         key: 'password',       type: 'password', ph: 'min 6 characters' },
              { label: 'STARTING CAPITAL ($)', key: 'initialCapital', type: 'number', ph: '10000' },
            ].map(f => (
              <div key={f.key}>
                <label className="label-mono">{f.label}</label>
                <input className="input-dark" type={f.type} placeholder={f.ph}
                  value={form[f.key]} onChange={set(f.key)} required min={f.type === 'number' ? 0 : undefined} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-acid w-full py-3 disabled:opacity-50">
              {loading ? 'CREATING ACCOUNT...' : 'LAUNCH TERMINAL →'}
            </button>
          </form>

          <p className="text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            Have an account?{' '}
            <Link to="/login" className="hover:text-acid transition-colors" style={{ color: 'rgba(232,255,0,0.6)' }}>LOGIN</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

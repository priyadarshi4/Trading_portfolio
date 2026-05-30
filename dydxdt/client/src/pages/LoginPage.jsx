import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg scanlines hatching-bg" style={{ background: '#030303' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-sm px-4">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display text-5xl mb-1" style={{
            background: 'linear-gradient(135deg, #e8ff00, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.04em'
          }}>Dy/Dx/Dt</div>
          <div className="text-[9px] tracking-[0.35em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>TRADER ANALYTICS PLATFORM</div>
        </div>

        <div className="border p-6 space-y-4" style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>// AUTHENTICATE</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-mono">EMAIL</label>
              <input className="input-dark" type="email" placeholder="trader@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label-mono">PASSWORD</label>
              <input className="input-dark" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-acid w-full py-3 disabled:opacity-50">
              {loading ? 'AUTHENTICATING...' : 'ACCESS TERMINAL →'}
            </button>
          </form>

          <p className="text-center text-[9px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            No account?{' '}
            <Link to="/register" className="hover:text-acid transition-colors" style={{ color: 'rgba(232,255,0,0.6)' }}>REGISTER</Link>
          </p>
        </div>

        <p className="text-center text-[9px] mt-6" style={{ color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
          Founded by Priyadarshi Prince
        </p>
      </motion.div>
    </div>
  );
}

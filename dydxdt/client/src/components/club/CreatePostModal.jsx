import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreatePost, useUpdatePost } from '../../api/club/hooks';
import useClubStore from '../../store/clubStore';

const CATEGORIES = ['Trading Idea','Swing Trading','Intraday','Options','Crypto','Market News','Educational','Trade Review','Stock Analysis','General'];
const DIRECTIONS  = ['', 'LONG', 'SHORT', 'NEUTRAL'];

export default function CreatePostModal() {
  const { createModalOpen, editingPost, closeCreateModal } = useClubStore();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [form, setForm] = useState({
    title: '', description: '', category: 'Trading Idea',
    symbol: '', strategyType: '', tags: '', direction: '',
    images: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (editingPost) {
      setForm({
        title:        editingPost.title || '',
        description:  editingPost.description || '',
        category:     editingPost.category || 'Trading Idea',
        symbol:       editingPost.symbol || '',
        strategyType: editingPost.strategyType || '',
        tags:         (editingPost.tags || []).join(', '),
        direction:    editingPost.direction || '',
        images:       editingPost.images || [],
      });
    } else {
      setForm({ title:'', description:'', category:'Trading Idea', symbol:'', strategyType:'', tags:'', direction:'', images:[] });
    }
    setPreviewUrl('');
  }, [editingPost, createModalOpen]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (!t) return;
    const current = form.tags ? form.tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    if (!current.includes(t) && current.length < 8) {
      setForm(p => ({ ...p, tags: [...current, t].join(', ') }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    const current = form.tags.split(',').map(x => x.trim()).filter(x => x && x !== tag);
    setForm(p => ({ ...p, tags: current.join(', ') }));
  };

  const handleImageUrl = () => {
    if (!previewUrl.startsWith('http')) return;
    setForm(p => ({ ...p, images: [{ url: previewUrl, caption: '' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      symbol: form.symbol.toUpperCase(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost._id, ...payload });
    } else {
      await createPost.mutateAsync(payload);
    }
    closeCreateModal();
  };

  const isPending = createPost.isPending || updatePost.isPending;
  const currentTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!createModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={closeCreateModal}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto border"
          style={{ background: '#080808', borderColor: 'rgba(232,255,0,0.18)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-[8px] tracking-[0.3em] uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>// TRADING CLUB</div>
              <div className="font-display text-xl" style={{ color: '#e8ff00', letterSpacing: '0.05em' }}>
                {editingPost ? 'EDIT IDEA' : 'SHARE YOUR IDEA'}
              </div>
            </div>
            <button onClick={closeCreateModal} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="label-mono">TITLE *</label>
              <input className="input-dark" placeholder="e.g. NIFTY Breakout Setup — BOS + OB confluence"
                value={form.title} onChange={set('title')} required maxLength={200} />
            </div>

            {/* Category + Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-mono">CATEGORY *</label>
                <select className="input-dark" style={{ background: '#0a0a0a' }} value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-mono">DIRECTION</label>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map(d => (
                    <button key={d || 'none'} type="button" onClick={() => setForm(p => ({ ...p, direction: d }))}
                      className="flex-1 py-1.5 text-[8px] font-bold border transition-all"
                      style={{
                        fontFamily: 'monospace',
                        background: form.direction === d ? (d === 'LONG' ? 'rgba(0,255,179,0.1)' : d === 'SHORT' ? 'rgba(255,51,102,0.1)' : d === 'NEUTRAL' ? 'rgba(232,255,0,0.08)' : 'rgba(255,255,255,0.03)') : 'transparent',
                        color: form.direction === d ? (d === 'LONG' ? '#00ffb3' : d === 'SHORT' ? '#ff3366' : d === 'NEUTRAL' ? '#e8ff00' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.25)',
                        border: `1px solid ${form.direction === d ? (d === 'LONG' ? 'rgba(0,255,179,0.3)' : d === 'SHORT' ? 'rgba(255,51,102,0.3)' : 'rgba(232,255,0,0.2)') : 'rgba(255,255,255,0.06)'}`,
                      }}>{d || 'NONE'}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Symbol + Strategy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-mono">SYMBOL (optional)</label>
                <input className="input-dark" placeholder="NIFTY, XAUUSD, AAPL..."
                  value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className="label-mono">STRATEGY TYPE</label>
                <input className="input-dark" placeholder="BOS+OB, FVG, Breakout..."
                  value={form.strategyType} onChange={set('strategyType')} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label-mono">DESCRIPTION *</label>
              <textarea className="input-dark resize-none" rows={5}
                placeholder="Share your analysis, confluence factors, entry/exit levels, risk management..."
                value={form.description} onChange={set('description')} required maxLength={5000} />
              <div className="text-right text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {form.description.length}/5000
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="label-mono">TAGS</label>
              <div className="flex gap-2">
                <input className="input-dark flex-1" placeholder="#NIFTY, #BREAKOUT, #RSI..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <button type="button" onClick={addTag}
                  className="px-3 py-1.5 text-[9px] font-bold border transition-all"
                  style={{ borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa', fontFamily: 'monospace' }}>ADD</button>
              </div>
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentTags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-[8px]"
                      style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'monospace' }}>
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="label-mono">CHART IMAGE URL (TradingView screenshot etc.)</label>
              <div className="flex gap-2">
                <input className="input-dark flex-1" placeholder="https://..."
                  value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} />
                <button type="button" onClick={handleImageUrl}
                  className="px-3 py-1.5 text-[9px] font-bold border"
                  style={{ borderColor: 'rgba(232,255,0,0.2)', color: '#e8ff00', fontFamily: 'monospace' }}>ATTACH</button>
              </div>
              {form.images?.length > 0 && (
                <div className="mt-2 relative">
                  <img src={form.images[0].url} alt="preview"
                    className="w-full h-32 object-cover border" style={{ borderColor: 'rgba(232,255,0,0.15)' }} />
                  <button type="button" onClick={() => setForm(p => ({ ...p, images: [] }))}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-[10px]"
                    style={{ background: 'rgba(0,0,0,0.8)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)' }}>✕</button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending}
                className="btn-acid flex-1 py-3 disabled:opacity-40">
                {isPending ? 'PUBLISHING...' : editingPost ? 'UPDATE IDEA →' : 'PUBLISH IDEA →'}
              </button>
              <button type="button" onClick={closeCreateModal}
                className="px-5 py-3 text-[9px] font-bold border transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                CANCEL
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

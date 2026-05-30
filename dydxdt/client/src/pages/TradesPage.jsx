import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTrades, useDeleteTrade, useCreateTrade, useBulkImportTrades, useStrategies } from '../api/hooks';
import { PageHeader, Badge, Btn, Spinner, Empty, Card, Input, Select, DirectionToggle } from '../components/ui/index';

const FILTERS    = ['ALL', 'WIN', 'LOSS', 'BE'];
const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1'];
const SESSIONS   = ['Asian','London','New York','London/NY Overlap','Other'];
const MARKETS    = ['Forex','Futures','Commodities','Indices','Crypto','Stocks'];

// ── REQUIRED EXCEL COLUMNS (case-insensitive) ─────────────────────────────
// date | symbol | direction | entryPrice | exitPrice | quantity
// optional: stopLoss | takeProfit | timeframe | session | marketType | strategyUsed | notes | tags

const BLANK_FORM = {
  symbol: '', direction: 'LONG', date: new Date().toISOString().split('T')[0],
  entryPrice: '', exitPrice: '', stopLoss: '', takeProfit: '', quantity: '',
  timeframe: 'H1', session: 'London', marketType: 'Forex',
  strategyUsed: '', notes: '',
};

// ── Parse CSV/Excel-like text rows ────────────────────────────────────────
function parseExcelRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return reject(new Error('File must have a header row and at least one data row.'));

        // Detect delimiter: tab or comma
        const delim = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delim).map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));

        const required = ['date','symbol','direction','entryprice','exitprice','quantity'];
        const missing = required.filter(r => !headers.includes(r));
        if (missing.length) return reject(new Error(`Missing columns: ${missing.join(', ')}`));

        const col = (name) => headers.indexOf(name);

        const trades = [];
        const errors = [];

        lines.slice(1).forEach((line, i) => {
          if (!line.trim()) return;
          const cells = line.split(delim).map(c => c.trim().replace(/^"|"$/g, ''));

          const dir = (cells[col('direction')] || '').toUpperCase();
          if (!['LONG','SHORT'].includes(dir)) {
            errors.push(`Row ${i+2}: direction must be LONG or SHORT (got "${cells[col('direction')]}")`);
            return;
          }

          const entry = parseFloat(cells[col('entryprice')]);
          const exit  = parseFloat(cells[col('exitprice')]);
          const qty   = parseFloat(cells[col('quantity')]);
          if (isNaN(entry) || isNaN(exit) || isNaN(qty)) {
            errors.push(`Row ${i+2}: entryPrice, exitPrice, quantity must be numbers`);
            return;
          }

          const trade = {
            date:        cells[col('date')],
            symbol:      (cells[col('symbol')] || '').toUpperCase(),
            direction:   dir,
            entryPrice:  entry,
            exitPrice:   exit,
            quantity:    qty,
            stopLoss:    col('stoploss')   >= 0 ? parseFloat(cells[col('stoploss')])   || undefined : undefined,
            takeProfit:  col('takeprofit') >= 0 ? parseFloat(cells[col('takeprofit')]) || undefined : undefined,
            timeframe:   col('timeframe')  >= 0 ? cells[col('timeframe')]  || 'H1'     : 'H1',
            session:     col('session')    >= 0 ? cells[col('session')]    || 'London'  : 'London',
            marketType:  col('markettype') >= 0 ? cells[col('markettype')] || 'Forex'   : 'Forex',
            strategyUsed:col('strategyused')>=0 ? cells[col('strategyused')]|| ''       : '',
            notes:       col('notes')      >= 0 ? cells[col('notes')]      || ''        : '',
            tags:        col('tags')       >= 0 ? (cells[col('tags')]||'').split(';').map(t=>t.trim()).filter(Boolean) : [],
          };
          trades.push(trade);
        });

        if (errors.length && !trades.length) return reject(new Error(errors.join('\n')));
        resolve({ trades, errors });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ── Quick Manual Entry form ────────────────────────────────────────────────
function QuickAddForm({ strategies, onClose }) {
  const createTrade = useCreateTrade();
  const [form, setForm] = useState(BLANK_FORM);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  const handleSubmit = async () => {
    if (!form.symbol || !form.entryPrice || !form.exitPrice || !form.quantity) {
      setErr('Symbol, Entry, Exit, and Quantity are required.'); return;
    }
    setErr('');
    try {
      await createTrade.mutateAsync({
        ...form,
        symbol:      form.symbol.toUpperCase(),
        entryPrice:  parseFloat(form.entryPrice),
        exitPrice:   parseFloat(form.exitPrice),
        stopLoss:    form.stopLoss   ? parseFloat(form.stopLoss)   : undefined,
        takeProfit:  form.takeProfit ? parseFloat(form.takeProfit) : undefined,
        quantity:    parseFloat(form.quantity),
      });
      setForm(BLANK_FORM);
      onClose();
    } catch {}
  };

  return (
    <div style={{ background: 'rgba(20,20,20,0.98)', border: '1px solid rgba(232,255,0,0.15)', padding: '20px', marginBottom: '12px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.2em', color: '#e8ff00' }}>
          // QUICK MANUAL ENTRY
        </div>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'monospace' }}>✕ CLOSE</button>
      </div>

      {/* Row 1: Symbol + Date + Direction */}
      <div className="grid grid-cols-3 gap-3 mb-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div>
          <label style={{ fontFamily:'monospace',fontSize:'8px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.15em',display:'block',marginBottom:'4px' }}>SYMBOL *</label>
          <input value={form.symbol} onChange={e => setForm(p=>({...p,symbol:e.target.value.toUpperCase()}))}
            placeholder="XAUUSD" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontFamily:'monospace',fontSize:'8px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.15em',display:'block',marginBottom:'4px' }}>DATE *</label>
          <input type="date" value={form.date} onChange={set('date')} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontFamily:'monospace',fontSize:'8px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.15em',display:'block',marginBottom:'4px' }}>DIRECTION *</label>
          <div className="flex gap-1 mt-1">
            {['LONG','SHORT'].map(d => (
              <button key={d} onClick={() => setForm(p=>({...p,direction:d}))}
                style={{
                  flex:1, padding:'5px', fontSize:'8px', fontFamily:'monospace', fontWeight:'bold',
                  letterSpacing:'0.1em', border:'1px solid',
                  borderColor: form.direction===d ? (d==='LONG'?'#00ffb3':'#ff3366') : 'rgba(255,255,255,0.1)',
                  color: form.direction===d ? (d==='LONG'?'#00ffb3':'#ff3366') : 'rgba(255,255,255,0.3)',
                  background: form.direction===d ? `rgba(${d==='LONG'?'0,255,179':'255,51,102'},0.08)` : 'transparent',
                }}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Prices + Quantity */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
        {[
          ['ENTRY *','entryPrice','0.00000'],
          ['EXIT *','exitPrice','0.00000'],
          ['STOP LOSS','stopLoss','0.00000'],
          ['TAKE PROFIT','takeProfit','0.00000'],
          ['QTY/LOTS *','quantity','0.10'],
        ].map(([lbl,key,ph]) => (
          <div key={key}>
            <label style={{ fontFamily:'monospace',fontSize:'8px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.15em',display:'block',marginBottom:'4px' }}>{lbl}</label>
            <input type="number" step="any" placeholder={ph} value={form[key]} onChange={set(key)} style={inputStyle} />
          </div>
        ))}
      </div>

      {/* Row 3: Dropdowns */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div>
          <label style={labelStyle}>TIMEFRAME</label>
          <select value={form.timeframe} onChange={set('timeframe')} style={inputStyle}>
            {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>SESSION</label>
          <select value={form.session} onChange={set('session')} style={inputStyle}>
            {SESSIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>MARKET</label>
          <select value={form.marketType} onChange={set('marketType')} style={inputStyle}>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>STRATEGY</label>
          <select value={form.strategyUsed} onChange={set('strategyUsed')} style={inputStyle}>
            <option value="">— SELECT —</option>
            {(strategies || []).map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-3">
        <label style={labelStyle}>NOTES</label>
        <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Confluences, setup rationale..."
          style={{ ...inputStyle, resize:'vertical', width:'100%' }} />
      </div>

      {err && <div style={{ fontFamily:'monospace',fontSize:'9px',color:'#ff3366',marginBottom:'8px' }}>⚠ {err}</div>}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={createTrade.isPending}
          style={{ flex:1, padding:'8px', background:'#e8ff00', color:'#0a0a0a', fontFamily:'monospace',
            fontSize:'9px', fontWeight:'bold', letterSpacing:'0.15em', border:'none', cursor:'pointer' }}>
          {createTrade.isPending ? 'LOGGING...' : '+ RECORD TRADE →'}
        </button>
        <button onClick={() => setForm(BLANK_FORM)}
          style={{ padding:'8px 16px', background:'transparent', color:'rgba(255,255,255,0.3)',
            fontFamily:'monospace', fontSize:'9px', letterSpacing:'0.1em', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}>
          RESET
        </button>
      </div>
    </div>
  );
}

// ── Bulk Excel/CSV Import Panel ────────────────────────────────────────────
function BulkImportPanel({ onClose }) {
  const bulkImport = useBulkImportTrades();
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);  // { trades, errors }
  const [parseErr, setParseErr] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseErr(''); setPreview(null); setDone(null);
    try {
      const result = await parseExcelRows(file);
      setPreview(result);
    } catch (err) {
      setParseErr(err.message);
    }
  };

  const handleImport = async () => {
    if (!preview?.trades?.length) return;
    setImporting(true);
    try {
      const res = await bulkImport.mutateAsync(preview.trades);
      setDone({ imported: res.imported, failed: res.failed || 0 });
      setPreview(null);
    } catch (err) {
      setParseErr(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const header = 'date,symbol,direction,entryPrice,exitPrice,quantity,stopLoss,takeProfit,timeframe,session,marketType,strategyUsed,notes,tags';
    const sample = '2025-01-15,XAUUSD,LONG,2650.50,2680.00,0.5,2630.00,2700.00,H1,London,Forex,ICT,Good setup,ict;fvg';
    const blob = new Blob([header + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dydxdt-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background:'rgba(20,20,20,0.98)', border:'1px solid rgba(167,139,250,0.2)', padding:'20px', marginBottom:'12px' }}>
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontFamily:'monospace', fontSize:'9px', letterSpacing:'0.2em', color:'#a78bfa' }}>
          // BULK IMPORT — CSV / EXCEL (.csv, .tsv)
        </div>
        <button onClick={onClose} style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:'monospace' }}>✕ CLOSE</button>
      </div>

      {/* Info + Template download */}
      <div style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.1)', padding:'12px', marginBottom:'16px' }}>
        <div style={{ fontFamily:'monospace', fontSize:'8px', color:'rgba(255,255,255,0.4)', lineHeight:1.8 }}>
          <span style={{ color:'#a78bfa' }}>REQUIRED COLUMNS:</span> date · symbol · direction · entryPrice · exitPrice · quantity
          <br/>
          <span style={{ color:'rgba(255,255,255,0.25)' }}>OPTIONAL:</span> stopLoss · takeProfit · timeframe · session · marketType · strategyUsed · notes · tags (semicolon-separated)
          <br/>
          <span style={{ color:'rgba(255,255,255,0.25)' }}>FORMATS:</span> .csv (comma) or .tsv (tab) — up to 1000+ rows supported
        </div>
        <button onClick={downloadTemplate}
          style={{ marginTop:'8px', padding:'5px 12px', background:'transparent', border:'1px solid rgba(167,139,250,0.3)',
            color:'#a78bfa', fontFamily:'monospace', fontSize:'8px', letterSpacing:'0.12em', cursor:'pointer' }}>
          ↓ DOWNLOAD TEMPLATE
        </button>
      </div>

      {/* File picker */}
      {!done && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border:'2px dashed rgba(167,139,250,0.2)', padding:'32px', textAlign:'center',
            cursor:'pointer', marginBottom:'12px', transition:'border-color 0.2s',
          }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='rgba(167,139,250,0.5)'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor='rgba(167,139,250,0.2)'; }}
          onDrop={async e => {
            e.preventDefault(); e.currentTarget.style.borderColor='rgba(167,139,250,0.2)';
            const file = e.dataTransfer.files?.[0];
            if (file) { setParseErr(''); setPreview(null); setDone(null);
              try { setPreview(await parseExcelRows(file)); } catch(err) { setParseErr(err.message); } }
          }}
        >
          <div style={{ fontFamily:'monospace', fontSize:'9px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>
            DROP .CSV / .TSV HERE OR CLICK TO BROWSE
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{ display:'none' }} />
        </div>
      )}

      {/* Parse error */}
      {parseErr && (
        <div style={{ background:'rgba(255,51,102,0.08)', border:'1px solid rgba(255,51,102,0.2)', padding:'12px', marginBottom:'12px' }}>
          <div style={{ fontFamily:'monospace', fontSize:'8px', color:'#ff3366', whiteSpace:'pre-wrap' }}>⚠ {parseErr}</div>
        </div>
      )}

      {/* Preview */}
      {preview && !done && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div style={{ fontFamily:'monospace', fontSize:'8px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em' }}>
              PREVIEW — <span style={{ color:'#00ffb3' }}>{preview.trades.length} TRADES</span> READY TO IMPORT
              {preview.errors.length > 0 && <span style={{ color:'#ff3366', marginLeft:8 }}>({preview.errors.length} ROWS SKIPPED)</span>}
            </div>
            <button onClick={() => { setPreview(null); setParseErr(''); }}
              style={{ fontFamily:'monospace',fontSize:'8px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',cursor:'pointer' }}>
              CLEAR
            </button>
          </div>

          {/* Error rows */}
          {preview.errors.length > 0 && (
            <div style={{ background:'rgba(255,51,102,0.05)', padding:'8px', marginBottom:'8px', maxHeight:'80px', overflowY:'auto' }}>
              {preview.errors.map((e,i) => (
                <div key={i} style={{ fontFamily:'monospace', fontSize:'8px', color:'rgba(255,51,102,0.7)' }}>{e}</div>
              ))}
            </div>
          )}

          {/* Preview table */}
          <div style={{ maxHeight:'240px', overflowY:'auto', marginBottom:'12px' }}>
            <table style={{ width:'100%', fontFamily:'monospace', fontSize:'9px', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  {['#','DATE','SYMBOL','DIR','ENTRY','EXIT','QTY','SESSION','STRATEGY'].map(h => (
                    <th key={h} style={{ padding:'4px 8px', textAlign:'left', color:'rgba(255,255,255,0.2)', fontWeight:'bold', letterSpacing:'0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.trades.slice(0,50).map((t,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.2)' }}>{i+1}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.3)' }}>{t.date}</td>
                    <td style={{ padding:'3px 8px', color:'#e8ff00', fontWeight:'bold' }}>{t.symbol}</td>
                    <td style={{ padding:'3px 8px', color: t.direction==='LONG'?'#00ffb3':'#ff3366' }}>{t.direction}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.4)' }}>{t.entryPrice}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.4)' }}>{t.exitPrice}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.3)' }}>{t.quantity}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.3)' }}>{t.session}</td>
                    <td style={{ padding:'3px 8px', color:'rgba(255,255,255,0.3)' }}>{t.strategyUsed||'–'}</td>
                  </tr>
                ))}
                {preview.trades.length > 50 && (
                  <tr><td colSpan={9} style={{ padding:'6px 8px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontFamily:'monospace', fontSize:'8px' }}>
                    + {preview.trades.length - 50} more trades not shown
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <button onClick={handleImport} disabled={importing}
            style={{ width:'100%', padding:'10px', background:'#a78bfa', color:'#0a0a0a',
              fontFamily:'monospace', fontSize:'9px', fontWeight:'bold', letterSpacing:'0.15em',
              border:'none', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.7 : 1 }}>
            {importing ? `IMPORTING ${preview.trades.length} TRADES...` : `↑ IMPORT ${preview.trades.length} TRADES NOW`}
          </button>
        </div>
      )}

      {/* Done state */}
      {done && (
        <div style={{ textAlign:'center', padding:'24px' }}>
          <div style={{ fontFamily:'monospace', fontSize:'24px', color:'#00ffb3', marginBottom:'8px' }}>✓</div>
          <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#00ffb3', letterSpacing:'0.15em', marginBottom:'4px' }}>
            {done.imported} TRADES IMPORTED SUCCESSFULLY
          </div>
          {done.failed > 0 && (
            <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#ff3366' }}>{done.failed} TRADES FAILED</div>
          )}
          <button onClick={onClose}
            style={{ marginTop:'12px', padding:'6px 20px', background:'transparent', border:'1px solid rgba(0,255,179,0.3)',
              color:'#00ffb3', fontFamily:'monospace', fontSize:'8px', letterSpacing:'0.12em', cursor:'pointer' }}>
            DONE
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
  fontFamily: 'monospace', fontSize: '10px', padding: '5px 8px', outline: 'none',
};
const labelStyle = {
  fontFamily:'monospace', fontSize:'8px', color:'rgba(255,255,255,0.3)',
  letterSpacing:'0.15em', display:'block', marginBottom:'4px',
};

// ── Main TradesPage ────────────────────────────────────────────────────────
export default function TradesPage() {
  const [result,    setResult]    = useState('');
  const [market,    setMarket]    = useState('');
  const [direction, setDir]       = useState('');
  const [symbol,    setSymbol]    = useState('');
  const [page,      setPage]      = useState(1);
  const [panel,     setPanel]     = useState(null); // null | 'manual' | 'import'

  const { data: strategies } = useStrategies();

  const params = {
    ...(result    && result !== 'ALL'    ? { result }            : {}),
    ...(market    && market !== 'ALL'    ? { marketType: market } : {}),
    ...(direction && direction !== 'ALL' ? { direction }         : {}),
    ...(symbol    ? { symbol }           : {}),
    page, limit: 30,
  };

  const { data, isLoading } = useTrades(params);
  const deleteTrade = useDeleteTrade();
  const trades = data?.data || [];

  const fmt$ = v => {
    const n = Number(v);
    return `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="// TRADE RECORD SYSTEM"
        title="TRADE JOURNAL"
        color="#e8ff00"
        action={
          <div className="flex gap-2">
            {/* Manual quick-add */}
            <button
              onClick={() => setPanel(p => p === 'manual' ? null : 'manual')}
              style={{
                padding: '7px 14px', fontFamily:'monospace', fontSize:'9px', fontWeight:'bold',
                letterSpacing:'0.12em', border:'1px solid',
                borderColor: panel==='manual' ? '#e8ff00' : 'rgba(232,255,0,0.3)',
                color: panel==='manual' ? '#0a0a0a' : '#e8ff00',
                background: panel==='manual' ? '#e8ff00' : 'rgba(232,255,0,0.06)',
                cursor: 'pointer',
              }}>
              + MANUAL
            </button>

            {/* Bulk import */}
            <button
              onClick={() => setPanel(p => p === 'import' ? null : 'import')}
              style={{
                padding: '7px 14px', fontFamily:'monospace', fontSize:'9px', fontWeight:'bold',
                letterSpacing:'0.12em', border:'1px solid',
                borderColor: panel==='import' ? '#a78bfa' : 'rgba(167,139,250,0.3)',
                color: panel==='import' ? '#0a0a0a' : '#a78bfa',
                background: panel==='import' ? '#a78bfa' : 'rgba(167,139,250,0.06)',
                cursor: 'pointer',
              }}>
              ↑ IMPORT CSV
            </button>

            <Link to="/trades/add">
              <button style={{
                padding: '7px 14px', fontFamily:'monospace', fontSize:'9px', fontWeight:'bold',
                letterSpacing:'0.12em', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.4)', background:'transparent', cursor:'pointer',
              }}>+ FULL FORM</button>
            </Link>
          </div>
        }
      />

      {/* Inline panels */}
      {panel === 'manual' && (
        <QuickAddForm strategies={strategies} onClose={() => setPanel(null)} />
      )}
      {panel === 'import' && (
        <BulkImportPanel onClose={() => setPanel(null)} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setResult(f === 'ALL' ? '' : f); setPage(1); }}
              className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.08)',
                color: (result === f || (f === 'ALL' && !result)) ? '#e8ff00' : 'rgba(255,255,255,0.3)',
                background: (result === f || (f === 'ALL' && !result)) ? 'rgba(232,255,0,0.05)' : 'transparent',
              }}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {['ALL','LONG','SHORT'].map(d => (
            <button key={d} onClick={() => { setDir(d === 'ALL' ? '' : d); setPage(1); }}
              className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase border transition-all"
              style={{
                fontFamily: 'monospace',
                borderColor: (direction === d || (d === 'ALL' && !direction)) ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                color: (direction === d || (d === 'ALL' && !direction)) ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: 'transparent',
              }}>{d}</button>
          ))}
        </div>
        <input className="input-dark" style={{ width:120, padding:'4px 10px', fontSize:'0.7rem' }}
          placeholder="SYMBOL..." value={symbol}
          onChange={e => { setSymbol(e.target.value.toUpperCase()); setPage(1); }} />
      </div>

      {/* Table */}
      <Card>
        {isLoading ? <Spinner /> : trades.length === 0 ? <Empty message="No trades match filters" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" style={{ fontFamily:'monospace' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  {['DATE','SYMBOL','DIR','ENTRY','EXIT','SL','R:R','P&L','STRATEGY','SESSION','RESULT',''].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold tracking-[0.12em]"
                      style={{ color:'rgba(255,255,255,0.2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t._id} className="border-b transition-colors hover:bg-white/[0.015] cursor-pointer"
                    style={{ borderColor:'rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.3)' }}>
                      {format(new Date(t.date), 'MMM d, yy')}
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color:'#e8ff00' }}>{t.symbol}</td>
                    <td className="px-3 py-2.5"><Badge>{t.direction}</Badge></td>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.5)' }}>{t.entryPrice}</td>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.5)' }}>{t.exitPrice}</td>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.3)' }}>{t.stopLoss||'–'}</td>
                    <td className="px-3 py-2.5" style={{ color:'#a78bfa' }}>
                      {t.riskRewardRatio > 0 ? `${t.riskRewardRatio.toFixed(2)}R` : '–'}
                    </td>
                    <td className="px-3 py-2.5 font-bold" style={{ color:t.profitLoss>=0?'#00ffb3':'#ff3366' }}>
                      {fmt$(t.profitLoss)}
                    </td>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.35)' }}>{t.strategyUsed||'–'}</td>
                    <td className="px-3 py-2.5" style={{ color:'rgba(255,255,255,0.3)' }}>{t.session||'–'}</td>
                    <td className="px-3 py-2.5"><Badge>{t.result}</Badge></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <Link to={`/trades/${t._id}/edit`}
                          className="text-[9px] transition-colors hover:text-acid" style={{ color:'rgba(255,255,255,0.2)' }}>EDIT</Link>
                        <button onClick={() => { if (confirm('Delete this trade?')) deleteTrade.mutate(t._id); }}
                          className="text-[9px] transition-colors hover:text-danger" style={{ color:'rgba(255,255,255,0.2)' }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
            <div className="text-[9px]" style={{ color:'rgba(255,255,255,0.25)',fontFamily:'monospace' }}>
              {data.total} total trades
            </div>
            <div className="flex gap-1">
              <Btn variant="ghost" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>←</Btn>
              <span className="px-3 py-1 text-[9px]" style={{ color:'rgba(255,255,255,0.4)',fontFamily:'monospace' }}>{page}/{data.pages}</span>
              <Btn variant="ghost" onClick={() => setPage(p => Math.min(data.pages,p+1))} disabled={page===data.pages}>→</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

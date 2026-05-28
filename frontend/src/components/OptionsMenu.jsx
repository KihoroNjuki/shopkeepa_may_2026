import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function OptionsMenu({ options }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        className="btn btn-ghost"
        style={{ padding: '0.4rem 0.6rem' }}
        onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 160, zIndex: 300, overflow: 'hidden',
        }}>
          {options.map((opt, i) => (
            opt === 'divider' ? (
              <div key={i} style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
            ) : (
              <button key={i} onClick={() => { opt.onClick(); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  width: '100%', padding: '0.65rem 1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', color: opt.danger ? 'var(--danger)' : 'var(--text)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = opt.danger ? '#fef2f2' : 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {opt.icon && <span style={{ opacity: 0.7 }}>{opt.icon}</span>}
                {opt.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { authAPI } from '../api';

export default function DeleteAuthModal({ title, description, onConfirm, onClose, email  }) {
  const [password, setPassword]   = useState('');
  const [typed, setTyped]         = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const isValid = typed === 'DELETE' && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);
    try {
      await authAPI.login({ email, password });
      onConfirm();
    } catch {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--danger)' }}>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {description}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type DELETE to confirm</label>
            <input className="form-input"
              placeholder="DELETE"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              style={{ borderColor: typed && typed !== 'DELETE' ? 'var(--danger)' : undefined }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enter your password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={!isValid || loading}>
              <Trash2 size={14} /> {loading ? 'Verifying...' : 'Confirm Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
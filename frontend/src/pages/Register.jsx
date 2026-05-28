import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const passwordRules = [
    { label: 'At least 8 characters',        test: (p) => p.length >= 8 },
    { label: 'Not entirely numeric',          test: (p) => !/^\d+$/.test(p) },
    { label: 'Not too similar to your email', test: (p) => !p.toLowerCase().includes(form.email.split('@')[0].toLowerCase()) || p.length === 0 },
    { label: 'Not a commonly used password',  test: (p) => !['password', '12345678', 'qwerty123'].includes(p.toLowerCase()) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      const first = Object.values(data || {})[0];
      setError(Array.isArray(first) ? first[0] : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="subtitle">Get started, it only takes a minute</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input name="first_name" type="text" placeholder="John"
                value={form.first_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input name="last_name" type="text" placeholder="Doe"
                value={form.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="divider" />

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input name="password2" type="password" placeholder="••••••••"
              value={form.password2} onChange={handleChange} required />
          </div>
        {form.password && (
  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {passwordRules.map((rule, i) => {
      const passed = rule.test(form.password);
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: passed ? 'var(--success)' : 'var(--muted)' }}>
            {passed ? '✓' : '○'}
          </span>
          <span style={{ color: passed ? 'var(--success)' : 'var(--muted)' }}>
            {rule.label}
          </span>
        </div>
      );
    })}
  </div>
)}

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
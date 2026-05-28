import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
  const data = err.response?.data;
  if (data?.[0]?.code === 'email_not_verified') {
    navigate('/check-email', { state: { email: form.email } });
  } else {
    setError('Invalid email or password.');
  }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome back To ShopKeepa.</h2>
        <p className="subtitle">Sign in to your account to continue</p>

        {location.state?.message && (
        <div style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {location.state.message}
        </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>

          {error && <div className="auth-error">{error}</div>}

        <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
                Forgot password?
            </Link>
        </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
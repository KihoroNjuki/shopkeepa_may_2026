import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ new_password: '', confirm_password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    console.log('token:', searchParams.get('token'));
    console.log('password:', form.new_password);
    try {
      await api.post('/auth/reset-password/', {
        token:        searchParams.get('token'),
        new_password: form.new_password,
      });
      navigate('/login', { state: { message: 'Password reset successfully. You can now sign in.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Set new password</h2>
        <p className="subtitle">Choose a strong password for your account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New password</label>
            <input
              name="new_password"
              type="password"
              placeholder="••••••••"
              value={form.new_password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
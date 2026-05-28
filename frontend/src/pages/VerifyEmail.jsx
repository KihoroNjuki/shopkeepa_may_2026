import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';

export default function VerifyEmail() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    api.get(`/auth/verify-email/?token=${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.detail);
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Email Verification</h2>
        <p className="subtitle">
          {status === 'verifying' && 'Verifying your email address...'}
          {status === 'success'   && 'Your email has been verified!'}
          {status === 'error'     && 'Verification failed'}
        </p>

        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          {status === 'verifying' && (
            <p style={{ color: 'var(--muted)' }}>Please wait...</p>
          )}
          {status === 'success' && (
            <>
              <p style={{ color: '#16a34a', marginBottom: '1rem' }}>{message}</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Redirecting to login in 3 seconds...
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="auth-error" style={{ marginBottom: '1rem' }}>
                {message}
              </div>
              <Link to="/register" className="btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none', padding: '0.85rem 2rem' }}>
                Register again
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import { useLocation, Link } from 'react-router-dom';
import '../styles/auth.css';

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email address';

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
        <h2>Check your inbox</h2>
        <p className="subtitle">We sent a verification link to</p>
        <p style={{
          fontWeight: '600',
          color: 'var(--text)',
          margin: '0.5rem 0 1.5rem',
          fontSize: '0.95rem'
        }}>
          {email}
        </p>

        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
          Click the link in the email to activate your account.
          The link expires in <strong>24 hours</strong>.
        </p>

        <div className="divider" />

        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          Wrong email? <Link to="/register">Register again</Link>
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Already verified? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
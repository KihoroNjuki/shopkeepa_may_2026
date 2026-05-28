// src/pages/Profile.jsx
import api from '../api';
import { useNavigate } from 'react-router-dom';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { User, Lock, Save,Trash2 } from 'lucide-react';
import DeleteAuthModal from '../components/DeleteAuthModal';


export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();


  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm:      '',
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null);
  const [passwordMsg, setPasswordMsg]     = useState(null);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const { data } = await authAPI.updateMe({
        first_name: profileForm.first_name,
        last_name:  profileForm.last_name,
      });
      login(data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/me/');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      navigate('/login');
    } catch {
      // handle error
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ old_password: '', new_password: '', confirm: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      const d = err.response?.data;
      const first = Object.values(d || {})[0];
      setPasswordMsg({ type: 'error', text: Array.isArray(first) ? first[0] : 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Settings</h1>
          <p className="page-sub">Manage your account details</p>
        </div>
      </div>
      
      {/* Avatar */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700, color: 'white',
          flexShrink: 0,
        }}>
          {(user?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.email}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Personal Info
          </h2>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" placeholder="First name"
                value={profileForm.first_name}
                onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" placeholder="Last name"
                value={profileForm.last_name}
                onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={profileForm.email} disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.775rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Email cannot be changed.
            </p>
          </div>

          {profileMsg && (
            <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              <Save size={14} /> {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} /> Change Password
          </h2>
        </div>
        <form onSubmit={handlePasswordSave}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={passwordForm.old_password}
              onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              required />
          </div>

          {passwordMsg && (
            <div className={`alert alert-${passwordMsg.type}`}>{passwordMsg.text}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
              <Lock size={14} /> {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
      {/* Danger zone */}
<div className="card" style={{ marginTop: '1rem', borderColor: 'var(--danger)', border: '1px solid #fecaca' }}>
  <div className="card-header">
    <h2 className="card-title" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
  </div>
  <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
    Permanently delete your account and all associated data. This cannot be undone.
  </p>
  <button className="btn btn-danger" onClick={() => setDeleteAccountModal(true)}>
    <Trash2 size={16} /> Delete Account
  </button>
</div>

{deleteAccountModal && (
  <DeleteAuthModal
    email={user?.email}
    title="Delete Account"
    description="This will permanently delete your account, all your businesses, branches, products and sales data. This cannot be undone."
    onConfirm={handleDeleteAccount}
    onClose={() => setDeleteAccountModal(false)}
  />
)}
    </div>
  );
}
// src/pages/RolePrivileges.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Save } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

const PRIVILEGES = [
  { key: 'record_sales',    label: 'Record Sales',     description: 'Can create new sale transactions' },
  { key: 'view_sales',      label: 'View Sales',       description: 'Can view sales history' },
  { key: 'void_sale',       label: 'Void a Sale',      description: 'Can void/cancel a sale' },
  { key: 'add_products',    label: 'Add Products',     description: 'Can add new products to catalogue' },
  { key: 'edit_products',   label: 'Edit Products',    description: 'Can edit existing products' },
  { key: 'delete_products', label: 'Delete Products',  description: 'Can delete products' },
  { key: 'record_restock',  label: 'Record Restock',   description: 'Can record incoming stock' },
  { key: 'view_analytics',  label: 'View Analytics',   description: 'Can view charts and reports' },
  { key: 'invite_members',  label: 'Invite Members',   description: 'Can invite staff to branches' },
  { key: 'manage_branches', label: 'Manage Branches',  description: 'Can create and edit branches' },
];

export default function RolePrivileges() {
  const { businessId }      = useParams();
  const [privileges, setPrivileges] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState(null);

  useEffect(() => { fetchPrivileges(); }, [businessId]);

  const fetchPrivileges = async () => {
    try {
      const { data } = await api.get(`/business/${businessId}/privileges/`);
      setPrivileges(data);
    } catch {
      setMsg({ type: 'error', text: 'Failed to load privileges.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role, key) => {
    setPrivileges({ ...privileges, [`${role}_${key}`]: !privileges[`${role}_${key}`] });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/business/${businessId}/privileges/`, privileges);
      setMsg({ type: 'success', text: 'Privileges saved successfully.' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to save privileges.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading privileges...</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}`} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Role Privileges</h1>
          <p className="page-sub">Define what managers and cashiers can do in this business</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {['manager', 'cashier'].map(role => (
          <div key={role} className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="var(--accent)" />
                {role.charAt(0).toUpperCase() + role.slice(1)} Privileges
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {PRIVILEGES.map(p => (
                <div key={p.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', borderRadius: 8,
                  background: privileges[`${role}_${p.key}`] ? 'var(--accent-light)' : 'var(--bg)',
                  transition: 'background 0.15s',
                }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.label}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.775rem' }}>{p.description}</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
                    <input type="checkbox"
                      checked={privileges[`${role}_${p.key}`] || false}
                      onChange={() => handleToggle(role, p.key)}
                      style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', inset: 0,
                      background: privileges[`${role}_${p.key}`] ? 'var(--accent)' : '#d1d5db',
                      borderRadius: 24, transition: '0.2s',
                    }}>
                      <span style={{
                        position: 'absolute', height: 18, width: 18,
                        left: privileges[`${role}_${p.key}`] ? 23 : 3,
                        bottom: 3, background: 'white', borderRadius: '50%',
                        transition: '0.2s',
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
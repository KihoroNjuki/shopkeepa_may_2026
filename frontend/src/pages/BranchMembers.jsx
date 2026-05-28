// src/pages/BranchMembers.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Plus, Trash2, X, Shield, Save } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';
import OptionsMenu from '../components/OptionsMenu';


export default function BranchMembers() {
  const { businessId, branchId } = useParams();
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ email: '', role: 'cashier' });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [removing, setRemoving]   = useState(null);
  const [privilegeModal, setPrivilegeModal] = useState(null);
  const [memberPrivs, setMemberPrivs]       = useState(null);
  const [savingPrivs, setSavingPrivs]       = useState(false);

  useEffect(() => { fetchMembers(); }, [branchId]);

  const PRIVILEGES = [
  { key: 'record_sales',    label: 'Record Sales'    },
  { key: 'view_sales',      label: 'View Sales'      },
  { key: 'void_sale',       label: 'Void a Sale'     },
  { key: 'add_products',    label: 'Add Products'    },
  { key: 'edit_products',   label: 'Edit Products'   },
  { key: 'delete_products', label: 'Delete Products' },
  { key: 'record_restock',  label: 'Record Restock'  },
  { key: 'view_analytics',  label: 'View Analytics'  },
  { key: 'invite_members',  label: 'Invite Members'  },
  { key: 'manage_branches', label: 'Manage Branches' },
];

const handleOpenPrivileges = async (member) => {
  setPrivilegeModal(member);
  try {
    const { data } = await api.get(
      `/business/${businessId}/branches/${branchId}/members/${member.id}/privileges/`
    );
    setMemberPrivs(data);
  } catch {
    setMemberPrivs({});
  }
};

const handleSavePrivileges = async () => {
  setSavingPrivs(true);
  try {
    await api.patch(
      `/business/${businessId}/branches/${branchId}/members/${privilegeModal.id}/privileges/`,
      memberPrivs
    );
    setPrivilegeModal(null);
  } catch {
    setError('Failed to save privileges.');
  } finally {
    setSavingPrivs(false);
  }
};
  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/business/${businessId}/`);
      const branch = data.branches?.find(b => b.id === branchId);
      setMembers(branch?.members || []);
    } catch {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { data } = await api.post(
        `/business/${businessId}/branches/${branchId}/invite/`,
        form
      );
      setMembers([...members, data]);
      setShowModal(false);
      setForm({ email: '', role: 'cashier' });
    } catch (err) {
      const d = err.response?.data;
      const first = Object.values(d || {})[0];
      setFormError(Array.isArray(first) ? first[0] : 'Failed to invite member.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this member from the branch?')) return;
    setRemoving(memberId);
    try {
      await api.delete(
        `/business/${businessId}/branches/${branchId}/members/${memberId}/`
      );
      setMembers(members.filter(m => m.id !== memberId));
    } catch {
      setError('Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  if (loading) return <div className="loading">Loading members...</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}`} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Branch Members</h1>
          <p className="page-sub">{members.length} member{members.length !== 1 ? 's' : ''} in this branch</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Invite Member
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {members.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={48} />
            <h3>No members yet</h3>
            <p>Invite managers and cashiers to this branch</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}
              onClick={() => setShowModal(true)}>
              <Plus size={16} /> Invite Member
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Invited By</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <p style={{ fontWeight: 500 }}>{m.user_name || m.user_email}</p>
                      <p style={{ fontSize: '0.775rem', color: 'var(--muted)' }}>{m.user_email}</p>
                    </td>
                    <td>
                      <span className={`badge ${m.role === 'manager' ? 'badge-info' : 'badge-success'}`}
                        style={{ textTransform: 'capitalize' }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {m.invited_by_email || '—'}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {fmtDate(m.joined_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <td>
  <OptionsMenu options={[
    { label: 'Edit Privileges', icon: <Shield size={14} />, onClick: () => handleOpenPrivileges(m) },
    'divider',
    { label: 'Remove Member',     icon: <Trash2 size={14} />, onClick: () => handleRemove(m.id), danger: true },
  ]} />
</td>
                      </div>
                    </td>
                    {/* <td>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem' }}
                        disabled={removing === m.id}
                        onClick={() => handleRemove(m.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Privilege Modal */}
          {privilegeModal && memberPrivs && (
  <div className="modal-overlay" onClick={() => setPrivilegeModal(null)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">
          Custom Privileges — {privilegeModal.user_name || privilegeModal.user_email}
        </h2>
        <button className="btn btn-ghost" onClick={() => setPrivilegeModal(null)}>
          <X size={18} />
        </button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Set to <strong>Custom</strong> to override the role default, or <strong>Role Default</strong> to inherit from the role settings.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {PRIVILEGES.map(p => (
          <div key={p.key} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0.6rem 0.75rem',
            borderRadius: 8, background: 'var(--bg)'
          }}>
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.label}</span>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.825rem', padding: '0.3rem 0.6rem' }}
              value={memberPrivs[p.key] === null || memberPrivs[p.key] === undefined ? 'default' : memberPrivs[p.key] ? 'true' : 'false'}
              onChange={e => setMemberPrivs({
                ...memberPrivs,
                [p.key]: e.target.value === 'default' ? null : e.target.value === 'true'
              })}>
              <option value="default">Role Default</option>
              <option value="true">✓ Allow</option>
              <option value="false">✗ Deny</option>
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={() => setPrivilegeModal(null)}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSavePrivileges} disabled={savingPrivs}>
          <Save size={14} /> {savingPrivs ? 'Saving...' : 'Save Privileges'}
        </button>
      </div>
    </div>
  </div>
)}


      {/* Invite Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invite Member</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              The person must already have a Shopkeepa account.
            </p>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="member@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="cashier">Cashier — can record sales</option>
                  <option value="manager">Manager — can manage products & restock</option>
                </select>
              </div>

              {formError && <div className="alert alert-error">{formError}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
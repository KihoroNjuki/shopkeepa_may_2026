import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Plus, ChevronRight, X, Users, Package, Power, Pencil, Trash2, BarChart2, Shield } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';
import OptionsMenu from '../components/OptionsMenu';
import DeleteAuthModal from '../components/DeleteAuthModal';
import { CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export default function BusinessDetail() {
  const { businessId } = useParams();
  const navigate       = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: '', location: '' });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [editBranch, setEditBranch]     = useState(null);
  const [deleteBranch, setDeleteBranch] = useState(null);
  const [branchForm, setBranchForm]     = useState({ name: '', location: '' });
  const [updating, setUpdating]         = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const { user } = useAuth();


  useEffect(() => { fetchBusiness(); }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const { data } = await api.get(`/business/${businessId}/`);
      setBusiness(data);
    } catch {
      navigate('/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBranchOpen = (e, branch) => {
  e.stopPropagation();
  setEditBranch(branch);
  setBranchForm({ name: branch.name, location: branch.location || '' });
};

const handleUpdateBranch = async (e) => {
  e.preventDefault();
  setUpdating(true);
  try {
    const { data } = await api.patch(
      `/business/${businessId}/branches/${editBranch.id}/`, branchForm
    );
    setBusiness({
      ...business,
      branches: business.branches.map(b => b.id === editBranch.id ? { ...b, ...data } : b)
    });
    setEditBranch(null);
  } catch {
    setFormError('Failed to update branch.');
  } finally {
    setUpdating(false);
  }
};

const handleToggleActive = async (e, branch) => {
  e.stopPropagation();
  try {
    const { data } = await api.patch(
      `/business/${businessId}/branches/${branch.id}/`,
      { is_active: !branch.is_active }
    );
    setBusiness({
      ...business,
      branches: business.branches.map(b => b.id === branch.id ? { ...b, ...data } : b)
    });
  } catch {}
};

const handleDeleteBranch = async () => {
  setDeleting(true);
  try {
    await api.delete(`/business/${businessId}/branches/${deleteBranch.id}/`);
    setBusiness({
      ...business,
      branches: business.branches.filter(b => b.id !== deleteBranch.id)
    });
    setDeleteBranch(null);
  } catch {
    setFormError('Failed to delete branch.');
  } finally {
    setDeleting(false);
  }
};

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/business/${businessId}/branches/`, form);
      setBusiness({ ...business, branches: [...business.branches, data] });
      setShowModal(false);
      setForm({ name: '', location: '' });
    } catch (err) {
      setFormError('Failed to create branch.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!business) return null;

  return (
    <div>
    <BackButton to="/businesses" />

      <div className="page-header">
        <div>
          <h1 className="page-title">{business.name}</h1>
          <p className="page-sub">{business.industry} · {business.branches?.length || 0} branches</p>
        </div>
        <button className="btn btn-secondary"
          onClick={() => navigate(`/businesses/${businessId}/privileges`)}>
          <Shield size={16} /> Privileges
        </button>
        
        <button className="btn btn-secondary"
          onClick={() => navigate(`/businesses/${businessId}/analytics`)}>
          <BarChart2 size={16} /> Analytics
        </button>
        <button className="btn btn-secondary"
          onClick={() => navigate(`/businesses/${businessId}/credit`)}>
          <CreditCard size={16} /> Manage Credit
        </button>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Branch
        </button>
      </div>

      {business.branches?.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <MapPin size={48} />
            <h3>No branches yet</h3>
            <p>Add your first branch to start recording sales</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}
              onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Branch
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {business.branches.map(branch => (
  <div key={branch.id} className="card" style={{ cursor: 'pointer' }}
    onClick={() => navigate(`/businesses/${businessId}/branches/${branch.id}`)}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--accent-light)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <MapPin size={22} color="var(--accent)" />
        </div>
        <div>
          <p style={{ fontWeight: 600 }}>{branch.name}</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
            {branch.location || 'No location set'} · {branch.member_count} {branch.member_count === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={`badge ${branch.is_active ? 'badge-success' : 'badge-danger'}`}>
          {branch.is_active ? 'Active' : 'Inactive'}
        </span>
        <OptionsMenu options={[
  { label: 'Edit',       icon: <Pencil size={14} />, onClick: () => handleEditBranchOpen(branch) },
  { label: 'Members',    icon: <Users size={14} />,  onClick: () => navigate(`/businesses/${businessId}/branches/${branch.id}/members`) },
  { label: branch.is_active ? 'Deactivate' : 'Activate', icon: <Power size={14} />, onClick: () => handleToggleActive(branch) },
  'divider',
  { label: 'Delete',     icon: <Trash2 size={14} />, onClick: () => setDeleteBranch(branch), danger: true },
]} />
        <ChevronRight size={18} color="var(--muted)" />
      </div>
    </div>
  </div>
))}
        </div>
      )}

      {/* Create Branch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Branch</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch}>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input className="form-input" placeholder="e.g. Westlands Branch"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. Westlands, Nairobi"
                  value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>

              {formError && <div className="alert alert-error">{formError}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* {Edit Branch Modal} */}
      {editBranch && (
  <div className="modal-overlay" onClick={() => setEditBranch(null)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Edit Branch</h2>
        <button className="btn btn-ghost" onClick={() => setEditBranch(null)}><X size={18} /></button>
      </div>
      <form onSubmit={handleUpdateBranch}>
        <div className="form-group">
          <label className="form-label">Branch Name</label>
          <input className="form-input" value={branchForm.name}
            onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" value={branchForm.location}
            onChange={e => setBranchForm({ ...branchForm, location: e.target.value })} />
        </div>
        {formError && <div className="alert alert-error">{formError}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setEditBranch(null)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{/* Delete Branch Modal */}
  {deleteBranch && (
  <DeleteAuthModal
    email={user?.email}
    title={`Delete ${deleteBranch.name}`}
    description={`All sales, stock and restock records for ${deleteBranch.name} will be permanently deleted.`}
    onConfirm={handleDeleteBranch}
    onClose={() => setDeleteBranch(null)}
  />
)}
    </div>
  );
}
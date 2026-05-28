import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ChevronRight, X, Pencil, Trash2 } from 'lucide-react';
import api from '../api';
import OptionsMenu from '../components/OptionsMenu';
import DeleteAuthModal from '../components/DeleteAuthModal';
import { useAuth } from '../context/AuthContext';


export default function Businesses() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ name: '', industry: '' });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [editModal, setEditModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [editForm, setEditForm]     = useState({ name: '', industry: '' });
  const [deleting, setDeleting]     = useState(false);
  const [updating, setUpdating]     = useState(false);
  const {user} = useAuth();
  const industries = [
    'Retail', 'Pharmacy', 'Hardware', 'Grocery',
    'Electronics', 'Clothing', 'Food & Beverage', 'Other'
  ];

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get('/business/');
      setBusinesses(data);
      console.log('businesses:', data);
    } catch {
      setError('Failed to load businesses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { data } = await api.post('/business/', form);
      setBusinesses([...businesses, data]);
      setShowModal(false);
      setForm({ name: '', industry: '' });
    } catch (err) {
      setFormError(err.response?.data?.name?.[0] || 'Failed to create business.');
    } finally {
      setSaving(false);
    }
  };
  const handleEditOpen = (e, b) => {
    e.stopPropagation();
    setSelected(b);
    setEditForm({ name: b.name, industry: b.industry || '' });
    setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data } = await api.patch(`/business/${selected.id}/`, editForm);
      setBusinesses(businesses.map(b => b.id === selected.id ? { ...b, ...data } : b));
      setEditModal(false);
    } catch {
      setFormError('Failed to update business.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOpen = (e, b) => {
    e.stopPropagation();
    setSelected(b);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
  try {
    await api.delete(`/business/${selected.id}/`);
    setBusinesses(businesses.filter(b => b.id !== selected.id));
    setDeleteModal(false);
  } catch {
    // error handled in modal
  }
};
  if (loading) return <div className="loading">Loading businesses...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Businesses</h1>
          <p className="page-sub">Manage your businesses and branches</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Business
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {businesses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 size={48} />
            <h3>No businesses yet</h3>
            <p>Create your first business to get started</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}
              onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Business
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {businesses.map(b => (
  <div key={b.id} className="card" style={{ cursor: 'pointer' }}
    onClick={() => navigate(`/businesses/${b.id}`)}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'var(--accent-light)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Building2 size={22} color="var(--accent)" />
        </div>
        <div>
          <p style={{ fontWeight: 600 }}>{b.name}</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>
            {b.industry || 'No industry set'} · {b.branch_count} {b.branch_count === 1 ? 'branch' : 'branches'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <OptionsMenu options={[
  { label: 'Edit',   icon: <Pencil size={14} />,  onClick: () => handleEditOpen(b) },
  'divider',
  { label: 'Delete', icon: <Trash2 size={14} />,  onClick: () => handleDeleteOpen(b), danger: true },
]} />
        <ChevronRight size={18} color="var(--muted)" />
      </div>
    </div>
  </div>
))}
        </div>
      )}

      {/* Create Business Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Business</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" placeholder="e.g. Kamau Hardware"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-select"
                  value={industries.includes(form.industry) ? form.industry : form.industry ? 'Other' : ''}
                  onChange={e => setForm({ ...form, industry: e.target.value === 'Other' ? '' : e.target.value })}>
                  <option value="">Select industry</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Show text box when Other is selected */}
              {!industries.includes(form.industry) && (
                <div className="form-group">
                  <label className="form-label">Specify Industry</label>
                  <input className="form-input" placeholder="e.g. Butchery, Salon, Bookshop..."
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    autoFocus />
                </div>
              )}

              {formError && <div className="alert alert-error">{formError}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editModal && selected && (
  <div className="modal-overlay" onClick={() => setEditModal(false)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Edit Business</h2>
        <button className="btn btn-ghost" onClick={() => setEditModal(false)}><X size={18} /></button>
      </div>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input className="form-input" value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Industry</label>
          <select className="form-select"
            value={industries.includes(editForm.industry) ? editForm.industry : editForm.industry ? 'Other' : ''}
            onChange={e => setEditForm({ ...editForm, industry: e.target.value === 'Other' ? '' : e.target.value })}>
            <option value="">Select industry</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="Other">Other</option>
          </select>
        </div>
        {!industries.includes(editForm.industry) && (
          <div className="form-group">
            <label className="form-label">Specify Industry</label>
            <input className="form-input" placeholder="e.g. Butchery, Salon..."
              value={editForm.industry}
              onChange={e => setEditForm({ ...editForm, industry: e.target.value })} />
          </div>
        )}
        {formError && <div className="alert alert-error">{formError}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
  {deleteModal && selected && (
  <DeleteAuthModal
    email={user?.email}
    title={`Delete ${selected.name}`}
    description={`This will permanently delete ${selected.name} and all its branches, products, sales and restock records. This cannot be undone.`}
    onConfirm={handleDelete}
    onClose={() => setDeleteModal(false)}
  />
)}
    </div>
  );
}
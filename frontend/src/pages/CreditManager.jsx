import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, X, CreditCard, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

export default function CreditManager() {
  const { businessId }  = useParams();
  const [tab, setTab]   = useState('debtors');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal]   = useState(null);
  const [form, setForm]           = useState({ name: '', phone: '', notes: '' });
  const [payForm, setPayForm]     = useState({ amount: '', payment_method: 'cash', note: '' });
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [contactDetails, setContactDetails] = useState({});
  const [loadingDetail, setLoadingDetail]   = useState(null);
  useEffect(() => { fetchContacts(); }, [tab, businessId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const type = tab === 'debtors' ? 'debtor' : 'creditor';
      const { data } = await api.get(`/credit/${businessId}/contacts/?type=${type}`);
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post(`/credit/${businessId}/contacts/`, {
        ...form,
        contact_type: tab === 'debtors' ? 'debtor' : 'creditor'
      });
      setContacts([...contacts, data]);
      setShowModal(false);
      setForm({ name: '', phone: '', notes: '' });
    } finally {
      setSaving(false);
    }
  };

 const handlePayment = async (e) => {
  e.preventDefault();
  setSaving(true);
  try {
    const isDebt   = tab === 'debtors';
    const endpoint = isDebt
      ? `/credit/${businessId}/sales/${payModal.credit_id}/pay/`
      : `/credit/${businessId}/restocks/${payModal.credit_id}/pay/`;

    await api.post(endpoint, payForm);

    // refresh contact detail and summary
    const contactId = Object.keys(contactDetails).find(id =>
      contactDetails[id]?.credit_sales?.some(c => c.id === payModal.credit_id) ||
      contactDetails[id]?.credit_restocks?.some(c => c.id === payModal.credit_id)
    );

        if (contactId) {
        const { data } = await api.get(`/credit/${businessId}/contacts/${contactId}/`);
        setContactDetails(prev => ({ ...prev, [contactId]: data }));
        }

        await fetchContacts(); // refresh summary totals
        setPayModal(null);
        setPayForm({ amount: '', payment_method: 'cash', note: '' });
    } catch (err) {
        alert(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
        setSaving(false);
    }
    };

  const fmt     = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE') : '—';

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const fetchContactDetail = async (contactId) => {
  if (contactDetails[contactId]) {
    setExpanded(expanded === contactId ? null : contactId);
    return;
  }
  setLoadingDetail(contactId);
  try {
    const { data } = await api.get(`/credit/${businessId}/contacts/${contactId}/`);
    setContactDetails(prev => ({ ...prev, [contactId]: data }));
    setExpanded(contactId);
  } catch {
    // fail silently
  } finally {
    setLoadingDetail(null);
  }
};

  const totalOutstanding = contacts.reduce((sum, c) =>
    sum + parseFloat(tab === 'debtors' ? c.total_owed : c.total_owing || 0), 0
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}`} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Credit Manager</h1>
          <p className="page-sub">
            {tab === 'debtors'
              ? `Total outstanding: ${fmt(totalOutstanding)} owed to you`
              : `Total outstanding: ${fmt(totalOutstanding)} you owe`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add {tab === 'debtors' ? 'Debtor' : 'Creditor'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['debtors', 'creditors'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setTab(t); setExpanded(null); }}>
            {t === 'debtors' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <input className="form-input" placeholder="Search by name or phone..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem' }} />

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-label">{tab === 'debtors' ? 'Total Debtors' : 'Total Creditors'}</span>
          <span className="stat-value">{contacts.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Outstanding</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{fmt(totalOutstanding)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Fully Settled</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {contacts.filter(c => parseFloat(tab === 'debtors' ? c.total_owed : c.total_owing) === 0).length}
          </span>
        </div>
      </div>

      {/* Contacts list */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>No {tab} yet</h3>
            <p>Add a {tab === 'debtors' ? 'debtor' : 'creditor'} to get started</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(contact => {
            const outstanding = parseFloat(tab === 'debtors' ? contact.total_owed : contact.total_owing);
            const credits     = tab === 'debtors' ? contact.credit_sales : contact.credit_restocks;

            return (
              <div key={contact.id} className="card">
                {/* Contact header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer' }} onClick={() => fetchContactDetail(contact.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: outstanding > 0 ? '#fee2e2' : '#dcfce7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1rem',
                      color: outstanding > 0 ? 'var(--danger)' : 'var(--success)',
                    }}>
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{contact.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{contact.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontWeight: 700, fontSize: '1rem',
                        color: outstanding > 0 ? 'var(--danger)' : 'var(--success)'
                      }}>
                        {fmt(outstanding)}
                      </p>
                      <p style={{ fontSize: '0.775rem', color: 'var(--muted)' }}>
                        {outstanding > 0 ? 'Outstanding' : 'Settled'}
                      </p>
                    </div>
                    {expanded === contact.id
                      ? <ChevronUp size={16} color="var(--muted)" />
                      : <ChevronDown size={16} color="var(--muted)" />}
                  </div>
                </div>

                {/* Expanded credit history */}
            {expanded === contact.id && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                {loadingDetail === contact.id ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Loading...</p>
                ) : (() => {
                const detail  = contactDetails[contact.id];
                const credits = tab === 'debtors' ? detail?.credit_sales : detail?.credit_restocks;

                return (
                    <>
                    {detail?.notes && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        📝 {detail.notes}
                        </p>
                    )}

                    {!credits || credits.length === 0 ? (
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No credit history yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {credits.map(credit => (
                            <div key={credit.id} style={{
                            background: 'var(--bg)', borderRadius: 8, padding: '0.75rem'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div>
                                <span className={`badge ${
                                    credit.status === 'paid'    ? 'badge-success' :
                                    credit.status === 'partial' ? 'badge-warning' : 'badge-danger'
                                }`} style={{ textTransform: 'capitalize', marginRight: '0.5rem' }}>
                                    {credit.status}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    Due: {credit.due_date ? new Date(credit.due_date).toLocaleDateString('en-KE') : '—'}
                                </span>
                                </div>
                                {credit.status !== 'paid' && (
                                <button className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                    onClick={() => setPayModal({
                                    credit_id: credit.id,
                                    balance:   credit.balance_due,
                                    name:      contact.name,
                                    })}>
                                    Record Payment
                                </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '0.5rem', fontSize: '0.825rem' }}>
                                <div>
                                <p style={{ color: 'var(--muted)' }}>Total</p>
                                <p style={{ fontWeight: 600 }}>{fmt(credit.total_amount)}</p>
                                </div>
                                <div>
                                <p style={{ color: 'var(--muted)' }}>Paid</p>
                                <p style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(credit.amount_paid)}</p>
                                </div>
                                <div>
                                <p style={{ color: 'var(--muted)' }}>Balance</p>
                                <p style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(credit.balance_due)}</p>
                                </div>
                            </div>

                            {credit.payments?.length > 0 && (
                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.775rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                                    Payment history:
                                </p>
                                {credit.payments.map(p => (
                                    <div key={p.id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '0.8rem', padding: '0.2rem 0'
                                    }}>
                                    <span>{new Date(p.created_at).toLocaleDateString('en-KE')} · {p.payment_method}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{fmt(p.amount)}</span>
                                    </div>
                                ))}
                                </div>
                            )}
                            </div>
                        ))}
                        </div>
                    )}
                    </>
                );
                })()}
            </div>
            )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add contact modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Add {tab === 'debtors' ? 'Debtor' : 'Creditor'}
              </h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="e.g. John Kamau"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="0712345678"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Any notes..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record payment modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment — {payModal.name}</h2>
              <button className="btn btn-ghost" onClick={() => setPayModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Balance due: <strong>{fmt(payModal.balance)}</strong>
            </p>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" step="0.01"
                  placeholder={`Max: ${fmt(payModal.balance)}`}
                  value={payForm.amount}
                  onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={payForm.payment_method}
                  onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" placeholder="e.g. Partial payment"
                  value={payForm.note}
                  onChange={e => setPayForm({ ...payForm, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
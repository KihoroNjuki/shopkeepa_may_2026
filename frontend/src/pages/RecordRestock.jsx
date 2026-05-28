import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, RefreshCcw } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

export default function RecordRestock() {
  const { businessId, branchId } = useParams();
  const navigate                 = useNavigate();
  const [products, setProducts]  = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems]        = useState([]);
  const [supplier, setSupplier]  = useState('');
  const [note, setNote]          = useState('');
  const [search, setSearch]      = useState('');
  const [loading, setLoading]    = useState(true);
  const [saving, setSaving]      = useState(false);
  const [error, setError]        = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '' });
  const [lowStockLoaded, setLowStockLoaded] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);

  useEffect(() => { fetchData(); }, [businessId]);

  // const fetchData = async () => {
  //   try {
  //     const [productsRes, suppliersRes] = await Promise.all([
  //       api.get(`/products/${businessId}/`),
  //       api.get(`/restock/${businessId}/suppliers/`),
  //     ]);
  //     setProducts(productsRes.data.filter(p => p.is_active));
  //     setSuppliers(suppliersRes.data);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const addItem = (product) => {
    if (items.find(i => i.product.id === product.id)) return;
    setItems([...items, {
      product,
      quantity:     1,
      buying_price: product.buying_price || '',
    }]);
    setSearch('');
  };

  const updateItem = (productId, field, value) => {
    setItems(items.map(i =>
      i.product.id === productId ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (productId) => {
    setItems(items.filter(i => i.product.id !== productId));
  };

  const total = items.reduce((sum, i) =>
    sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.buying_price) || 0), 0
  );

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Add at least one item.');
      return;
    }
    for (const item of items) {
      if (!item.buying_price || parseFloat(item.buying_price) < 0) {
        setError(`Enter a valid buying price for ${item.product.name}.`);
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await api.post(`/restock/${businessId}/branches/${branchId}/`, {
        supplier: supplier || null,
        note,
        items: items.map(i => ({
          product:      i.product.id,
          quantity:     parseFloat(i.quantity),
          buying_price: parseFloat(i.buying_price),
        })),
      });
      navigate(`/businesses/${businessId}/branches/${branchId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record restock.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setSavingSupplier(true);
    try {
      const { data } = await api.post(`/restock/${businessId}/suppliers/`, supplierForm);
      setSuppliers([...suppliers, data]);
      setSupplier(data.id);
      setShowSupplierModal(false);
      setSupplierForm({ name: '', phone: '', email: '' });
    } finally {
      setSavingSupplier(false);
    }
  };
  const fetchData = async () => {
  try {
    const [productsRes, suppliersRes] = await Promise.all([
      api.get(`/products/${businessId}/`),
      api.get(`/restock/${businessId}/suppliers/`),
    ]);

    const activeProducts = productsRes.data.filter(p => p.is_active);
    setProducts(activeProducts);
    setSuppliers(suppliersRes.data);

    // pre-fill low stock items below search bar
    if (branchId) {
      const stockRes = await api.get(
        `/products/${businessId}/branches/${branchId}/low-stock/`
      );

      if (stockRes.data.length > 0) {
        const prefilled = stockRes.data.map(s => {
          // find full product object from products list
          const fullProduct = activeProducts.find(p => p.id === s.product);
          return {
            product: fullProduct || {
              id:           s.product,
              name:         s.product__name,
              buying_price: null,
              unit:         'piece',
            },
            quantity:     '',
            buying_price: fullProduct?.buying_price || '',
          };
        });
        setItems(prefilled);
      }
    }
  } finally {
    setLoading(false);
  }
};

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  ).filter(p => !items.find(i => i.product.id === p.id));

  const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}/branches/${branchId}`} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Record Restock</h1>
          <p className="page-sub">Add incoming stock to this branch</p>
        </div>
      </div>

      <div className="grid-sidebar" style={{ gap: '1.5rem' }}>

        {/* Left — Product search + items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Search products */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1rem' }}>Add Products</h2>
            <div style={{ position: 'relative', marginBottom: filtered.length && search ? '0.75rem' : 0 }}>
              <Search size={16} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--muted)'
              }} />
              <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                placeholder="Search products to restock..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {search && filtered.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {filtered.slice(0, 6).map(p => (
                  <div key={p.id} style={{
                    padding: '0.75rem 1rem', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                    onClick={() => addItem(p)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.775rem' }}>{p.category_name || 'No category'}</p>
                    </div>
                    <Plus size={16} color="var(--accent)" />
                  </div>
                ))}
              </div>
            )}
            {search && filtered.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                No products found. Add products from the Products page first.
              </p>
            )}
          </div>
            {/* Low stock banner */}
{items.length > 0 && (
  <div className="alert alert-warning">
    ⚠️ {items.length} low stock item{items.length !== 1 ? 's' : ''} pre-filled. Set quantities and buying prices to restock.
  </div>
)}
          {/* Items list */}
          {items.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: '1rem' }}>Restock Items</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map(item => (
                  <div key={item.product.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 140px auto',
                    gap: '0.75rem', alignItems: 'center',
                    padding: '0.75rem', background: 'var(--bg)', borderRadius: 8
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product.name}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.775rem' }}>{item.product.unit}</p>
                    </div>
<div className="form-group" style={{ margin: 0 }}>
  <label className="form-label">Qty</label>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
    <button type="button" className="btn btn-ghost"
      style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }}
      onClick={() => updateItem(item.product.id, 'quantity',
        Math.max(1, (parseFloat(item.quantity) || 0) - 1))}>
      −
    </button>
    <input className="form-input" type="number" min="1" step="1"
      style={{ textAlign: 'center', width: 80 }}
      value={item.quantity}
      onChange={e => updateItem(item.product.id, 'quantity', e.target.value)} />
    <button type="button" className="btn btn-ghost"
      style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }}
      onClick={() => updateItem(item.product.id, 'quantity',
        (parseFloat(item.quantity) || 0) + 1)}>
      +
    </button>
  </div>
</div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Buying Price Per Unit</label>
                      <input className="form-input" type="number" min="0" step="0.01"
                        placeholder="0.00"
                        value={item.buying_price}
                        onChange={e => updateItem(item.product.id, 'buying_price', e.target.value)} />
                    </div>
                    <button className="btn btn-danger" style={{ padding: '0.4rem', marginTop: '1.2rem' }}
                      onClick={() => removeItem(item.product.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Low stock banner
        {items.length > 0 && !lowStockLoaded === false && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            ⚠️ {items.length} low stock item{items.length !== 1 ? 's' : ''} pre-filled below. Set quantities and buying prices to restock them.
          </div>
        )} */}

        {/* Right — Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Summary</h2>
              <RefreshCcw size={18} color="var(--muted)" />
            </div>

            {/* Supplier */}
            <div className="form-group">
              <label className="form-label">Supplier (optional)</label>
              <select className="form-select" value={supplier}
                onChange={e => setSupplier(e.target.value)}>
                <option value="">No supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}
              onClick={() => setShowSupplierModal(true)}>
              <Plus size={14} /> Add New Supplier
            </button>

            {/* Note */}
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input className="form-input" placeholder="e.g. Weekly delivery"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Total */}
            <div style={{
              borderTop: '2px solid var(--border)', paddingTop: '1rem',
              display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'
            }}>
              <span style={{ fontWeight: 600 }}>Total Cost</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>
                {fmt(total)}
              </span>
            </div>

            <div style={{ color: 'var(--muted)', fontSize: '0.825rem', marginBottom: '1rem' }}>
              {items.length} product{items.length !== 1 ? 's' : ''} · {
                items.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)
              } units total
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={handleSubmit} disabled={saving || items.length === 0}>
              {saving ? 'Recording...' : `Record Restock · ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Supplier</h2>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input className="form-input" placeholder="e.g. Nairobi Distributors"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="0712345678"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="supplier@email.com"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingSupplier}>
                  {savingSupplier ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
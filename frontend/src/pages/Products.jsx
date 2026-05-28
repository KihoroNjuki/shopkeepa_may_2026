import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Plus, Search, X, Barcode, Pencil, Trash2 } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';
import { usePrivileges } from '../context/PrivilegeContext';
import OptionsMenu from '../components/OptionsMenu';
 

export default function Products() {
  const { businessId, branchId } = useParams();
  const { loadPrivileges, can, isOwner } = usePrivileges();
  const [products, setProducts]   = useState([]);
  const [stock, setStock]         = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [editProduct, setEditProduct]   = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [updating, setUpdating]         = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm]           = useState({
    name: '', barcode: '', category_name: '',
    unit: 'piece', buying_price: '', selling_price: '',
    quantity: '', alert_threshold: '10'  

  });
  const barcodeRef = useRef(null);

  const units = ['piece', 'kg', 'litre', 'gram', 'metre', 'pack', 'box', 'dozen'];

  useEffect(() => { if (businessId) loadPrivileges(businessId); fetchData(); }, [businessId, branchId]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get(`/products/${businessId}/`),
        api.get(`/products/${businessId}/categories/`),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);

      // fetch stock if branchId is available
      if (branchId) {
        const stockRes = await api.get(`/products/${businessId}/branches/${branchId}/stock/`);
        console.log('stock data:', stockRes.data);
        const stockMap = {};
        stockRes.data.forEach(s => { stockMap[s.product] = s; });
        setStock(stockMap);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (p) => {
  const s = stock[p.id];
  setEditProduct(p);
  setEditForm({
    name:          p.name,
    barcode:       p.barcode || '',
    category_name: p.category_name || '',
    unit:          p.unit,
    buying_price:  p.buying_price || '',
    selling_price: p.selling_price,
    quantity:      s ? s.quantity : '',
    alert_threshold: s ? s.alert_threshold : '10',
  });
};

const handleUpdate = async (e) => {
  e.preventDefault();
  setUpdating(true);
  try {
    await api.patch(`/products/${businessId}/${editProduct.id}/`, editForm);
    await fetchData();
    setEditProduct(null);
  } catch (err) {
    const d = err.response?.data;
    const first = Object.values(d || {})[0];
    setFormError(Array.isArray(first) ? first[0] : 'Failed to update product.');
  } finally {
    setUpdating(false);
  }
};

const handleDelete = async () => {
  setDeleting(true);
  try {
    await api.delete(`/products/${businessId}/${deleteProduct.id}/`);
    await fetchData();
    setDeleteProduct(null);
  } catch {
    setFormError('Failed to delete product.');
  } finally {
    setDeleting(false);
  }
};

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setLookingUp(true);
    try {
      const { data } = await api.get(`/products/barcode-lookup/?barcode=${barcodeInput}`);
      if (data.found) {
        setForm({
          name:          data.product.name,
          barcode:       data.product.barcode,
          category_name: data.product.category || '',
          unit:          data.product.unit || 'piece',
          buying_price:  '',
          selling_price: '',
        });
      } else {
        setForm(f => ({ ...f, barcode: barcodeInput }));
      }
      setScanning(false);
      setShowModal(true);
    } finally {
      setLookingUp(false);
    }
  };

  const handleCreate = async (e) => {
  e.preventDefault();
  setFormError('');
  setSaving(true);
  try {
    const { data } = await api.post(`/products/${businessId}/`, form);
    // set initial stock if branchId and quantity provided
    if (branchId && form.quantity !== '') {
      await api.patch(
        `/products/${businessId}/branches/${branchId}/stock/${data.id}/`,
        {
          quantity:        parseFloat(form.quantity) || 0,
          alert_threshold: parseFloat(form.alert_threshold) || 10,
        }
      );
      // refresh stock
      const stockRes = await api.get(`/products/${businessId}/branches/${branchId}/stock/`);
      const stockMap = {};
      stockRes.data.forEach(s => { stockMap[s.product] = s; });
      setStock(stockMap);
    }

    await fetchData();

    setShowModal(false);
    resetForm();
  } catch (err) {
    const d = err.response?.data;
    const first = Object.values(d || {})[0];
    setFormError(Array.isArray(first) ? first[0] : 'Failed to create product.');
  } finally {
    setSaving(false);
  }
};

  const resetForm = () => {
    setForm({ name: '', barcode: '', category_name: '', unit: 'piece', buying_price: '', selling_price: '',
        quantity: '', alert_threshold: '10'
     });
    setBarcodeInput('');
    setFormError('');
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
        <BackButton />

      <div className="page-header">
      <div>
        <h1 className="page-title">Products</h1>
        <p className="page-sub">{products.length} products in catalogue</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {(isOwner() || can('add_products')) && (
          <button className="btn btn-secondary" onClick={() => setScanning(true)}>
            <Barcode size={16} /> Scan Barcode
          </button>
        )}
        {(isOwner() || can('add_products')) && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>
    </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{
          position: 'absolute', left: '1rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--muted)'
        }} />
        <input className="form-input" style={{ paddingLeft: '2.5rem' }}
          placeholder="Search by name or category..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Products Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={48} />
            <h3>No products found</h3>
            <p>Add your first product or scan a barcode</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Buying Price</th>
                  <th>Selling Price</th>
                  {branchId && <th>Stock</th>}
                  {branchId && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
  const s = stock[p.id];
  return (
    <tr key={p.id}>
      <td>
        <p style={{ fontWeight: 500 }}>{p.name}</p>
        {p.barcode && <p style={{ fontSize: '0.775rem', color: 'var(--muted)' }}>{p.barcode}</p>}
      </td>
      <td>{p.category_name || '—'}</td>
      <td style={{ textTransform: 'capitalize' }}>{p.unit}</td>
      <td>{p.buying_price ? fmt(p.buying_price) : '—'}</td>
      <td>{fmt(p.selling_price)}</td>
      {branchId && <td>{s ? s.quantity : '—'}</td>}
      {branchId && (
        <td>
          {s ? (
            <span className={`badge ${s.is_low_stock ? 'badge-danger' : 'badge-success'}`}>
              {s.is_low_stock ? 'Low Stock' : 'In Stock'}
            </span>
          ) : <span className="badge badge-warning">No Stock Set</span>}
        </td>
      )}
      <td>
  <OptionsMenu options={[
    ...(isOwner() || can('edit_products') ? [{ label: 'Edit', icon: <Pencil size={14} />, onClick: () => handleEditOpen(p) }] : []),
    ...(isOwner() || can('delete_products') ? ['divider', { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteProduct(p), danger: true }] : []),
  ]} />
</td>
    </tr>
  );
})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scanning && (
        <div className="modal-overlay" onClick={() => setScanning(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Scan Barcode</h2>
              <button className="btn btn-ghost" onClick={() => setScanning(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Type or scan the barcode — we'll auto-fill product details if found.
            </p>
            <form onSubmit={handleBarcodeSearch}>
              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input
                  ref={barcodeRef}
                  className="form-input"
                  placeholder="e.g. 5449000000996"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setScanning(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={lookingUp}>
                  {lookingUp ? 'Looking up...' : 'Look Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Product</h2>
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" placeholder="e.g. Coca Cola 500ml"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Barcode (optional)</label>
                  <input className="form-input" placeholder="e.g. 5449000000996"
                    value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" placeholder="e.g. Beverages"
                    value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })}
                    list="categories-list" />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select"
                    value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Buying Price (optional)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.00"
                    value={form.buying_price} onChange={e => setForm({ ...form, buying_price: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} required />
              </div>
            {branchId && (
            <div className="form-row">
                <div className="form-group">
                <label className="form-label">Current Quantity</label>
                <input className="form-input" type="number" step="0.01" placeholder="0"
                    value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                <label className="form-label">Low Stock Alert At</label>
                <input className="form-input" type="number" step="0.01" placeholder="10"
                    value={form.alert_threshold} onChange={e => setForm({ ...form, alert_threshold: e.target.value })} />
                </div>
            </div>
            )}
              {formError && <div className="alert alert-error">{formError}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* {Edit Product Modal} */}
      {editProduct && (
  <div className="modal-overlay" onClick={() => setEditProduct(null)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Edit Product</h2>
        <button className="btn btn-ghost" onClick={() => setEditProduct(null)}><X size={18} /></button>
      </div>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input className="form-input" value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Barcode (optional)</label>
            <input className="form-input" value={editForm.barcode}
              onChange={e => setEditForm({ ...editForm, barcode: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input className="form-input" value={editForm.category_name}
              onChange={e => setEditForm({ ...editForm, category_name: e.target.value })}
              list="categories-list" />
            <datalist id="categories-list">
              {categories.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-select" value={editForm.unit}
              onChange={e => setEditForm({ ...editForm, unit: e.target.value })}>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Buying Price (optional)</label>
            <input className="form-input" type="number" step="0.01"
              value={editForm.buying_price}
              onChange={e => setEditForm({ ...editForm, buying_price: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Selling Price</label>
          <input className="form-input" type="number" step="0.01"
            value={editForm.selling_price}
            onChange={e => setEditForm({ ...editForm, selling_price: e.target.value })} required />
        </div>
        {branchId && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Quantity</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0"
                    value={editForm.quantity}
                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Alert At</label>
                  <input className="form-input" type="number" step="0.01" placeholder="10"
                    value={editForm.alert_threshold}
                    onChange={e => setEditForm({ ...editForm, alert_threshold: e.target.value })} />
                </div>
              </div>
              )}
        {formError && <div className="alert alert-error">{formError}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setEditProduct(null)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{/* Delete Product Modal */}
{deleteProduct && (
  <div className="modal-overlay" onClick={() => setDeleteProduct(null)}>
    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Delete Product</h2>
        <button className="btn btn-ghost" onClick={() => setDeleteProduct(null)}><X size={18} /></button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Are you sure you want to delete <strong>{deleteProduct.name}</strong>? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={() => setDeleteProduct(null)}>Cancel</button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Product'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
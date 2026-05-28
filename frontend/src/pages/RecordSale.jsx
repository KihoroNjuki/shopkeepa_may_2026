import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingCart, Search,X } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

export default function RecordSale() {
  const { businessId, branchId } = useParams();
  const navigate                 = useNavigate();
  const [products, setProducts]  = useState([]);
  const [stock, setStock] = useState({});
  const [cart, setCart]          = useState([]);
  const [search, setSearch]      = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote]          = useState('');
  const [loading, setLoading]    = useState(true);
  const [saving, setSaving]      = useState(false);
  const [error, setError]        = useState('');
  const [creditContact, setCreditContact] = useState('');
  const [contacts, setContacts]           = useState([]);
  const [amountPaid, setAmountPaid]       = useState('');
  const [dueDate, setDueDate]             = useState('');
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact]       = useState({ name: '', phone: '', notes: '' });
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    category_name: '',
    unit: 'piece',
    buying_price: '',
    selling_price: '',
    quantity: '',
    alert_threshold: '10'
  });

  const units = ['piece', 'kg', 'litre', 'gram', 'metre', 'pack', 'box', 'dozen'];



  const fetchProducts = async () => {
  try {
    const [productsRes, stockRes, contactsRes, categoriesRes] = await Promise.all([
      api.get(`/products/${businessId}/`),
      api.get(`/products/${businessId}/branches/${branchId}/stock/`),
      api.get(`/credit/${businessId}/contacts/?type=debtor`),
      api.get(`/products/${businessId}/categories/`),
    ]);
    setProducts(productsRes.data.filter(p => p.is_active));
    const stockMap = {};
    stockRes.data.forEach(s => { stockMap[s.product] = s; });
    setStock(stockMap);
    setContacts(contactsRes.data);
    setCategories(categoriesRes.data);
  } finally {
    setLoading(false);
  }
};

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      setError('Product name is required');
      return;
    }
    setCreatingProduct(true);
    try {
      const { data } = await api.post(`/products/${businessId}/`, newProduct);
      
      // set initial stock if branchId and quantity provided
      if (branchId && newProduct.quantity !== '') {
        await api.patch(
          `/products/${businessId}/branches/${branchId}/stock/${data.id}/`,
          {
            quantity:        parseFloat(newProduct.quantity) || 0,
            alert_threshold: parseFloat(newProduct.alert_threshold) || 10,
          }
        );
      }

      await fetchProducts();
      setShowCreateProduct(false);
      setNewProduct({
        name: '',
        barcode: '',
        category_name: '',
        unit: 'piece',
        buying_price: '',
        selling_price: '',
        quantity: '',
        alert_threshold: '10'
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [businessId, branchId]);


  const addToCart = (product) => {
    const available  = parseFloat(stock[product.id]?.quantity || 0);
    const existing   = cart.find(i => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= available) {
      setError(`Only ${available} ${product.unit}(s) available.`);
      return;
    }
    setError('');

    if (existing) {
      setCart(cart.map(i => i.product.id === product.id
        ? { ...i, quantity: i.quantity + 1 }
        : i
      ));
    } else {
      setCart([...cart, {
        product,
        quantity:  1,
        unitPrice: parseFloat(product.selling_price), // ← editable
      }]);
    }
  };

  const updateQty = (productId, delta) => {
  const available = parseFloat(stock[productId]?.quantity || 0);
  setCart(cart
    .map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty > available) {
        setError(`Only ${available} ${i.product.unit}(s) available in stock.`);
        return i;
      }
      setError('');
      return { ...i, quantity: newQty };
    })
    .filter(i => i.quantity > 0)
  );
};

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  
  const handleSubmit = async () => {
  if (cart.length === 0) { setError('Add at least one item.'); return; }
  if (paymentMethod === 'credit' && !creditContact) {
    setError('Select a debtor for credit sales.'); return;
  }
  setError('');
  setSaving(true);
  try {
    const { data: saleData } = await api.post(`/sales/${businessId}/branches/${branchId}/`, {
      payment_method: paymentMethod === 'credit' ? 'credit' : paymentMethod,
      note,
      items: cart.map(i => ({
        product:    i.product.id,
        quantity:   i.quantity,
        unit_price: i.unitPrice,
      })),
    });

    // attach credit if credit payment
    if (paymentMethod === 'credit') {
      await api.post(`/credit/${businessId}/sales/`, {
        sale_id:        saleData.id,
        contact_id:     creditContact,
        amount_paid:    amountPaid || 0,
        payment_method: 'cash',
        due_date:       dueDate || null,
      });
    }

    navigate(`/businesses/${businessId}/branches/${branchId}`);
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to record sale.');
  } finally {
    setSaving(false);
  }
};

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-cols)', gap: '1.5rem', height: 'auto' }}>

      {/* Left — Product picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        <BackButton to={`/businesses/${businessId}/branches/${branchId}`} />

        <div>
          <h1 className="page-title">Record Sale</h1>
          <p className="page-sub">Select products to add to the cart</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '1rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--muted)'
          }} />
          <input className="form-input" style={{ paddingLeft: '2.5rem' }}
            placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Product grid */}
        <div className="grid-auto" style={{ overflowY: 'auto', 
          paddingBottom: '1rem' }}>
            
          {filtered.length === 0 && search.length > 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Can't find "{search}",{' '}
                <button
                  onClick={() => {
                    setNewProduct({ ...newProduct, name: search });
                    setShowCreateProduct(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    font: 'inherit',
                    padding: 0
                  }}
                >
                  create new product?
                </button>
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <p>No products available</p>
            </div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="card" style={{ cursor: 'pointer', padding: '1rem' }}
                onClick={() => addToCart(p)}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'var(--accent-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem'
                }}>
                  <ShoppingCart size={18} color="var(--accent)" />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{p.name}</p>
                <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.925rem' }}>
                  {fmt(p.selling_price)}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.775rem' }}>{p.unit}</p>
                <p style={{ fontSize: '0.75rem', color: stock[p.id]?.is_low_stock ? 'var(--danger)' : 'var(--muted)' }}>
      Stock: {stock[p.id] ? stock[p.id].quantity : '—'}
    </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h2 className="card-title">Cart</h2>
            <span className="badge badge-info">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <ShoppingCart size={36} />
              <h3>Cart is empty</h3>
              <p>Click a product to add it</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
      {cart.map(item => (
        <div key={item.product.id} style={{
          padding: '0.75rem 0',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.product.name}</p>
            <button className="btn btn-danger" style={{ padding: '0.2rem 0.4rem' }}
              onClick={() => removeFromCart(item.product.id)}>
              <Trash2 size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Quantity controls */}
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.4rem' }}
              onClick={() => updateQty(item.product.id, -1)}>
              <Minus size={14} />
            </button>
            <input
              type="number" min="1"
              style={{
                width: 48, textAlign: 'center', border: '1px solid var(--border)',
                borderRadius: 6, padding: '0.25rem', fontSize: '0.875rem'
              }}
              value={item.quantity}
              onChange={e => {
                const val = parseFloat(e.target.value) || 1;
                const available = parseFloat(stock[item.product.id]?.quantity || 0);
                if (val > available) { setError(`Only ${available} available.`); return; }
                setError('');
                setCart(cart.map(i => i.product.id === item.product.id ? { ...i, quantity: val } : i));
              }}
      />
      <button className="btn btn-ghost" style={{ padding: '0.25rem 0.4rem' }}
        onClick={() => updateQty(item.product.id, 1)}>
        <Plus size={14} />
      </button>

      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>×</span>

      {/* Editable unit price */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>KSh</span>
        <input
          type="number" min="0" step="0.01"
          style={{
            flex: 1, border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.875rem'
          }}
          value={item.unitPrice}
          placeholder='Or set custom price'
          onChange={e => setCart(cart.map(i =>
            i.product.id === item.product.id
              ? { ...i, unitPrice: parseFloat(e.target.value) || 0 }
              : i
          ))}
        />
              </div>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--muted)', marginTop: '0.3rem', textAlign: 'right' }}>
              Subtotal: {fmt(item.quantity * item.unitPrice)}
            </p>
          </div>
        ))}
            </div>
          )}

          {/* Total */}
          <div style={{
            borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>
                {fmt(total)}
              </span>
            </div>

            {/* Payment method */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            {/* Credit fields */}
            {paymentMethod === 'credit' && (
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Debtor</label>
                  <select className="form-select" value={creditContact}
                    onChange={e => setCreditContact(e.target.value)}>
                    <option value="">Select debtor</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ''}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '0.4rem', fontSize: '0.8rem' }}
                    onClick={() => setShowNewContact(true)}>
                    + New Debtor
                  </button>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Deposit (optional)</label>
                    <input className="form-input" type="number" step="0.01" placeholder="0.00"
                      value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Due Date (optional)</label>
                    <input className="form-input" type="date"
                      value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
                {amountPaid && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                    Balance due: {fmt(total - parseFloat(amountPaid || 0))}
                  </p>
                )}
              </div>
            )}
            {/* Note */}
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input className="form-input" placeholder="e.g. Walk-in customer"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={handleSubmit} disabled={saving || cart.length === 0}>
              {saving ? 'Recording...' : `Record Sale · ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
      {/* Contact Quick-add Modal */}
      {showNewContact && (
  <div className="modal-overlay" onClick={() => setShowNewContact(false)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Add Debtor</h2>
        <button className="btn btn-ghost" onClick={() => setShowNewContact(false)}>
          <X size={18} />
        </button>
      </div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { data } = await api.post(`/credit/${businessId}/contacts/`, {
            ...newContact, contact_type: 'debtor'
          });
          setContacts([...contacts, data]);
          setCreditContact(data.id);
          setShowNewContact(false);
          setNewContact({ name: '', phone: '', notes: '' });
        } catch {}
      }}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="e.g. John Kamau"
            value={newContact.name}
            onChange={e => setNewContact({ ...newContact, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" placeholder="0712345678"
            value={newContact.phone}
            onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Any notes..."
            value={newContact.notes}
            onChange={e => setNewContact({ ...newContact, notes: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost"
            onClick={() => setShowNewContact(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary">Add Debtor</button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Create Product Modal */}
      {showCreateProduct && (
        <div className="modal-overlay" onClick={() => setShowCreateProduct(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Product</h2>
              <button className="btn btn-ghost" onClick={() => { setShowCreateProduct(false); setNewProduct({ name: '', barcode: '', category_name: '', unit: 'piece', buying_price: '', selling_price: '', quantity: '', alert_threshold: '10' }); setError(''); }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" placeholder="e.g. Coca Cola 500ml"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Barcode (optional)</label>
                  <input className="form-input" placeholder="e.g. 5449000000996"
                    value={newProduct.barcode}
                    onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" placeholder="e.g. Beverages"
                    value={newProduct.category_name}
                    onChange={e => setNewProduct({ ...newProduct, category_name: e.target.value })}
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
                    value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Buying Price (optional)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.00"
                    value={newProduct.buying_price}
                    onChange={e => setNewProduct({ ...newProduct, buying_price: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={newProduct.selling_price}
                  onChange={e => setNewProduct({ ...newProduct, selling_price: e.target.value })} required />
              </div>
              {branchId && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Quantity</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0"
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Alert At</label>
                  <input className="form-input" type="number" step="0.01" placeholder="10"
                    value={newProduct.alert_threshold}
                    onChange={e => setNewProduct({ ...newProduct, alert_threshold: e.target.value })} />
                </div>
              </div>
              )}
              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setShowCreateProduct(false); setNewProduct({ name: '', barcode: '', category_name: '', unit: 'piece', buying_price: '', selling_price: '', quantity: '', alert_threshold: '10' }); setError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingProduct}>
                  {creatingProduct ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
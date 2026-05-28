// src/pages/SalesHistory.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

export default function SalesHistory() {
  const { businessId, branchId } = useParams();
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [filters, setFilters]     = useState({ from: '', to: '', payment_method: '' });

  useEffect(() => { fetchSales(); }, [branchId, filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from)           params.append('from', filters.from);
      if (filters.to)             params.append('to', filters.to);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);

      const { data } = await api.get(
        `/sales/${businessId}/branches/${branchId}/list/?${params.toString()}`
      );
      setSales(data);
    } catch {
      setError('Failed to load sales.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetail = async (saleId) => {
    if (expanded === saleId) { setExpanded(null); return; }
    try {
      const { data } = await api.get(`/sales/${businessId}/branches/${branchId}/${saleId}/`);
      setSales(sales.map(s => s.id === saleId ? { ...s, detail: data } : s));
      setExpanded(saleId);
    } catch {
      setError('Failed to load sale details.');
    }
  };

  const fmt    = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

  if (loading) return <div className="loading">Loading sales...</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}/branches/${branchId}`} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-sub">{sales.length} transactions · {fmt(totalRevenue)} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From</label>
            <input className="form-input" type="date"
              value={filters.from}
              onChange={e => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To</label>
            <input className="form-input" type="date"
              value={filters.to}
              onChange={e => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Payment Method</label>
            <select className="form-select"
              value={filters.payment_method}
              onChange={e => setFilters({ ...filters, payment_method: e.target.value })}>
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              
              <option value ='credit'>Credit</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sales.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ShoppingCart size={48} />
            <h3>No sales found</h3>
            <p>Try adjusting the filters or record a new sale</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Served By</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <>
                    <tr key={sale.id} style={{ cursor: 'pointer' }}
                      onClick={() => fetchSaleDetail(sale.id)}>
                      <td>{fmtDate(sale.created_at)}</td>
                      <td>{sale.served_by}</td>
                      <td>{sale.item_count} item{sale.item_count !== 1 ? 's' : ''}</td>
                      <td>
                        <span className={`badge ${
                          sale.payment_method === 'cash'  ? 'badge-info' :
                          sale.payment_method === 'mpesa' ? 'badge-success' : 'badge-warning'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {sale.payment_method}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(sale.total)}</td>
                      <td>
                        {expanded === sale.id
                          ? <ChevronUp size={16} color="var(--muted)" />
                          : <ChevronDown size={16} color="var(--muted)" />
                        }
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expanded === sale.id && sale.detail && (
                      <tr key={`${sale.id}-detail`}>
                        <td colSpan={6} style={{ background: 'var(--bg)', padding: '1rem' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.detail.items.map(item => (
                                <tr key={item.id}>
                                  <td>{item.product_name}</td>
                                  <td>{item.quantity}</td>
                                  <td>{fmt(item.unit_price)}</td>
                                  <td>{fmt(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {sale.detail.note && (
                            <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                              Note: {sale.detail.note}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
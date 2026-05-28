import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Package, RefreshCcw,
  AlertTriangle, TrendingUp, Plus, History
} from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';
import { BarChart2 } from 'lucide-react';
import { Users } from 'lucide-react';
import { usePrivileges } from '../context/PrivilegeContext';

export default function BranchDashboard() {
  const { loadPrivileges, can, isOwner } = usePrivileges();
  const { businessId, branchId } = useParams();
  const navigate                 = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [period, setPeriod]       = useState('month');

  useEffect(() => { loadPrivileges(businessId); fetchAnalytics(); }, [branchId, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/business/${businessId}/analytics/branches/${branchId}/?period=${period}`
      );
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="loading">Loading branch data...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <BackButton to={`/businesses/${businessId}`} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Branch Dashboard</h1>
          <p className="page-sub">Overview of sales, stock and performance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="form-select" style={{ width: 'auto' }}
            value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Link to={`/businesses/${businessId}/branches/${branchId}/sales/new`}
            className="btn btn-primary">
            <Plus size={16} /> Record Sale
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">{fmt(analytics?.summary?.total_revenue)}</span>
          <span className="stat-sub">{period === 'today' ? 'Today' : `This ${period}`}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Sales</span>
          <span className="stat-value">{analytics?.summary?.total_sales || 0}</span>
          <span className="stat-sub">Transactions</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Sale</span>
          <span className="stat-value">{fmt(analytics?.summary?.average_sale)}</span>
          <span className="stat-sub">Per transaction</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low Stock</span>
          <span className="stat-value" style={{ color: analytics?.low_stock?.length ? 'var(--danger)' : 'inherit' }}>
            {analytics?.low_stock?.length || 0}
          </span>
          <span className="stat-sub">Items need restocking</span>
        </div>
      </div>

      <div className="grid-2col" style={{ marginBottom: '1rem' }}>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Products</h2>
            <TrendingUp size={18} color="var(--muted)" />
          </div>
          {analytics?.top_products?.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No sales recorded yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.top_products?.map(p => (
                    <tr key={p.product__id}>
                      <td>{p.product__name}</td>
                      <td>{p.total_quantity}</td>
                      <td>{fmt(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payment Methods</h2>
            <ShoppingCart size={18} color="var(--muted)" />
          </div>
          {analytics?.revenue_by_payment?.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No sales recorded yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.revenue_by_payment?.map(p => (
                    <tr key={p.payment_method}>
                      <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                      <td>{p.count}</td>
                      <td>{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {analytics?.low_stock?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ color: 'var(--warning)' }}>
              <AlertTriangle size={18} style={{ marginRight: '0.5rem' }} />
              Low Stock Alerts
            </h2>
            <Link to={`/businesses/${businessId}/branches/${branchId}/restock/new`}
              className="btn btn-secondary">
              <RefreshCcw size={14} /> Restock
            </Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Alert Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.low_stock.map(item => (
                  <tr key={item.product__id}>
                    <td>{item.product__name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.alert_threshold}</td>
                    <td><span className="badge badge-danger">Low Stock</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
<div className="grid-3col" style={{ marginTop: '1rem' }}>
      {(isOwner() || can('record_sales')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/sales/new`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <ShoppingCart size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Sell</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>Add a new sale transaction</p>
        </Link>
      )}

      {(isOwner() || can('record_restock')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/restock/new`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <RefreshCcw size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Restock</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>Record a new restock</p>
        </Link>
      )}

      {(isOwner() || can('view_sales')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/sales`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <History size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Sales History</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>View past transactions</p>
        </Link>
      )}
      {(isOwner() || can('add_products') || can('edit_products')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/products`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <Package size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>View Products</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>Manage product catalogue</p>
        </Link>
      )}
      
      {(isOwner() || can('view_analytics')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/analytics`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <BarChart2 size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Analytics</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>View performance charts</p>
        </Link>
      )}
      {(isOwner() || can('invite_members')) && (
        <Link to={`/businesses/${businessId}/branches/${branchId}/members`}
          className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
          <Users size={28} color="var(--accent)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600 }}>Members</p>
          <p style={{ fontSize: '0.825rem', color: 'var(--muted)' }}>Manage branch staff</p>
        </Link>
      )}
    </div>
    </div>
  );
}
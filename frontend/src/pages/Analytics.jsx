// src/pages/Analytics.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import api from '../api';
import BackButton from '../components/BackButton';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const { businessId, branchId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [period, setPeriod]       = useState('month');
  const [granularity, setGranularity] = useState('day');

  useEffect(() => { fetchAnalytics(); }, [period, granularity]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const url = branchId
        ? `/business/${businessId}/analytics/branches/${branchId}/?period=${period}&granularity=${granularity}`
        : `/business/${businessId}/analytics/?period=${period}&granularity=${granularity}`;
      const { data } = await api.get(url);
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fmt     = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  const fmtShort = (n) => `KSh ${Number(n || 0) >= 1000
    ? `${(Number(n) / 1000).toFixed(1)}k`
    : Number(n || 0).toFixed(0)}`;

  const trendData = analytics?.sales_trend?.map(t => ({
    period:  new Date(t.period).toLocaleDateString('en-KE', {
      day:   granularity === 'day'   ? 'numeric' : undefined,
      month: 'short',
      year:  granularity === 'year'  ? 'numeric' : undefined,
    }),
    revenue: parseFloat(t.revenue || 0),
    sales:   t.count,
  })) || [];

  const topProductsData = analytics?.top_products?.slice(0, 8).map(p => ({
    name:    p.product__name.length > 20 ? p.product__name.slice(0, 18) + '…' : p.product__name,
    revenue: parseFloat(p.total_revenue || 0),
    qty:     parseFloat(p.total_quantity || 0),
  })) || [];

  const paymentData = analytics?.revenue_by_payment?.map(p => ({
    name:  p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1),
    value: parseFloat(p.total || 0),
    count: p.count,
  })) || [];

  const branchData = analytics?.branch_comparison?.map(b => ({
    name:    b.branch__name,
    revenue: parseFloat(b.total_revenue || 0),
    sales:   b.total_sales,
  })) || [];

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <BackButton to={branchId
        ? `/businesses/${businessId}/branches/${branchId}`
        : `/businesses/${businessId}`}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">
            {branchId ? 'Branch performance overview' : 'Business-wide performance overview'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="form-select" style={{ width: 'auto' }}
            value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }}
            value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
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
          <span className="stat-label">Low Stock Items</span>
          <span className="stat-value"
            style={{ color: analytics?.low_stock?.length ? 'var(--danger)' : 'inherit' }}>
            {analytics?.low_stock?.length || 0}
          </span>
          <span className="stat-sub">Need restocking</span>
        </div>
      </div>

      {/* Sales Trend */}
      <div className="grid-2col" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title">Sales Trend</h2>
          <TrendingUp size={18} color="var(--muted)" />
        </div>
        {trendData.length === 0 ? (
          <div className="empty-state">
            <h3>No sales data yet</h3>
            <p>Start recording sales to see trends</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? fmt(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Sales'
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5"
                strokeWidth={2} dot={false} name="revenue" />
              <Line type="monotone" dataKey="sales" stroke="#10b981"
                strokeWidth={2} dot={false} name="sales" yAxisId="right" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Products</h2>
          </div>
          {topProductsData.length === 0 ? (
            <div className="empty-state">
              <h3>No data yet</h3>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={fmtShort}
                  tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis type="category" dataKey="name" width={100}
                  tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip
                  formatter={(value) => [fmt(value), 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payment Methods</h2>
          </div>
          {paymentData.length === 0 ? (
            <div className="empty-state">
              <h3>No data yet</h3>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [fmt(value), 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Branch Comparison (business-wide only) */}
      {!branchId && branchData.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <h2 className="card-title">Branch Comparison</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? fmt(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Sales'
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="sales"   fill="#10b981" radius={[4, 4, 0, 0]} name="sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Low Stock */}
      {analytics?.low_stock?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ color: 'var(--warning)' }}>Low Stock Items</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Quantity</th>
                  <th>Alert At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.low_stock.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product__name}</td>
                    <td>{item.branch__name}</td>
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
    </div>
  );
}
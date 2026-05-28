import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [myBranches, setMyBranches] = useState([]);
  const [summary, setSummary]       = useState({ revenue: 0, sales: 0, lowStock: 0 });
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [businessRes, branchRes] = await Promise.all([
        api.get('/business/'),
        api.get('/business/my-branches/'),
      ]);

      const ownedBusinesses = businessRes.data;
      const memberBranches  = branchRes.data;

      setBusinesses(ownedBusinesses);
      setMyBranches(memberBranches);

      let totalRevenue = 0, totalSales = 0, totalLowStock = 0;
      await Promise.all(ownedBusinesses.map(async (b) => {
        try {
          const res = await api.get(`/business/${b.id}/analytics/?period=month`);
          totalRevenue  += parseFloat(res.data.summary?.total_revenue || 0);
          totalSales    += parseInt(res.data.summary?.total_sales     || 0);
          totalLowStock += res.data.low_stock?.length || 0;
        } catch {}
      }));

      setSummary({ revenue: totalRevenue, sales: totalSales, lowStock: totalLowStock });
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  // derived — no state needed
  // replace the isOwner check at the bottom with this:

if (loading) return <div className="loading">Loading dashboard...</div>;

const isOwner    = businesses.length > 0;
const isStaff    = myBranches.length > 0;
const isDualRole = isOwner && isStaff;

return (
  <div>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          Welcome{isOwner ? ' back' : ''}, {user?.first_name || user?.email} 👋
        </h1>
        <p className="page-sub">
          {isDualRole
            ? 'You own businesses and are assigned to branches.'
            : isOwner
            ? "Here's what's happening across your businesses this month."
            : 'Here are your assigned branches.'}
        </p>
      </div>
    </div>

    {/* Owner section */}
    {isOwner && (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{fmt(summary.revenue)}</span>
            <span className="stat-sub">This month across all businesses</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Sales</span>
            <span className="stat-value">{summary.sales}</span>
            <span className="stat-sub">Transactions this month</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Businesses</span>
            <span className="stat-value">{businesses.length}</span>
            <span className="stat-sub">Active businesses</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value" style={{ color: summary.lowStock ? 'var(--danger)' : 'inherit' }}>
              {summary.lowStock}
            </span>
            <span className="stat-sub">Items need attention</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: isDualRole ? '1.5rem' : 0 }}>
          <div className="card-header">
            <h2 className="card-title">Your Businesses</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/businesses')}>
              View All
            </button>
          </div>
          {businesses.length === 0 ? (
            <div className="empty-state">
              <Building2 size={48} />
              <h3>No businesses yet</h3>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => navigate('/businesses')}>
                Get Started
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {businesses.map(b => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onClick={() => navigate(`/businesses/${b.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 8,
                      background: 'var(--accent-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Building2 size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.925rem' }}>{b.name}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                        {b.industry} · {b.branch_count} {b.branch_count === 1 ? 'branch' : 'branches'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )}

    {/* Staff section — shows for staff-only or dual-role users */}
    {isStaff && (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {isDualRole ? 'Your Assigned Branches' : 'Your Branches'}
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {myBranches.map(branch => (
            <div key={branch.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
            }}
              onClick={() => navigate(`/businesses/${branch.business_id}/branches/${branch.id}`)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: 'var(--accent-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <MapPin size={18} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.925rem' }}>{branch.name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {branch.location || 'No location set'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Neither owner nor staff */}
    {!isOwner && !isStaff && (
      <div className="card">
        <div className="empty-state">
          <MapPin size={48} />
          <h3>Nothing here yet</h3>
          <p>Create a business or ask an owner to invite you to a branch.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }}
            onClick={() => navigate('/businesses')}>
            Create a Business
          </button>
        </div>
      </div>
    )}
  </div>
);
}
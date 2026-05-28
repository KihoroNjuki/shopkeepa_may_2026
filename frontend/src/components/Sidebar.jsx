import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package,
  ShoppingCart, RefreshCcw, BarChart2,
  LogOut, User, X, Shield
} from 'lucide-react';
import { authAPI } from '../api';
import { CreditCard } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const { businessId, branchId } = useParams();
  const [showLogout, setShowLogout]   = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const refresh = localStorage.getItem('refresh');
    try { await authAPI.logout(refresh); } catch {}
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>$hop<span>keepa</span></h1>
        </div>

        <nav className="sidebar-section">
          <div className="sidebar-label">Main</div>
          
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/businesses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Building2 size={18} /> Your Businesses
          </NavLink>
        </nav>

        <nav className="sidebar-section">
          <div className="sidebar-label">Operations</div>
          <NavLink
            to={businessId && branchId ? `/businesses/${businessId}/branches/${branchId}/restock/new` : '/businesses'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={18} /> Record Sale
          </NavLink>

          <NavLink
            to={businessId && branchId ? `/businesses/${businessId}/branches/${branchId}/restock/new` : '/businesses'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <RefreshCcw size={18} /> Record Restock
          </NavLink>

          <NavLink
            to={businessId ? `/businesses/${businessId}/credit` : '/businesses'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CreditCard size={18} /> Credit
          </NavLink>
          
          <NavLink
            to={businessId && branchId ? `/businesses/${businessId}/branches/${branchId}/products` : '/businesses'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Package size={18} /> View Products
          </NavLink>
          
          
          
          {/* {businessId && (
            <NavLink
              to={`/businesses/${businessId}/privileges`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} /> Privileges
            </NavLink>
            
          )} */}
          <NavLink
            to={businessId && branchId ? `/businesses/${businessId}/branches/${branchId}/sales` : '/businesses'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={18} /> Sales History
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <User size={18} /> Profile
          </NavLink>
          <button className="sidebar-link" onClick={() => setShowLogout(true)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} color="red" /> Sign out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sign out</h2>
              <button className="btn btn-ghost" onClick={() => setShowLogout(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to sign out of $hopkeepa?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogout(false)}
                disabled={loggingOut}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleLogout} disabled={loggingOut}>
                <LogOut size={14} /> {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
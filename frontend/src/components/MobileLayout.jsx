// src/components/MobileLayout.jsx

import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CreditCard,
  BarChart2, LogOut, User, X, Menu,
  Package, ShoppingCart, RefreshCcw, Shield
} from 'lucide-react';
import { authAPI } from '../api';

export default function MobileLayout({ children }) {
  const navigate = useNavigate();
  const { businessId, branchId } = useParams();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const refresh = localStorage.getItem('refresh');
    try { await authAPI.logout(refresh); } catch {}
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  const navLink = (to, icon, label) => (
    <NavLink to={to} className={({ isActive }) =>
      `mobile-nav-link ${isActive ? 'active' : ''}`}
      onClick={() => setMenuOpen(false)}>
      {icon} {label}
    </NavLink>
  );

  return (
    <>
      <style>{`
        .mobile-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 200;
        }
        .mobile-topbar h1 {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }
        .mobile-topbar h1 span { color: var(--accent); }
        .mobile-topbar button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.4rem;
          display: flex;
          align-items: center;
        }
        .mobile-content {
          margin-top: 56px;
          padding: 1.25rem 1rem;
          min-height: calc(100vh - 56px);
        }
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 300;
        }
        .mobile-drawer {
          position: fixed;
          top: 0; right: 0;
          width: 280px;
          height: 100vh;
          background: var(--primary);
          z-index: 400;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
          transform: translateX(0);
        }
        .mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 0.75rem;
        }
        .mobile-drawer-header h2 {
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .mobile-drawer-header h2 span { color: var(--accent); }
        .mobile-drawer-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          padding: 0.25rem;
        }
        .mobile-nav-section {
          padding: 0.25rem 0 0.75rem;
        }
        .mobile-nav-label {
          padding: 0.25rem 1.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.25rem;
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1.25rem;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 0.9rem;
          border-left: 3px solid transparent;
          transition: all 0.15s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(79,70,229,0.2);
          color: white;
          border-left-color: var(--accent);
        }
        .mobile-nav-link svg { width: 18px; height: 18px; flex-shrink: 0; }
        .mobile-drawer-bottom {
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 0.75rem;
        }
        .mobile-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1.25rem;
          color: rgba(255,100,100,0.9);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          width: 100%;
          text-align: left;
        }
      `}</style>

      {/* Top navbar */}
      <div className="mobile-topbar">
        <h1>$hop<span>keepa</span></h1>
        <button onClick={() => setMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Page content */}
      <div className="mobile-content">
        {children}
      </div>

      {/* Drawer overlay */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h2>$hop<span>keepa</span></h2>
              <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <nav className="mobile-nav-section">
              <div className="mobile-nav-label">Main</div>
              {navLink('/dashboard', <LayoutDashboard size={18} />, 'Dashboard')}
              {navLink('/businesses', <Building2 size={18} />, 'Businesses')}
            </nav>

            <nav className="mobile-nav-section">
              <div className="mobile-nav-label">Operations</div>
              {navLink(
                businessId && branchId
                  ? `/businesses/${businessId}/branches/${branchId}/sales/new`
                  : '/businesses',
                <ShoppingCart size={18} />, 'Sell'
              )}

              {navLink(
                businessId && branchId
                  ? `/businesses/${businessId}/branches/${branchId}/restock/new`
                  : '/businesses',
                <RefreshCcw size={18} />, 'Restocking'
              )}

              {navLink(
                businessId && branchId
                  ? `/businesses/${businessId}/branches/${branchId}/products`
                  : '/businesses',
                <Package size={18} />, 'View Products'
              )}

              {navLink(
                businessId && branchId
                  ? `/businesses/${businessId}/branches/${branchId}/sales`
                  : '/businesses',
                <ShoppingCart size={18} />, 'Sales History'
              )}
              
              {navLink(
                businessId && branchId
                  ? `/businesses/${businessId}/branches/${branchId}/analytics`
                  : businessId
                  ? `/businesses/${businessId}/analytics`
                  : '/businesses',
                <BarChart2 size={18} />, 'Performance'
              )}

              {navLink(
                businessId
                  ? `/businesses/${businessId}/credit`
                  : '/businesses',
                <CreditCard size={18} />, 'Credit Manager'
              )}

              {/* {businessId && navLink(
                `/businesses/${businessId}/privileges`,
                <Shield size={18} />, 'Privileges'
              )} */}
            </nav>

            <div className="mobile-drawer-bottom">
              {navLink('/profile', <User size={18} />, 'Profile')}
              <button className="mobile-logout-btn" onClick={() => {
                setMenuOpen(false);
                setShowLogout(true);
              }}>
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout modal */}
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
                disabled={loggingOut}>Cancel</button>
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
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isClient = location.pathname.startsWith('/client');
  const role = String(user?.role || '').trim().toLowerCase();

  const actionLinks = (() => {
    if (isClient || role === 'buyer' || role === 'seller') {
      const links = [{ to: '/marketplace', label: 'Marketplace' }];
      if (role === 'buyer') {
        links.push({ to: '/user-services', label: 'User Dashboard' });
      } else {
        links.push({ to: '/client/my-deliveries', label: 'Delivery Dashboard' });
      }
      return links;
    }

    if (isAdmin || role === 'admin' || role === 'delivery_management') {
      return [];
    }

    return [{ to: '/login', label: 'Login' }];
  })();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">VD</span>
          <span className="brand-text">
            <span className="brand-main">Vehicle</span>
            <span className="brand-sub">Delivery System</span>
          </span>
        </Link>

        <div className="navbar-links">
          {isClient && (
            <>
              <Link to="/client/new" className={`nav-link ${location.pathname === '/client/new' ? 'active' : ''}`}>
                New Delivery
              </Link>
              <Link to="/client/my-deliveries" className={`nav-link ${location.pathname === '/client/my-deliveries' ? 'active' : ''}`}>
                My Deliveries
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/admin/deliveries" className={`nav-link ${location.pathname === '/admin/deliveries' ? 'active' : ''}`}>
                All Deliveries
              </Link>
            </>
          )}
        </div>

        <div className="navbar-badge">
          {isAdmin && <span className="role-badge role-admin">ADMIN</span>}
          {isClient && <span className="role-badge role-client">CUSTOMER</span>}
          {!isAdmin && !isClient && <span className="role-badge">TESTING</span>}
          {actionLinks.length > 0 && (
            <div className="navbar-actions">
              {actionLinks.map((item) => (
                <Link key={item.to} to={item.to} className="btn btn-secondary btn-sm nav-action-btn">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

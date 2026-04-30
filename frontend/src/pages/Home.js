import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Dev-only testing banner */}
      <div className="dev-banner">
        <span className="dev-banner-dot" />
        <span className="dev-banner-text">TESTING MODE</span>
        <span className="dev-banner-sep">·</span>
        <span className="dev-banner-sub">Temporary home page for testing before merge</span>
      </div>

      {/* Background grid decoration */}
      <div className="home-grid-bg" aria-hidden="true" />

      <div className="home-content">
        {/* Hero */}
        <header className="home-hero">
          <div className="hero-tag">Vehicle Delivery Management System</div>
          <h1 className="hero-title">
            Manage Every
            <br />
            <span className="hero-title-accent">Delivery.</span>
          </h1>
          <p className="hero-desc">
            Track deliveries in real time, manage your agents, and know exactly where every vehicle is — all in one place.
          </p>
        </header>

        {/* Role selector cards */}
        <div className="role-cards">
          {/* Customer Card */}
          <div
            id="role-customer"
            className="role-card"
            onClick={() => navigate('/client/my-deliveries')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/client/my-deliveries')}
          >
            <div className="role-card-icon">👤</div>
            <div className="role-card-badge">Customer Portal</div>
            <h2 className="role-card-title">I'm a Customer</h2>
            <p className="role-card-desc">
              Create a new delivery request, track your existing deliveries, or cancel a pending order.
            </p>
            <ul className="role-card-features">
              <li>📦 Create delivery request</li>
              <li>🔍 Track your deliveries</li>
              <li>❌ Cancel pending orders</li>
            </ul>
            <button
              id="btn-customer-portal"
              className="role-card-btn"
              onClick={(e) => { e.stopPropagation(); navigate('/client/my-deliveries'); }}
            >
              Enter Customer Portal →
            </button>
          </div>

          {/* Admin Card */}
          <div
            id="role-admin"
            className="role-card role-card-admin"
            onClick={() => navigate('/admin/dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/dashboard')}
          >
            <div className="role-card-icon">🛠️</div>
            <div className="role-card-badge role-card-badge-admin">Admin Dashboard</div>
            <h2 className="role-card-title">I'm an Admin</h2>
            <p className="role-card-desc">
              View all deliveries, update statuses, assign agents, manage schedules, and monitor operations.
            </p>
            <ul className="role-card-features">
              <li>📊 Dashboard & statistics</li>
              <li>🔄 Update delivery status</li>
              <li>👤 Assign delivery agents</li>
              <li>🗑️ Manage all deliveries</li>
            </ul>
            <button
              id="btn-admin-dashboard"
              className="role-card-btn role-card-btn-admin"
              onClick={(e) => { e.stopPropagation(); navigate('/admin/dashboard'); }}
            >
              Enter Admin Dashboard →
            </button>
          </div>
        </div>

        {/* Testing note */}
        <p className="home-test-note">
          ⚠️ Testing mode — no login required. When auth is integrated, role selection will be automatic.
        </p>
      </div>
    </div>
  );
};

export default Home;

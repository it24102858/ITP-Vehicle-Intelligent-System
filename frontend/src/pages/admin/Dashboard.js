import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getAllDeliveries } from '../../services/deliveryService';
import StatusBadge from '../../components/StatusBadge';
import { shortId, formatDate } from '../../utils/statusHelpers';
import './Dashboard.css';

const StatCard = ({ label, value, icon, color, onClick }) => (
  <div
    className="stat-card"
    style={{ '--accent': color }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className="stat-icon" aria-hidden="true">{icon}</div>
    <div className="stat-value">{value ?? 0}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-bar" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, deliveriesRes] = await Promise.all([
          getStats(),
          getAllDeliveries(),
        ]);
        setStats(statsRes.data.data);
        setRecent(deliveriesRes.data.data.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completionRate =
    stats?.total > 0 ? Math.round(((stats?.delivered || 0) / stats.total) * 100) : 0;
  const inTransit = (stats?.assigned || 0) + (stats?.shipped || 0);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="dashboard-hero card">
        <div className="section-header dashboard-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle dashboard-subtitle">Vehicle Delivery Management Overview</p>
          </div>
          <div className="dashboard-header-actions">
            <button
              id="btn-view-all-top"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/deliveries')}
            >
              View All Deliveries
            </button>
            <button
              id="btn-new-delivery-admin"
              className="btn btn-primary"
              onClick={() => navigate('/client/new')}
            >
              + New Delivery
            </button>
          </div>
        </div>

        <div className="kpi-strip">
          <div className="kpi-tile">
            <div className="kpi-label">Completion Rate</div>
            <div className="kpi-value">{completionRate}%</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">In Transit</div>
            <div className="kpi-value">{inTransit}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Total Requests</div>
            <div className="kpi-value">{stats?.total ?? 0}</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard
          label="Total Deliveries"
          value={stats?.total}
          icon="TL"
          color="#ffffff"
          onClick={() => navigate('/admin/deliveries')}
        />
        <StatCard
          label="Pending"
          value={stats?.pending}
          icon="PN"
          color="#f5a623"
          onClick={() => navigate('/admin/deliveries?status=Pending')}
        />
        <StatCard
          label="Assigned"
          value={stats?.assigned}
          icon="AS"
          color="#4a90e2"
          onClick={() => navigate('/admin/deliveries?status=Assigned')}
        />
        <StatCard
          label="Shipped"
          value={stats?.shipped}
          icon="SH"
          color="#9b59b6"
          onClick={() => navigate('/admin/deliveries?status=Shipped')}
        />
        <StatCard
          label="Delivered"
          value={stats?.delivered}
          icon="OK"
          color="#27ae60"
          onClick={() => navigate('/admin/deliveries?status=Delivered')}
        />
        <StatCard
          label="Cancelled"
          value={stats?.cancelled}
          icon="CN"
          color="#e74c3c"
          onClick={() => navigate('/admin/deliveries?status=Cancelled')}
        />
      </div>

      <div className="dashboard-section">
        <div className="section-header recent-deliveries-header">
          <div className="recent-heading-group">
            <h2 className="dashboard-section-title">Recent Deliveries</h2>
            <p className="recent-subtitle">Latest requests with quick access to manage status and assignment.</p>
          </div>
          <button
            id="btn-view-all"
            className="btn btn-secondary btn-sm recent-view-all-btn"
            onClick={() => navigate('/admin/deliveries')}
          >
            View All Deliveries
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">ND</div>
            <p>No deliveries yet. Create one to get started.</p>
            <div className="empty-actions">
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/client/new')}>
                Create Delivery
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/deliveries')}>
                Open Delivery List
              </button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper recent-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <span className="id-chip">{shortId(d._id)}</span>
                    </td>
                    <td>{d.customerName}</td>
                    <td className="address-cell">{d.address}</td>
                    <td>
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td>{d.agentId || <span className="unassigned">Unassigned</span>}</td>
                    <td>{formatDate(d.createdAt)}</td>
                    <td>
                      <button
                        id={`btn-manage-${d._id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/admin/deliveries/${d._id}`)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

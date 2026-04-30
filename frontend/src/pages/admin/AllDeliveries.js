import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllDeliveries, deleteDelivery } from '../../services/deliveryService';
import StatusBadge from '../../components/StatusBadge';
import { shortId, formatDate } from '../../utils/statusHelpers';
import './AllDeliveries.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Assigned', 'Shipped', 'Delivered', 'Cancelled'];

const AllDeliveries = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status !== 'All') params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await getAllDeliveries(params);
      setDeliveries(res.data.data);
    } catch (err) {
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line
  }, [status]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeliveries();
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteDelivery(deleteModal._id);
      setDeliveries((prev) => prev.filter((d) => d._id !== deleteModal._id));
      setDeleteModal(null);
    } catch (err) {
      alert('Failed to delete delivery.');
    } finally {
      setDeleting(false);
    }
  };

  const pendingCount = deliveries.filter((d) => d.status === 'Pending').length;
  const inTransitCount = deliveries.filter((d) => ['Assigned', 'Shipped'].includes(d.status)).length;
  const deliveredCount = deliveries.filter((d) => d.status === 'Delivered').length;

  return (
    <div className="page-wrapper all-deliveries-page">
      <section className="card all-deliveries-header">
        <div className="all-deliveries-top">
          <div className="all-deliveries-headline">
            <span className="all-eyebrow">Delivery Management</span>
            <h1 className="page-title">All Deliveries</h1>
            <p className="page-subtitle">
              Monitor requests, filter by status, and manage operational flow from one place.
            </p>
          </div>
          <div className="all-deliveries-header-actions">
            <button
              id="btn-go-dashboard"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="all-stats-grid">
          <div className="all-stat-card">
            <span className="all-stat-label">Total Visible</span>
            <span className="all-stat-value">{deliveries.length}</span>
          </div>
          <div className="all-stat-card">
            <span className="all-stat-label">Pending</span>
            <span className="all-stat-value">{pendingCount}</span>
          </div>
          <div className="all-stat-card">
            <span className="all-stat-label">In Transit</span>
            <span className="all-stat-value">{inTransitCount}</span>
          </div>
          <div className="all-stat-card">
            <span className="all-stat-label">Delivered</span>
            <span className="all-stat-value">{deliveredCount}</span>
          </div>
        </div>
      </section>

      <section className="card all-filter-panel">
        <div className="all-filter-intro">
          <h2 className="all-panel-title">Filters</h2>
          <p className="all-panel-subtitle">Use status and keyword search to narrow down delivery records.</p>
        </div>

        <form onSubmit={handleSearch} className="all-filter-form">
          <div className="filter-field filter-search">
            <label className="form-label" htmlFor="search-input-admin">Search</label>
            <input
              id="search-input-admin"
              type="text"
              className="form-input"
              placeholder="Search by customer name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-field filter-status">
            <label className="form-label" htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button id="btn-apply-filter" type="submit" className="btn btn-primary">
              Apply
            </button>
          </div>
        </form>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card all-state-block">
          <div className="loading-spinner">
            <div className="spinner" />
            <span>Loading deliveries...</span>
          </div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card all-state-block all-empty-state">
          <div className="empty-icon">NO</div>
          <p>No deliveries match your filters.</p>
        </div>
      ) : (
        <section className="card all-table-panel">
          <div className="all-table-header">
            <h2 className="all-panel-title">Delivery Records</h2>
            <span className="all-table-count">{deliveries.length} item{deliveries.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Scheduled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d._id}>
                    <td><span className="id-chip">{shortId(d._id)}</span></td>
                    <td><strong>{d.customerName}</strong></td>
                    <td>{d.contactNumber}</td>
                    <td className="address-cell">{d.address}</td>
                    <td><StatusBadge status={d.status} size="sm" /></td>
                    <td>
                      {d.agentId
                        ? <span className="agent-chip">{d.agentId}</span>
                        : <span className="unassigned">-</span>}
                    </td>
                    <td>{formatDate(d.deliveryDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          id={`btn-manage-${d._id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/deliveries/${d._id}`)}
                        >
                          Manage
                        </button>
                        <button
                          id={`btn-delete-${d._id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteModal(d)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Delivery?</h3>
            <p>
              This will permanently remove delivery{' '}
              <strong>{shortId(deleteModal._id)}</strong> for{' '}
              <strong>{deleteModal.customerName}</strong>. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDeliveries;

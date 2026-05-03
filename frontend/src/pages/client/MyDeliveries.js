import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDeliveries, cancelDelivery } from '../../services/deliveryService';
import StatusBadge from '../../components/StatusBadge';
import { shortId, formatDate } from '../../utils/statusHelpers';
import './MyDeliveries.css';

const MyDeliveries = () => {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState('');
  const pendingCount = deliveries.filter((d) => d.status === 'Pending').length;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const res = await getMyDeliveries(searchName.trim());
      setDeliveries(res.data.data);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this delivery? This cannot be undone.')) return;
    setCancelLoading(id);
    try {
      await cancelDelivery(id);
      setDeliveries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: 'Cancelled' } : d))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel delivery.');
    } finally {
      setCancelLoading('');
    }
  };

  return (
    <div className="page-wrapper my-deliveries-page">
      <div className="myd-hero card">
        <div>
          <h1 className="page-title">My Deliveries</h1>
          <p className="page-subtitle">Enter your name, contact, or address to find your deliveries.</p>
        </div>
        <div className="myd-kpis">
          <div className="myd-kpi">
            <span className="myd-kpi-label">Results</span>
            <span className="myd-kpi-value">{deliveries.length}</span>
          </div>
          <div className="myd-kpi">
            <span className="myd-kpi-label">Pending</span>
            <span className="myd-kpi-value">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <form id="search-deliveries-form" onSubmit={handleSearch} className="search-bar card myd-search">
        <input
          id="search-name-input"
          type="text"
          className="form-input search-input"
          placeholder="Enter your name, contact number, or address..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button id="btn-search" type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
        <button
          id="btn-new-delivery"
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/client/new')}
        >
          + New Request
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Results */}
      {searched && (
        <>
          <div className="results-header">
            <span className="results-count">
              {deliveries.length} delivery{deliveries.length !== 1 ? 's' : ''} found for{' '}
              <strong>"{searchName}"</strong>
            </span>
          </div>

          {deliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No deliveries found for this search.</p>
              <p style={{ marginTop: 8, fontSize: '0.82rem' }}>
                Double-check your spelling or{' '}
                <button className="link-btn" onClick={() => navigate('/client/new')}>
                  create a new delivery
                </button>
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Order Details</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <span className="delivery-id-chip">{shortId(d._id)}</span>
                      </td>
                      <td>
                        <span className="order-detail-text">{d.orderDetails}</span>
                      </td>
                      <td>{d.address}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>{formatDate(d.deliveryDate || d.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            id={`btn-track-${d._id}`}
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/client/track/${d._id}`)}
                          >
                            📍 Track
                          </button>
                          {d.status === 'Pending' && (
                            <button
                              id={`btn-cancel-${d._id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancel(d._id)}
                              disabled={cancelLoading === d._id}
                            >
                              {cancelLoading === d._id ? '...' : '✕ Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="my-deliveries-hint">
          <div className="hint-icon">🔍</div>
          <p>Search by name to view your delivery history</p>
          <p style={{ marginTop: 8 }}>Or use your Delivery ID on the Track page directly</p>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;

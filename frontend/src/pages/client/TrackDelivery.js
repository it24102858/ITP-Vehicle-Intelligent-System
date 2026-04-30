import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeliveryById, cancelDelivery } from '../../services/deliveryService';
import StatusBadge from '../../components/StatusBadge';
import StatusTracker from '../../components/StatusTracker';
import { shortId, formatDate } from '../../utils/statusHelpers';
import './TrackDelivery.css';

const TrackDelivery = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [deliveryId, setDeliveryId] = useState(routeId || '');
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeId));
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadDelivery = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await getDeliveryById(id.trim());
      setDelivery(res.data.data);
    } catch (err) {
      setDelivery(null);
      setError(err.response?.data?.message || 'Unable to find delivery. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeId) {
      loadDelivery(routeId);
    }
  }, [routeId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadDelivery(deliveryId);
  };

  const handleCancel = async () => {
    if (!delivery || delivery.status !== 'Pending') return;
    if (!window.confirm('Cancel this pending delivery request?')) return;

    setCancelLoading(true);
    try {
      const res = await cancelDelivery(delivery._id);
      setDelivery(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel this delivery.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="page-wrapper track-page">
      <div className="track-hero card">
        <h1 className="page-title">Track Delivery</h1>
        <p className="page-subtitle">Track your current delivery status using the delivery ID.</p>

        <form onSubmit={handleSearch} className="track-search">
          <input
            type="text"
            className="form-input"
            placeholder="Enter full delivery ID"
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !deliveryId.trim()}>
            {loading ? 'Loading...' : 'Track'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/client/my-deliveries')}>
            My Deliveries
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {delivery && (
        <div className="track-content track-grid">
          <div className="track-main">
            <div className="card track-progress-card">
              <div className="track-header">
                <div className="track-header-left">
                  <span className="track-delivery-id">{shortId(delivery._id)}</span>
                  <StatusBadge status={delivery.status} />
                </div>
                {delivery.status === 'Pending' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleCancel}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Delivery'}
                  </button>
                )}
              </div>

              <div className="section-label">Progress</div>
              <StatusTracker status={delivery.status} />
            </div>

            <div className="card track-details-card">
              <div className="section-label">Delivery Information</div>
              <div className="detail-grid">
                <DetailItem label="Customer" value={delivery.customerName} />
                <DetailItem label="Contact" value={delivery.contactNumber} />
                <DetailItem label="Address" value={delivery.address} />
                <DetailItem label="Order Details" value={delivery.orderDetails} />
                <DetailItem label="Scheduled Date" value={formatDate(delivery.deliveryDate)} />
                <DetailItem label="Created" value={formatDate(delivery.createdAt)} />
                <DetailItem
                  label="Assigned Agent"
                  value={delivery.agentId || 'Not assigned yet'}
                  valueClassName={delivery.agentId ? 'agent-tag' : ''}
                />
                <DetailItem label="Status" value={delivery.status} />
              </div>
            </div>
          </div>

          <aside className="track-side">
            <div className="card track-side-card">
              <div className="section-label">Actions</div>
              <div className="track-side-actions">
                <button className="btn btn-primary" onClick={() => navigate('/client/new')}>
                  + New Delivery Request
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/client/my-deliveries')}>
                  Open My Deliveries
                </button>
              </div>
              <p className="track-tip">
                Need help? Share this ID with delivery management for faster support.
              </p>
            </div>
          </aside>
        </div>
      )}

      {!delivery && !error && !loading && (
        <div className="track-empty card">
          <div className="empty-icon">🛰️</div>
          <p>Enter a delivery ID to view live status and delivery details.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/client/new')}>
            Create New Request
          </button>
        </div>
      )}

      {delivery && (
        <div className="track-footer-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/client/new')}>
            + New Delivery Request
          </button>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, valueClassName = '' }) => (
  <div className="detail-item">
    <span className="detail-key">{label}</span>
    <span className={`detail-val ${valueClassName}`.trim()}>{value || '-'}</span>
  </div>
);

export default TrackDelivery;

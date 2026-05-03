import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDeliveryById,
  updateStatus,
  assignAgent,
  deleteDelivery,
} from '../../services/deliveryService';
import StatusTracker from '../../components/StatusTracker';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, shortId, getAllowedTransitions } from '../../utils/statusHelpers';
import './ManageDelivery.css';

const ManageDelivery = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Agent assign
  const [agentId, setAgentId] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMsg, setAgentMsg] = useState('');

  
  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDelivery();
    // eslint-disable-next-line
  }, [id]);

  const fetchDelivery = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDeliveryById(id);
      setDelivery(res.data.data);
      setAgentId(res.data.data.agentId || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Delivery not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setStatusLoading(true);
    setStatusMsg('');
    try {
      const res = await updateStatus(id, newStatus);
      setDelivery(res.data.data);
      setStatusMsg(`✅ Status updated to "${newStatus}"`);
      setNewStatus('');
    } catch (err) {
      setStatusMsg(`❌ ${err.response?.data?.message || 'Failed to update status.'}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!agentId.trim()) return;
    setAgentLoading(true);
    setAgentMsg('');
    try {
      const res = await assignAgent(id, agentId.trim());
      setDelivery(res.data.data);
      setAgentMsg(`✅ Agent "${agentId.trim()}" assigned successfully`);
    } catch (err) {
      setAgentMsg(`❌ ${err.response?.data?.message || 'Failed to assign agent.'}`);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDelivery(id);
      navigate('/admin/deliveries', { replace: true });
    } catch (err) {
      alert('Failed to delete.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading delivery...</span>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="page-wrapper">
        <div className="alert alert-error">{error || 'Delivery not found.'}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/deliveries')}>
          ← Back to All Deliveries
        </button>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions(delivery.status);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="section-header">
        <div className="manage-header-left">
          <button
            className="btn btn-secondary btn-sm back-btn"
            onClick={() => navigate('/admin/deliveries')}
          >
            ←
          </button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              Manage Delivery {shortId(delivery._id)}
            </h1>
            <StatusBadge status={delivery.status} />
          </div>
        </div>
        <button
          id="btn-delete-delivery"
          className="btn btn-danger"
          onClick={() => setShowDeleteModal(true)}
        >
          🗑️ Delete
        </button>
      </div>

      <div className="manage-grid">
        {/* Left column — details + tracker */}
        <div className="manage-left">
          {/* Progress */}
          <div className="card">
            <h2 className="manage-section-title">Delivery Progress</h2>
            <StatusTracker status={delivery.status} />
          </div>

          {/* Details */}
          <div className="card">
            <h2 className="manage-section-title">Delivery Information</h2>
            <div className="info-grid">
              <InfoRow label="Customer" value={delivery.customerName} />
              <InfoRow label="Contact" value={delivery.contactNumber} />
              <InfoRow label="Address" value={delivery.address} />
              <InfoRow label="Order Details" value={delivery.orderDetails} />
              <InfoRow label="Scheduled Date" value={formatDate(delivery.deliveryDate)} />
              <InfoRow label="Created" value={formatDate(delivery.createdAt)} />
              <InfoRow
                label="Agent"
                value={delivery.agentId || 'Not assigned'}
                valueStyle={{ color: delivery.agentId ? '#4a90e2' : '#606060' }}
              />
            </div>
          </div>
        </div>

        {/* Right column — controls */}
        <div className="manage-right">
          {/* Update Status */}
          <div className="card control-card">
            <h2 className="manage-section-title">Update Status</h2>

            {allowedTransitions.length === 0 ? (
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                {delivery.status === 'Delivered'
                  ? '✅ This delivery is completed.'
                  : '❌ This delivery is cancelled. No further updates possible.'}
              </div>
            ) : (
              <>
                <p className="control-hint">
                  Current: <StatusBadge status={delivery.status} size="sm" />
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="status-select">Change To</label>
                  <select
                    id="status-select"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">— Select new status —</option>
                    {allowedTransitions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {statusMsg && (
                  <div className={`alert ${statusMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                    {statusMsg}
                  </div>
                )}
                <button
                  id="btn-update-status"
                  className="btn btn-primary"
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || statusLoading}
                  style={{ width: '100%' }}
                >
                  {statusLoading ? 'Updating...' : 'Update Status'}
                </button>
              </>
            )}
          </div>

          {/* Assign Agent */}
          <div className="card control-card">
            <h2 className="manage-section-title">Assign Delivery Agent</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="agent-input">Agent ID</label>
              <input
                id="agent-input"
                type="text"
                className="form-input"
                placeholder="e.g. A001, A002..."
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>
            {agentMsg && (
              <div className={`alert ${agentMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                {agentMsg}
              </div>
            )}
            <button
              id="btn-assign-agent"
              className="btn btn-primary"
              onClick={handleAssignAgent}
              disabled={!agentId.trim() || agentLoading}
              style={{ width: '100%' }}
            >
              {agentLoading ? 'Assigning...' : '👤 Assign Agent'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ Delete Delivery?</h3>
            <p>
              Permanently delete delivery <strong>{shortId(delivery._id)}</strong> for{' '}
              <strong>{delivery.customerName}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                className="btn btn-danger"
                onClick={handleDelete}
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

const InfoRow = ({ label, value, valueStyle }) => (
  <div className="info-row">
    <span className="info-key">{label}</span>
    <span className="info-val" style={valueStyle}>{value || '—'}</span>
  </div>
);

export default ManageDelivery;

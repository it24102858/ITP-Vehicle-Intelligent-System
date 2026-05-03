import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDelivery } from '../../services/deliveryService';
import { shortId } from '../../utils/statusHelpers';
import './NewDelivery.css';

const INITIAL_FORM = {
  customerName: '',
  contactNumber: '',
  address: '',
  orderDetails: '',
  deliveryDate: '',
};

const NewDelivery = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createDelivery(form);
      setSuccessData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  
  if (successData) {
    return (
      <div className="page-wrapper new-delivery-page">
        <div className="newd-success card">
          <div className="newd-success-pill">Request Submitted</div>
          <h1 className="page-title">Delivery Request Created</h1>
          <p className="page-subtitle">Keep this ID safe so you can track your delivery.</p>

          <div className="newd-id-box">
            <span className="newd-id-label">Delivery ID</span>
            <span id="new-delivery-id" className="newd-id-full">{successData._id}</span>
            <span className="newd-id-short">{shortId(successData._id)}</span>
          </div>

          <div className="newd-success-grid">
            <div className="newd-success-item">
              <span>Customer</span>
              <strong>{successData.customerName}</strong>
            </div>
            <div className="newd-success-item">
              <span>Address</span>
              <strong>{successData.address}</strong>
            </div>
            <div className="newd-success-item">
              <span>Status</span>
              <strong className="status-pending">Pending</strong>
            </div>
          </div>

          <div className="newd-actions">
            <button
              id="btn-track-new"
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/client/track/${successData._id}`)}
            >
              Track Delivery
            </button>
            <button
              id="btn-new-another"
              className="btn btn-secondary btn-lg"
              onClick={() => {
                setSuccessData(null);
                setForm(INITIAL_FORM);
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper new-delivery-page">
      <div className="newd-shell">
        <section className="newd-header">
          <span className="newd-eyebrow">Delivery Service</span>
          <h1 className="page-title">New Delivery Request</h1>
          <p className="page-subtitle">Complete the form below to create a request for delivery management.</p>
        </section>

        <section className="card newd-form-card">
          {error && <div className="alert alert-error">{error}</div>}

          <form id="new-delivery-form" onSubmit={handleSubmit} className="newd-form">
            <div className="newd-row two">
              <div className="form-group">
                <label className="form-label" htmlFor="customerName">Full Name</label>
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Nethmi Perera"
                  value={form.customerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactNumber">Contact Number</label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 077 123 4567"
                  value={form.contactNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Delivery Address</label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-input"
                placeholder="e.g. No. 45, Galle Road, Colombo 03"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="orderDetails">Order / Vehicle Details</label>
              <textarea
                id="orderDetails"
                name="orderDetails"
                className="form-textarea"
                placeholder="Describe what should be delivered and any special handling notes"
                value={form.orderDetails}
                onChange={handleChange}
                required
              />
            </div>

            <div className="newd-row">
              <div className="form-group newd-date">
                <label className="form-label" htmlFor="deliveryDate">Preferred Delivery Date <span className="optional">(Optional)</span></label>
                <input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="date"
                  className="form-input"
                  value={form.deliveryDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="newd-actions">
              <button
                id="btn-submit-delivery"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Delivery Request'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/client/my-deliveries')}
              >
                View My Deliveries
              </button>
            </div>
          </form>
        </section>

        <section className="newd-info-grid">
          <div className="card newd-info-card">
            <h3>Fast Processing</h3>
            <p>Use accurate contact details for quicker assignment and delivery confirmation.</p>
          </div>
          <div className="card newd-info-card">
            <h3>Clear Address</h3>
            <p>Add landmarks and gate instructions to reduce delays and failed attempts.</p>
          </div>
          <div className="card newd-info-card">
            <h3>Track Anytime</h3>
            <p>After submission, use your delivery ID to monitor status updates in real time.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NewDelivery;

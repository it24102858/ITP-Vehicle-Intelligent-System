import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API from '../utils/api';
const formatLKR = (amount) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

// â”€â”€ CONSTANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLE_META = {
  service_provider:    { label: 'Service Provider',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '🔧' },
  delivery_management: { label: 'Delivery Management', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🚚' },
  inspection:          { label: 'Inspection',          color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🔍' },
  insurance:           { label: 'Insurance',           color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: '🛡️' },
  order_management:    { label: 'Order Management',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '📦' },
};

const SERVICE_ROLE_META = {
  service_provider:    { label: 'Service Provider',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '🔧', desc: 'Manages vehicle maintenance and repair services' },
  delivery_management: { label: 'Delivery Management', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🚚', desc: 'Handles vehicle transport and delivery logistics' },
  insurance:           { label: 'Insurance',           color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: '🛡️', desc: 'Manages vehicle insurance and coverage plans' },
};

const SERVICE_ROLE_DASHBOARD_PATH = {
  service_provider: '/provider-dashboard',
  delivery_management: '/admin/dashboard',
  insurance: '/provider-dashboard'
};

const TABS = [
  { id: 'overview',      label: 'Overview',          icon: '◦' },
  { id: 'buyers',        label: 'Buyers',            icon: '🛒' },
  { id: 'sellers',       label: 'Sellers',           icon: '🏪' },
  { id: 'service_roles', label: 'Service Roles',     icon: '⚙️' },
  { id: 'vehicles',      label: 'Vehicles',          icon: '🚗' },
];

// â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Spinner({ size = 36 }) {
  return <div style={{ width: size, height: size, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}

function Avatar({ name = '?', size = 36, color = 'var(--accent)' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: color + '22', border: '1px solid ' + color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700, fontSize: size * 0.4 }}>
      {String(name)[0]?.toUpperCase()}
    </div>
  );
}

function Badge({ type, children }) {
  const map = {
    buyer:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
    seller:  { bg: 'rgba(212,168,67,0.15)',  color: '#d4a843' },
    admin:   { bg: 'rgba(232,64,28,0.15)',   color: '#e8401c' },
    active:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    inactive:{ bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    available:{ bg:'rgba(34,197,94,0.15)',   color: '#22c55e' },
    sold:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    pending: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    top_rated: { bg: 'rgba(250,204,21,0.2)', color: '#facc15' },
    local:   { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
    import:  { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
    service_provider:    { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    delivery_management: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    insurance:           { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899' },
    inspection:          { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
    order_management:    { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  };
  const style = map[type] || { bg: 'rgba(255,255,255,0.1)', color: '#aaa' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: style.bg, color: style.color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function StarRating({ rating = 0, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#2a2a35' }}>★</span>
      ))}
    </span>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 12 }}>Confirm Action</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function VehicleDeleteReasonModal({ vehicle, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    setLoading(true);
    await onConfirm(reason.trim());
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">REMOVE VEHICLE</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>
          Removing <strong style={{ color: 'var(--text-primary)' }}>{vehicle.title}</strong> will notify the seller with your reason.
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Explain why this listing is being removed..."
              style={{ minHeight: 100 }}
            />
            {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {error}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Removing...' : 'Remove & Notify Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehicleViewModal({ vehicle, onClose }) {
  const images = Array.isArray(vehicle?.images) ? vehicle.images.filter(Boolean) : [];
  const [idx, setIdx] = useState(0);
  const seller = vehicle?.seller || {};

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '94vw', maxWidth: 1120 }}>
        <div className="modal-header">
          <h2 className="modal-title">VEHICLE REVIEW CARD</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--bg-card)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr'
          }}
        >
          <div style={{ borderRight: '1px solid var(--border)', padding: 12 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              {images.length ? (
                <img src={images[idx]} alt={vehicle.title || 'Vehicle'} style={{ width: '100%', height: 300, objectFit: 'cover' }} />
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No image uploaded
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8, marginTop: 10 }}>
                {images.slice(0, 12).map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setIdx(i)}
                    style={{
                      padding: 0,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: i === idx ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      aspectRatio: '1 / 1'
                    }}
                  >
                    <img src={img} alt={'Vehicle ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 25, color: 'var(--text-primary)' }}>
                {vehicle.make} {vehicle.model} {vehicle.year}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{vehicle.title || '-'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--accent)', marginTop: 8 }}>{formatLKR(vehicle.price)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge type={vehicle.status}>{vehicle.status}</Badge>
                <Badge type={vehicle.vehicleType || 'local'}>{vehicle.vehicleType || 'local'}</Badge>
                <Badge type={vehicle.condition || 'available'}>{vehicle.condition || 'used'}</Badge>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--bg-elevated)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Listing Specs
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Fuel:</strong> {vehicle.fuelType || '-'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Transmission:</strong> {vehicle.transmission || '-'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Kilometers:</strong> {(vehicle.mileage || 0).toLocaleString()} km</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Listed:</strong> {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : '-'}</div>
              </div>
            </div>

            {vehicle.description && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--bg-elevated)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Description:</strong> {vehicle.description}
              </div>
            )}

            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--bg-elevated)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Seller Account
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{seller.name || '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seller.email || '-'}</div>
              {seller.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seller.phone}</div>}
              {seller?.sellerRating > 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StarRating rating={seller.sellerRating} size={12} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{seller.sellerRating}</span>
                  {seller.isTopRatedSeller && <Badge type="top_rated">Top Rated</Badge>}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ CREATE SERVICE USER MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SellerRatingModal({ seller, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [buyerFeedbacks, setBuyerFeedbacks] = useState([]);

  useEffect(() => {
    const load = async () => {
      setFeedbackLoading(true);
      try {
        let list = [];
        try {
          const res = await API.get('/admin/sellers/' + seller._id + '/buyer-feedback');
          list = res.data.feedbacks || [];
        } catch (err) {
          if (err.response?.status !== 404) throw err;
          const fallback = await API.get('/admin/sellers/' + seller._id + '/feedback');
          list = (fallback.data.feedbacks || []).filter((f) => (f.source === 'buyer' || f.buyerId?.role === 'buyer'));
        }
        setBuyerFeedbacks(list);
      } catch {
        setBuyerFeedbacks([]);
      } finally {
        setFeedbackLoading(false);
      }
    };
    load();
  }, [seller._id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a star rating');
    setLoading(true);
    try {
      try {
        await API.post('/admin/sellers/' + seller._id + '/admin-feedback', { rating, comment });
      } catch (err) {
        if (err.response?.status !== 404) throw err;
        await API.post('/admin/sellers/' + seller._id + '/rate', { rating, comment });
      }
      toast.success('Seller rated successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">RATE SELLER</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
          {seller.name} ({seller.email})
        </p>
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Buyer Feedback Reference
          </div>
          {feedbackLoading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading buyer feedback...</div>
          ) : buyerFeedbacks.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No buyer feedback yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 140, overflowY: 'auto' }}>
              {buyerFeedbacks.slice(0, 10).map((f, idx) => (
                <div key={f._id || f.createdAt || idx} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{f.buyerId?.name || 'Buyer'}</strong>
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>{'★'.repeat(Number(f.rating || 0))}{'☆'.repeat(5 - Number(f.rating || 0))}</span>
                  </div>
                  {f.comment && <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-secondary)' }}>{f.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Star Rating *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  style={{ fontSize: 32, border: 'none', background: 'transparent', color: i <= (hover || rating) ? '#f59e0b' : '#30303a', cursor: 'pointer' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional note..." style={{ minHeight: 90 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Submit Rating'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
function ServiceUserModal({ role, onClose, onSuccess }) {
  const meta = SERVICE_ROLE_META[role];
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await API.post('/admin/service-users', { ...form, role });
      toast.success(meta.label + ' user created!');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{meta.icon}</div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 18, marginBottom: 2 }}>CREATE {meta.label.toUpperCase()} USER</h2>
              <div style={{ fontSize: 12, color: meta.color }}>{meta.desc}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 18, fontSize: 12, color: '#fbbf24' }}>
          ⚠ Only one {meta.label} user is allowed. This user will access the admin portal with their own role-restricted dashboard.
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="John Anderson" style={{ borderColor: errors.name ? '#ef4444' : undefined }} />
              {errors.name && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="user@email.com" style={{ borderColor: errors.email ? '#ef4444' : undefined }} />
              {errors.email && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 6 characters" style={{ borderColor: errors.password ? '#ef4444' : undefined }} />
              {errors.password && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>⚠ {errors.password}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: meta.color }}>
              {loading ? 'Creating...' : '+ Create ' + meta.label + ' User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// â”€â”€ COMPANY MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CompanyModal({ company, onClose, onSuccess }) {
  const isEdit = !!company;
  const [section, setSection] = useState('basic');
  const [loading, setLoading] = useState(false);
  const blank = { name: '', type: 'service_provider', email: '', phone: '', website: '', address: '', city: '', state: '', country: '', zipCode: '', ownerName: '', ownerPhone: '', ownerEmail: '', registrationNumber: '', licenseNumber: '', taxId: '', establishedYear: '', employeeCount: '', description: '', serviceAreas: '', operatingHours: '', specializations: '' };
  const [form, setForm] = useState(company ? { ...blank, ...company } : blank);
  const set = (field) => ({ value: form[field] || '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });
  const meta = ROLE_META[form.type] || ROLE_META.service_provider;
  const sections = [{ id: 'basic', label: 'Basic' }, { id: 'contact', label: 'Contact' }, { id: 'owner', label: 'Owner' }, { id: 'business', label: 'Business' }, { id: 'service', label: 'Services' }];

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (isEdit) { await API.put('/admin/companies/' + company._id, form); toast.success('Company updated!'); }
      else { await API.post('/admin/companies', form); toast.success('Company created!'); }
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{meta.icon}</div>
            <div><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{isEdit ? 'EDIT COMPANY' : 'NEW COMPANY'}</h2><div style={{ fontSize: 12, color: meta.color }}>{meta.label}</div></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
          {sections.map(s => <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', background: section === s.id ? 'var(--accent)' : 'var(--bg-elevated)', borderColor: section === s.id ? 'var(--accent)' : 'var(--border)', color: section === s.id ? '#fff' : 'var(--text-secondary)' }}>{s.label}</button>)}
        </div>
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {section === 'basic' && <>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Company Name *</label><input className="form-input" {...set('name')} required /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Role Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {Object.entries(ROLE_META).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Description</label><textarea className="form-textarea" {...set('description')} style={{ minHeight: 80 }} /></div>
            </>}
            {section === 'contact' && <>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Email *</label><input className="form-input" type="email" {...set('email')} required /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" {...set('phone')} /></div>
              <div className="form-group"><label className="form-label">Website</label><input className="form-input" {...set('website')} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><input className="form-input" {...set('address')} /></div>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" {...set('city')} /></div>
              <div className="form-group"><label className="form-label">State</label><input className="form-input" {...set('state')} /></div>
              <div className="form-group"><label className="form-label">Country</label><input className="form-input" {...set('country')} /></div>
              <div className="form-group"><label className="form-label">ZIP Code</label><input className="form-input" {...set('zipCode')} /></div>
            </>}
            {section === 'owner' && <>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Owner Name</label><input className="form-input" {...set('ownerName')} /></div>
              <div className="form-group"><label className="form-label">Owner Phone</label><input className="form-input" {...set('ownerPhone')} /></div>
              <div className="form-group"><label className="form-label">Owner Email</label><input className="form-input" type="email" {...set('ownerEmail')} /></div>
            </>}
            {section === 'business' && <>
              <div className="form-group"><label className="form-label">Reg. Number</label><input className="form-input" {...set('registrationNumber')} /></div>
              <div className="form-group"><label className="form-label">License</label><input className="form-input" {...set('licenseNumber')} /></div>
              <div className="form-group"><label className="form-label">Tax ID</label><input className="form-input" {...set('taxId')} /></div>
              <div className="form-group"><label className="form-label">Est. Year</label><input className="form-input" type="number" {...set('establishedYear')} /></div>
              <div className="form-group"><label className="form-label">Employees</label><input className="form-input" type="number" {...set('employeeCount')} /></div>
            </>}
            {section === 'service' && <>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Service Areas</label><input className="form-input" {...set('serviceAreas')} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Operating Hours</label><input className="form-input" {...set('operatingHours')} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Specializations</label><textarea className="form-textarea" {...set('specializations')} style={{ minHeight: 80 }} /></div>
            </>}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Company'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ OVERVIEW TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OverviewTab({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    API.get('/admin/stats').then(r => setData(r.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={48} /></div>;
  const stats = data?.stats || {};
  const serviceUsers = data?.serviceRoleUsers || [];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Users',  value: stats.totalUsers,    color: 'var(--accent)' },
          { label: 'Buyers',       value: stats.buyers,        color: '#3b82f6', tab: 'buyers' },
          { label: 'Sellers',      value: stats.sellers,       color: '#d4a843', tab: 'sellers' },
          { label: 'Vehicles',     value: stats.totalVehicles, color: '#22c55e', tab: 'vehicles' },
        ].map(item => (
          <div key={item.label} onClick={() => item.tab && onNavigate(item.tab)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '3px solid ' + item.color, borderRadius: 'var(--radius-lg)', padding: '18px 20px', cursor: item.tab ? 'pointer' : 'default' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: item.color, lineHeight: 1 }}>{item.value ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Service Role Users Status */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>SERVICE ROLE USERS</div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('service_roles')}>Manage →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(SERVICE_ROLE_META).map(([key, { label, icon, color, bg }]) => {
            const user = serviceUsers.find(u => u.role === key);
            return (
              <div key={key} style={{ padding: '14px 16px', background: bg, border: '1px solid ' + color + '33', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                </div>
                {user ? (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                    <Badge type="active">Active</Badge>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>No user assigned</div>
                    <button className="btn btn-sm" style={{ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }} onClick={() => onNavigate('service_roles')}>
                      + Create User
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: '0.05em' }}>RECENT USERS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.recentUsers || []).map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={u.name} size={32} color={u.role === 'buyer' ? '#3b82f6' : '#d4a843'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{u.email}</div>
                </div>
                <Badge type={u.role}>{u.role}</Badge>
              </div>
            ))}
            {(data?.recentUsers || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ USERS TAB (buyers/sellers) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UsersTab({ roleFilter }) {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [rateSeller, setRateSeller] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [feedbackSeller, setFeedbackSeller] = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: roleFilter, page, limit: 15 });
      if (search) params.append('search', search);
      const res = await API.get('/admin/users?' + params);
      setUsers(res.data.users); setTotalPages(res.data.pages); setTotal(res.data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = async (id) => {
    try { await API.delete('/admin/users/' + id); toast.success('Deleted'); setConfirmDel(null); fetchUsers(); }
    catch { toast.error('Failed'); }
  };
  const setTopRatedBadge = async (user, grant) => {
    try {
      try {
        await API.patch('/admin/sellers/' + user._id + '/top-rated', { grant });
      } catch (err) {
        if (err.response?.status !== 404) throw err;
        await API.post('/admin/sellers/' + user._id + '/top-rated', { grant });
      }
      toast.success(grant ? 'Top Rated badge granted' : 'Top Rated badge removed');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const viewSellerFeedback = async (seller) => {
    try {
      const res = await API.get('/admin/sellers/' + seller._id + '/feedback');
      const list = res.data.feedbacks || [];
      setFeedbackSeller({ seller, list });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load feedback');
    }
  };

  const roleColor = roleFilter === 'buyer' ? '#3b82f6' : '#d4a843';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '0.04em' }}>{roleFilter === 'buyer' ? 'BUYERS' : 'SELLERS'}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total</div>
        </div>
        <input className="form-input" placeholder={'Search ' + roleFilter + 's...'} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div> : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th><th>Email</th><th>Phone</th>
                    {roleFilter === 'seller' && <th>Rating</th>}
                    <th>Status</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0
                    ? <tr><td colSpan={roleFilter === 'seller' ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No {roleFilter}s found</td></tr>
                    : users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={u.name} size={34} color={roleColor} />
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{u.email}</td>
                        <td style={{ fontSize: 13 }}>{u.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        {roleFilter === 'seller' && (
                          <td>
                            {u.sellerRating > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <StarRating rating={u.sellerRating} size={13} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  Buyer Avg: {u.sellerRating} ({u.sellerReviewCount})
                                </span>
                                {u.isTopRatedSeller && <Badge type="top_rated">Top Rated</Badge>}
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No buyer rating yet</span>}
                          </td>
                        )}
                        <td><Badge type={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {roleFilter === 'seller' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#f59e0b', opacity: (u.sellerReviewCount || 0) > 0 ? 1 : 0.5 }}
                                onClick={() => setRateSeller(u)}
                                disabled={(u.sellerReviewCount || 0) === 0}
                                title={(u.sellerReviewCount || 0) === 0 ? 'No buyer feedback yet' : 'Rate seller'}
                              >
                                Rate
                              </button>
                            )}
                            {roleFilter === 'seller' && (
                              <button className="btn btn-ghost btn-sm" style={{ color: '#3b82f6' }} onClick={() => viewSellerFeedback(u)}>Feedback</button>
                            )}
                            {roleFilter === 'seller' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: u.isTopRatedSeller ? '#f59e0b' : '#22c55e' }}
                                onClick={() => setTopRatedBadge(u, !u.isTopRatedSeller)}
                              >
                                {u.isTopRatedSeller ? 'Remove Badge' : 'Give Badge'}
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setConfirmDel(u)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {rateSeller && <SellerRatingModal seller={rateSeller} onClose={() => setRateSeller(null)} onSuccess={() => { setRateSeller(null); fetchUsers(); }} />}
      {confirmDel  && <ConfirmDialog message={'Delete ' + confirmDel.name + '?'} onConfirm={() => deleteUser(confirmDel._id)} onCancel={() => setConfirmDel(null)} />}
      {feedbackSeller && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2 className="modal-title">SELLER FEEDBACK</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setFeedbackSeller(null)}>×</button>
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 10, fontSize: 13 }}>
              {feedbackSeller.seller.name} ({feedbackSeller.seller.email})
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#60a5fa' }}>
                Buyer feedback: {feedbackSeller.list.filter(f => f.source === 'buyer' || f.buyerId?.role === 'buyer').length}
              </span>
              <span style={{ fontSize: 11, color: '#ef4444' }}>
                Admin feedback: {feedbackSeller.list.filter(f => f.source === 'admin' || f.buyerId?.role === 'admin').length}
              </span>
            </div>
            {feedbackSeller.list.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No feedback available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>BUYER FEEDBACK</div>
                {(feedbackSeller.list.filter(f => f.source === 'buyer' || f.buyerId?.role === 'buyer')).map((f, idx) => (
                  <div key={f._id || f.createdAt || idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
                        {f.buyerId?.name || 'Buyer'} {f.buyerId?.email ? `(${f.buyerId.email})` : ''}
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 10,
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          background: (f.source === 'admin' || f.buyerId?.role === 'admin') ? 'rgba(239,68,68,0.16)' : 'rgba(59,130,246,0.16)',
                          color: (f.source === 'admin' || f.buyerId?.role === 'admin') ? '#ef4444' : '#60a5fa'
                        }}>
                          {(f.source === 'admin' || f.buyerId?.role === 'admin') ? 'Admin' : 'Buyer'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#f59e0b' }}>
                        {'★'.repeat(Number(f.rating || 0))}
                        {'☆'.repeat(5 - Number(f.rating || 0))}
                      </div>
                    </div>
                    {f.comment && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.comment}</div>}
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginTop: 4 }}>ADMIN FEEDBACK</div>
                {(feedbackSeller.list.filter(f => f.source === 'admin' || f.buyerId?.role === 'admin')).length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No admin feedback yet.</div>
                ) : (feedbackSeller.list.filter(f => f.source === 'admin' || f.buyerId?.role === 'admin')).map((f, idx) => (
                  <div key={(f._id || f.createdAt || idx) + '-admin'} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
                        {f.buyerId?.name || 'Admin'} {f.buyerId?.email ? `(${f.buyerId.email})` : ''}
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 10,
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          background: 'rgba(239,68,68,0.16)',
                          color: '#ef4444'
                        }}>
                          Admin
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#f59e0b' }}>
                        {'★'.repeat(Number(f.rating || 0))}
                        {'☆'.repeat(5 - Number(f.rating || 0))}
                      </div>
                    </div>
                    {f.comment && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.comment}</div>}
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ SERVICE ROLES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ServiceRolesTab() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [createRole, setCreateRole]   = useState(null);
  const [confirmDel, setConfirmDel]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/service-users');
      setUsers(res.data.users);
    } catch { toast.error('Failed to load service users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deleteUser = async (id) => {
    try { await API.delete('/admin/service-users/' + id); toast.success('Deleted'); setConfirmDel(null); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '0.04em', marginBottom: 6 }}>SERVICE ROLE USERS</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create one user per service role. These users can log into the admin portal and access their own role-specific dashboard.</p>
      </div>

      {/* Role cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 32 }}>
        {Object.entries(SERVICE_ROLE_META).map(([key, { label, icon, color, bg, desc }]) => {
          const assigned = users.find(u => u.role === key);
          return (
            <div key={key} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid ' + color, borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              </div>

              {assigned ? (
                <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={assigned.name} size={36} color={color} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{assigned.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assigned.email}</div>
                        {assigned.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assigned.phone}</div>}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', flexShrink: 0 }} onClick={() => setConfirmDel(assigned)}>Delete</button>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge type="active">Active</Badge>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Joined {new Date(assigned.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginTop: 8, padding: '8px 10px', background: color + '11', borderRadius: 6, fontSize: 11, color }}>
                    ℹ This user can log in from the main login page and access the {label} dashboard ({SERVICE_ROLE_DASHBOARD_PATH[key]})
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>No user assigned to this role</div>
                  <button className="btn btn-sm" style={{ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                    onClick={() => setCreateRole(key)}>
                    {icon} Create {label} User
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {createRole && (
        <ServiceUserModal role={createRole} onClose={() => setCreateRole(null)} onSuccess={() => { setCreateRole(null); fetchUsers(); }} />
      )}
      {confirmDel && (
        <ConfirmDialog message={'Delete ' + confirmDel.name + ' (' + confirmDel.role + ')? They will lose access.'} onConfirm={() => deleteUser(confirmDel._id)} onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  );
}

// â”€â”€ COMPANIES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CompaniesTab() {
  const [companies, setCompanies]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editCo, setEditCo]         = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [total, setTotal]           = useState(0);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (search) params.append('search', search);
      const res = await API.get('/admin/companies?' + params);
      setCompanies(res.data.companies); setTotal(res.data.total);
    } catch { toast.error('Failed to load companies'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const deleteCo = async (id) => {
    try { await API.delete('/admin/companies/' + id); toast.success('Deleted'); setConfirmDel(null); fetchCompanies(); }
    catch { toast.error('Failed'); }
  };
  const toggleCo = async (c) => {
    try { await API.patch('/admin/companies/' + c._id + '/toggle'); toast.success('Updated'); fetchCompanies(); }
    catch { toast.error('Failed'); }
  };
  const handleSuccess = () => { setShowModal(false); setEditCo(null); fetchCompanies(); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>COMPANIES</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Types</option>
            {Object.entries(ROLE_META).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={48} /></div> :
        companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
            <p style={{ marginBottom: 16 }}>No companies available</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {companies.map(c => {
              const m = ROLE_META[c.type] || ROLE_META.service_provider;
              return (
                <div key={c._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid ' + m.color, borderRadius: 'var(--radius-lg)', padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ display: 'flex', gap: 6 }}><Badge type={c.type}>{m.label}</Badge><Badge type={c.isActive ? 'active' : 'inactive'}>{c.isActive ? 'Active' : 'Off'}</Badge></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditCo(c); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setConfirmDel(c)}>Del</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{c.email}</div>
                  {c.city && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {[c.city, c.state, c.country].filter(Boolean).join(', ')}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {c.createdBy?.name}</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => toggleCo(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {showModal && <CompanyModal company={editCo} onClose={() => { setShowModal(false); setEditCo(null); }} onSuccess={handleSuccess} />}
      {confirmDel && <ConfirmDialog message={'Delete company ' + confirmDel.name + '?'} onConfirm={() => deleteCo(confirmDel._id)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

// â”€â”€ VEHICLES TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VehiclesTab() {
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typeFilter, setType]       = useState('');
  const [viewVehicle, setViewVehicle] = useState(null);
  const [deleteModalVehicle, setDeleteModalVehicle] = useState(null);
  const [total, setTotal]           = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('vehicleType', typeFilter);
      const res = await API.get('/admin/vehicles?' + params);
      setVehicles(res.data.vehicles); setTotal(res.data.total);
    } catch { toast.error('Failed to load vehicles'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const deleteVehicle = async (id, reason) => {
    try {
      await API.delete('/admin/vehicles/' + id, { data: { reason } });
      toast.success('Removed and seller notified');
      setDeleteModalVehicle(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>ALL VEHICLES</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total listings</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <select className="form-select" value={typeFilter} onChange={e => setType(e.target.value)} style={{ width: 140 }}>
            <option value="">All Types</option>
            <option value="local">Local</option>
            <option value="import">Import</option>
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Seller</th><th>Price</th><th>Details</th><th>Status</th><th>Listed</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vehicles.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No vehicles found</td></tr>
                  : vehicles.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{v.make} {v.model} {v.year}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v.title}</div>
                      </td>
                      <td><Badge type={v.vehicleType || 'local'}>{v.vehicleType || 'local'}</Badge></td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v.seller?.name}</div>
                        {v.seller?.sellerRating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StarRating rating={v.seller.sellerRating} size={11} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.seller.sellerRating}</span>
                            {v.seller?.isTopRatedSeller && <Badge type="top_rated">Top Rated</Badge>}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)' }}>{formatLKR(v.price)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div>{v.fuelType} | {v.transmission}</div>
                        <div>{v.mileage?.toLocaleString()} km | {v.condition}</div>
                      </td>
                      <td><Badge type={v.status}>{v.status}</Badge></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewVehicle(v)}>View</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setDeleteModalVehicle(v)}>Del</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewVehicle && (
        <VehicleViewModal vehicle={viewVehicle} onClose={() => setViewVehicle(null)} />
      )}
      {deleteModalVehicle && (
        <VehicleDeleteReasonModal
          vehicle={deleteModalVehicle}
          onClose={() => setDeleteModalVehicle(null)}
          onConfirm={(reason) => deleteVehicle(deleteModalVehicle._id, reason)}
        />
      )}
    </div>
  );
}

// â”€â”€ MAIN ADMIN DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    localStorage.removeItem('vtoken');
    localStorage.removeItem('vuser');
    window.location.replace('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 252, flexShrink: 0, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 8 }}>VEHICLE INTELLIGENT</div>
          <div style={{ display: 'inline-flex', padding: '3px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)' }}>ADMIN PANEL</div>
        </div>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginBottom: 8 }}>{user.name[0]}</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{user.email}</div>
          <Badge type="admin">Administrator</Badge>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, width: '100%', textAlign: 'left', position: 'relative', transition: 'all 0.15s', background: activeTab === tab.id ? 'var(--accent-dim)' : 'transparent', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, background: 'var(--accent)', borderRadius: '2px 0 0 2px' }} />}
            </button>
          ))}
        </nav>
        <div style={{ padding: 12 }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
            → Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Admin Dashboard</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '0.05em' }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>System Online</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '28px 32px' }}>
          {activeTab === 'overview'      && <OverviewTab onNavigate={setActiveTab} />}
          {activeTab === 'buyers'        && <UsersTab roleFilter="buyer" />}
          {activeTab === 'sellers'       && <UsersTab roleFilter="seller" />}
          {activeTab === 'service_roles' && <ServiceRolesTab />}
          {activeTab === 'vehicles'      && <VehiclesTab />}
        </div>
      </main>
    </div>
  );
}






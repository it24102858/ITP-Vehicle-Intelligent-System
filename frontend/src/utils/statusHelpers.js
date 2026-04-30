// Status progression order
export const STATUS_ORDER = ['Pending', 'Assigned', 'Shipped', 'Delivered'];

// Status colors mapped to CSS variable names
export const STATUS_COLORS = {
  Pending: '#f5a623',
  Assigned: '#4a90e2',
  Shipped: '#9b59b6',
  Delivered: '#27ae60',
  Cancelled: '#e74c3c',
};

// Status background colors (light tint)
export const STATUS_BG = {
  Pending: 'rgba(245, 166, 35, 0.12)',
  Assigned: 'rgba(74, 144, 226, 0.12)',
  Shipped: 'rgba(155, 89, 182, 0.12)',
  Delivered: 'rgba(39, 174, 96, 0.12)',
  Cancelled: 'rgba(231, 76, 60, 0.12)',
};

// Status icons (emoji)
export const STATUS_ICONS = {
  Pending: '⏳',
  Assigned: '👤',
  Shipped: '🚚',
  Delivered: '✅',
  Cancelled: '❌',
};

// Get which status comes next
export const getNextStatus = (currentStatus) => {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
};

// Get all valid next statuses (next step OR cancel)
export const getAllowedTransitions = (currentStatus) => {
  if (currentStatus === 'Cancelled' || currentStatus === 'Delivered') return [];
  const next = getNextStatus(currentStatus);
  const options = [];
  if (next) options.push(next);
  options.push('Cancelled');
  return options;
};

// Format date nicely
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format short ID for display
export const shortId = (id) => {
  if (!id) return '—';
  return `#${id.slice(-6).toUpperCase()}`;
};

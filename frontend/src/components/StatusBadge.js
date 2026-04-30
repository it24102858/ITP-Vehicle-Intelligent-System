import React from 'react';
import { STATUS_COLORS, STATUS_BG, STATUS_ICONS } from '../utils/statusHelpers';

const StatusBadge = ({ status, size = 'md' }) => {
  const color = STATUS_COLORS[status] || '#909090';
  const bg = STATUS_BG[status] || 'rgba(144,144,144,0.1)';
  const icon = STATUS_ICONS[status] || '•';

  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'sm' ? '4px' : '6px',
    padding: size === 'sm' ? '3px 10px' : '5px 13px',
    borderRadius: '100px',
    fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color,
    background: bg,
    border: `1px solid ${color}33`,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={styles}>
      <span style={{ fontSize: size === 'sm' ? '0.7rem' : '0.85rem' }}>{icon}</span>
      {status}
    </span>
  );
};

export default StatusBadge;

import React from 'react';
import { STATUS_ORDER, STATUS_COLORS, STATUS_ICONS } from '../utils/statusHelpers';
import './StatusTracker.css';

const StatusTracker = ({ status }) => {
  const isCancelled = status === 'Cancelled';
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="status-tracker">
      {isCancelled ? (
        <div className="tracker-cancelled">
          <span className="cancelled-icon">❌</span>
          <span className="cancelled-text">Delivery Cancelled</span>
        </div>
      ) : (
        <div className="tracker-steps">
          {STATUS_ORDER.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const color = STATUS_COLORS[step];

            return (
              <React.Fragment key={step}>
                <div className={`tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div
                    className="step-circle"
                    style={{
                      background: isCurrent ? color : isCompleted ? color : 'transparent',
                      borderColor: isCurrent || isCompleted ? color : '#404040',
                      boxShadow: isCurrent ? `0 0 16px ${color}55` : 'none',
                    }}
                  >
                    {isCompleted ? (
                      <span className="step-check">✓</span>
                    ) : (
                      <span className="step-icon">{STATUS_ICONS[step]}</span>
                    )}
                  </div>
                  <span
                    className="step-label"
                    style={{ color: isCurrent ? color : isCompleted ? '#909090' : '#404040' }}
                  >
                    {step}
                  </span>
                </div>

                {idx < STATUS_ORDER.length - 1 && (
                  <div
                    className="tracker-line"
                    style={{
                      background: idx < currentIndex ? STATUS_COLORS[STATUS_ORDER[idx]] : '#282828',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusTracker;

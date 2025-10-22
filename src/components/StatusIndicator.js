import React from 'react';

const StatusIndicator = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#00ff88';
      case 'warning':
        return '#ffaa00';
      case 'error':
        return '#ff4444';
      default:
        return '#888888';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="status-indicator">
      <div 
        className="status-dot" 
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
      <style jsx>{`
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
        
        .status-text {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default StatusIndicator;

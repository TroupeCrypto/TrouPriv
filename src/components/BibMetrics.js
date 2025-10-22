import React from 'react';

const BibMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bib-metrics loading">
        <h3>BiB! Metrics</h3>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bib-metrics">
      <h3>BiB! AI System</h3>
      <div className="metrics-content">
        <div className="metric-item">
          <span className="label">Status:</span>
          <span className="value">{metrics.status || 'Unknown'}</span>
        </div>
        <div className="metric-item">
          <span className="label">Last Updated:</span>
          <span className="value">
            {metrics.last_updated ? new Date(metrics.last_updated).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
        <div className="metric-item">
          <span className="label">Uptime:</span>
          <span className="value">{metrics.uptime || 0} hrs</span>
        </div>
      </div>
      <style jsx>{`
        .bib-metrics {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(0, 255, 255, 0.3);
        }
        
        .bib-metrics h3 {
          color: #00d4ff;
          font-size: 1.2rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .metrics-content {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
        
        .label {
          color: #888;
          font-size: 0.9rem;
        }
        
        .value {
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }
        
        .loading {
          text-align: center;
        }
        
        .loading p {
          color: #888;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default BibMetrics;

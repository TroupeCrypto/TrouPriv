import React from 'react';

const MetricCard = ({ title, value, unit = '', trend = null }) => {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <div className="metric-value">
        {value} {unit && <span className="unit">{unit}</span>}
      </div>
      {trend && (
        <div className={`trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
      <style jsx>{`
        .metric-card {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(0, 255, 255, 0.2);
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 255, 255, 0.5);
        }
        
        .metric-card h3 {
          color: #00d4ff;
          font-size: 1rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
          margin-bottom: 0.5rem;
        }
        
        .unit {
          font-size: 1rem;
          color: #888;
          margin-left: 0.5rem;
        }
        
        .trend {
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .trend.up {
          color: #00ff88;
        }
        
        .trend.down {
          color: #ff4444;
        }
      `}</style>
    </div>
  );
};

export default MetricCard;

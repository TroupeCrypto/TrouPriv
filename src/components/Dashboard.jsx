import React from 'react';
import MetricCard from './MetricCard.jsx';

function Dashboard() {
  const metrics = [
    { title: 'CPU Usage', value: '...', unit: '%' },
    { title: 'Memory Usage', value: '...', unit: 'GB' }
  ];

  return (
    <div className="Dashboard">
      {metrics.map((metric, index) => (
        <MetricCard key={index} title={metric.title} value={metric.value} unit={metric.unit} />
      ))}
    </div>
  );
}

export default Dashboard;

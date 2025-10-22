import React from 'react';

function MetricCard({ title, value, unit }) {
  return (
    <div className="MetricCard">
      <h2>{title}</h2>
      <p>{value}{unit}</p>
    </div>
  );
}

export default MetricCard;

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RealtimeChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Generate initial data
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}s`,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      network: Math.random() * 100
    }));
    setData(initialData);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1), {
          time: `${prevData.length}s`,
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          network: Math.random() * 100
        }];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(0, 0, 0, 0.8)', 
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="cpu" stroke="#00d4ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="memory" stroke="#ff00ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="network" stroke="#00ff88" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealtimeChart;

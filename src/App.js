import React, { useState, useEffect } from 'react';
import './App.css';
import MetricCard from './components/MetricCard';
import StatusIndicator from './components/StatusIndicator';
import RealtimeChart from './components/RealtimeChart';
import BibMetrics from './components/BibMetrics';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metrics`);
      setMetrics(response.data);
      setStatus('active');
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setStatus('error');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>BiB! Systems Monitor</h1>
        <StatusIndicator status={status} />
      </header>
      
      <main className="App-main">
        <div className="metrics-grid">
          <BibMetrics metrics={metrics} />
          <MetricCard title="System Status" value={metrics?.status || 'Unknown'} />
          <MetricCard title="Uptime" value={metrics?.uptime || 0} unit="hours" />
        </div>
        
        <div className="chart-section">
          <h2>Real-time Metrics</h2>
          <RealtimeChart />
        </div>
      </main>
    </div>
  );
}

export default App;

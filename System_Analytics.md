# BiB! Systems Monitor

A real-time monitoring system for the BiB! AI platform, featuring a Flask backend API and React frontend dashboard.

## Project Structure

```
bib_systems_monitor/
├── backend/              # Flask API backend
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # Environment variables template
├── frontend/            # React frontend
│   ├── package.json     # Node.js dependencies
│   ├── public/
│   │   └── index.html   # HTML template
│   └── src/
│       ├── index.js     # React entry point
│       ├── App.js       # Main App component
│       ├── App.css      # Global styles
│       └── components/  # React components
│           ├── MetricCard.js       # Display individual metrics
│           ├── StatusIndicator.js  # System status indicator
│           ├── RealtimeChart.js    # Real-time metrics chart
│           └── BibMetrics.js       # BiB-specific metrics
├── README.md            # This file
└── .gitignore          # Git ignore rules
```

## Features

- **Real-time Monitoring**: Live updates of system metrics every 5 seconds
- **Interactive Dashboard**: Visual representation of CPU, memory, and network metrics
- **Status Indicators**: Color-coded system status (Active, Warning, Error)
- **REST API**: Clean API endpoints for metrics management
- **Responsive Design**: Works on desktop and mobile devices

## Backend Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Run the server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/metrics` - Get current metrics
- `POST /api/metrics` - Update metrics

## Frontend Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

4. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
```

## Development

### Running Both Services

Terminal 1 (Backend):
```bash
cd backend
python app.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

## Technologies

### Backend
- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- Python-dotenv - Environment variable management

### Frontend
- React 18 - UI framework
- Axios - HTTP client
- Recharts - Charting library
- CSS3 - Styling with gradients and animations

## Contributing

This is part of the TroupeCrypto/TrouPriv project. Please follow the existing code style and patterns.

## License

Proprietary - TroupeCrypto

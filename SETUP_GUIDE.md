# BiB! Systems Monitor - Setup Guide

This project implements a simple React Dashboard with Flask backend for monitoring BiB! system metrics.

## Project Structure

```
/
├── src/
│   ├── App.jsx              # Main React application
│   ├── App.css              # Application styles
│   ├── index.jsx            # React entry point
│   └── components/
│       ├── Dashboard.jsx    # Dashboard component with metrics
│       └── MetricCard.jsx   # Metric card component
├── app.py                   # Flask backend server
├── requirements.txt         # Python dependencies
├── package.json             # Node.js dependencies
├── index.html               # HTML entry point
└── verify-setup.sh          # Setup verification script
```

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn

## Installation

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

## Running the Application

### Backend (Flask)

Start the Flask API server:

```bash
python3 app.py
```

The Flask server will run on `http://localhost:5000` with the following endpoints:
- Health check: `GET /api/health`
- Metrics: `GET /api/metrics`

### Frontend (React)

In a separate terminal, start the React development server:

```bash
npm run dev
```

The React app will run on `http://localhost:3000`

## Building for Production

Build the React application:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Components

### App.jsx
Main application component that renders the header and Dashboard.

### Dashboard.jsx
Displays metric cards for CPU Usage and Memory Usage.

### MetricCard.jsx
Reusable component for displaying individual metrics with title, value, and unit.

## Styling

The application uses simple CSS with:
- Dark header background (#282c34)
- Flexbox layout for metric cards
- Border and padding for card styling

## API Endpoints

### GET /api/health
Returns the health status of the backend.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T02:17:09.591462"
}
```

### GET /api/metrics
Returns current system metrics.

**Response:**
```json
{
  "status": "active",
  "uptime": 0,
  "last_updated": "2025-10-22T02:17:09.562677"
}
```

## Troubleshooting

### Browser Console Errors
- Press F12 to open Developer Tools
- Check the Console tab for any errors
- Verify network requests to `localhost:5000` are successful

### Port Already in Use
If port 3000 or 5000 is already in use, you can change them:
- React: Set `PORT` environment variable before running `npm run dev`
- Flask: Modify the `port` parameter in `app.py`

### Clear Cache
If you see stale content, try a hard refresh:
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

## Verification

Run the setup verification script:

```bash
./verify-setup.sh
```

This will check your installation and build the application.

## License

This project is part of the BiB! Systems Monitor.

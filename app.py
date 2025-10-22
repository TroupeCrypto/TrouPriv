"""
BiB Systems Monitor - Backend API
Flask application for monitoring BiB AI system metrics
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Sample metrics data structure
system_metrics = {
    "status": "active",
    "uptime": 0,
    "last_updated": datetime.now().isoformat()
}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get current system metrics"""
    return jsonify(system_metrics)

@app.route('/api/metrics', methods=['POST'])
def update_metrics():
    """Update system metrics"""
    data = request.get_json()
    system_metrics.update(data)
    system_metrics["last_updated"] = datetime.now().isoformat()
    return jsonify(system_metrics)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

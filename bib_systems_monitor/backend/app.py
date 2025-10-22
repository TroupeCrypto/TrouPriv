"""
BiB Systems Monitor - Backend API
An active, real-time metrics broadcaster using Flask-SocketIO and psutil.
"""

import os
import threading
from time import sleep

import psutil
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

# Use eventlet for async operations, which is crucial for SocketIO performance
import eventlet
eventlet.monkey_patch()

# --- App Initialization ---
load_dotenv()

app = Flask(__name__)
# A secret key is needed for sessions, even if we don't use them directly
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_truly_cosmic_secret_key_dev')

CORS(app, resources={r"/api/*": {"origins": "*"}})
# Initialize SocketIO with eventlet for high performance
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- State Management ---
# A thread-safe way to manage our background task so it only runs once
thread = None
thread_lock = threading.Lock()

# Store the last known metrics to serve via REST for the initial page load
# This ensures the dashboard has data the moment it loads, before the first websocket message
last_metrics = {
    'cpu_usage': 0,
    'memory_usage': 0,
    'disk_usage': 0,
    'network_sent': 0,
    'network_recv': 0,
    'status': 'Initializing'
}

def get_system_status(metrics):
    """Determines system status based on resource usage."""
    if metrics['cpu_usage'] > 90 or metrics['memory_usage'] > 90:
        return 'Error'
    elif metrics['cpu_usage'] > 75 or metrics['memory_usage'] > 75:
        return 'Warning'
    else:
        return 'Active'

# --- Background Task for Real-time Metrics ---
def background_metrics_emitter():
    """
    Continuously gathers real system metrics using psutil and
    emits them to all connected clients via WebSocket.
    """
    print("✨ Starting background metrics emitter thread...")
    last_net_io = psutil.net_io_counters()

    while True:
        # Use psutil to get real system data
        cpu_usage = psutil.cpu_percent(interval=1)
        memory_info = psutil.virtual_memory()
        disk_info = psutil.disk_usage('/')
        current_net_io = psutil.net_io_counters()

        # Calculate network speed (bytes per second) over the sleep interval
        bytes_sent = current_net_io.bytes_sent - last_net_io.bytes_sent
        bytes_recv = current_net_io.bytes_recv - last_net_io.bytes_recv
        last_net_io = current_net_io

        metrics = {
            'cpu_usage': round(cpu_usage, 2),
            'memory_usage': round(memory_info.percent, 2),
            'disk_usage': round(disk_info.percent, 2),
            # Bytes sent/received in the last 2 seconds
            'network_sent': bytes_sent,
            'network_recv': bytes_recv,
        }
        metrics['status'] = get_system_status(metrics)

        # Update global state for the REST endpoint
        global last_metrics
        last_metrics = metrics.copy()

        # Emit the data to all connected clients under the 'metrics_update' event
        socketio.emit('metrics_update', metrics)
        
        # Use socketio.sleep for cooperative yielding in the eventlet environment
        socketio.sleep(2)

# --- WebSocket Event Handlers ---
@socketio.on('connect')
def handle_connect():
    """
    A new client has connected. Start the background thread if it's not already running.
    """
    global thread
    with thread_lock:
        if thread is None:
            # Start the background task using socketio's utility
            thread = socketio.start_background_task(target=background_metrics_emitter)
    print("Client connected. Emitting initial data.")
    # Immediately send the last known metrics to the newly connected client
    socketio.emit('metrics_update', last_metrics)


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected.")

# --- REST API Endpoints ---
@app.route('/api/health')
def health_check():
    """Health check endpoint for uptime monitoring."""
    return jsonify({"status": "API is vibing"}), 200

@app.route('/api/metrics')
def get_initial_metrics():
    """
    Provides the latest metrics snapshot via a standard REST call.
    This is useful for the frontend to populate its initial state
    immediately on load, before the first WebSocket message arrives.
    """
    return jsonify(last_metrics), 200

# --- Main Execution ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 BiB! Systems Monitor Backend launching on port {port}...")
    # Use socketio.run to start the server properly with WebSocket and eventlet support
    socketio.run(app, host='0.0.0.0', port=port, debug=True

"""
Socket.io Realtime Server for Online Learning Platform
Runs on port 5001 and provides realtime chat & notification relays.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
django.setup()

import uvicorn
import socketio
from apps.chat.socket_app import sio

# Create ASGI application
asgi_app = socketio.ASGIApp(sio)

if __name__ == "__main__":
    port = 5001
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    print("=" * 60)
    print("   ONLINE LEARNING PLATFORM - REALTIME SOCKET.IO SERVER")
    print("=" * 60)
    print(f"[*] Starting Python Socket.io server on http://127.0.0.1:{port}")
    print("[*] Ready to accept authenticated student & instructor connections.")
    print("=" * 60)

    uvicorn.run(asgi_app, host="0.0.0.0", port=port, log_level="info")

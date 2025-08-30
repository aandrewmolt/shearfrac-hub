#!/usr/bin/env python3
"""
Simple HTTP server with CORS and no caching
Run this after building: python3 serve-no-cache.py
"""

import http.server
import socketserver
import os

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Disable caching completely
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = 8080
DIRECTORY = "dist"

print(f"Starting server at http://localhost:{PORT}")
print("NO CACHING - All requests will be fresh!")
print("Press Ctrl+C to stop\n")

os.chdir(DIRECTORY)

with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
    httpd.serve_forever()
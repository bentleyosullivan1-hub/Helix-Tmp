import http.server
import socketserver
import webbrowser
import os

PORT = 8000

# Serve files from the folder containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("localhost", PORT), Handler) as server:
    url = f"http://localhost:{PORT}/index.html"

    print(f"Server running at {url}")
    print("Press Ctrl+C to stop.")

    webbrowser.open(url)

    server.serve_forever()
import http.server
import socketserver
import os
os.chdir(r"C:\Users\junha_au6a0kj\Documents\GitHub\never-wet.github.io")
with socketserver.TCPServer(("127.0.0.1", 4173), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()

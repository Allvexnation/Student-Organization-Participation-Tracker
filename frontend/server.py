from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys

class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def do_GET(self):
        if self.path != '/' and not os.path.exists(self.path.lstrip('/')):
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    port = 3000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    
    server = HTTPServer(('localhost', port), SPAHandler)
    print(f'Server running at http://localhost:{port}')
    print('Press Ctrl+C to stop the server')
    server.serve_forever()

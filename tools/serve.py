from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parents[1])
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
ThreadingHTTPServer.request_queue_size=128
print('Year 8 Learning World: http://127.0.0.1:8848/playable-3d/', flush=True)
ThreadingHTTPServer(('127.0.0.1',8848),QuietHandler).serve_forever()

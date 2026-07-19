#!/usr/bin/env python3
"""Dev-only static server with HTTP Range support.

Python's stock http.server ignores Range requests, which makes
browsers refuse to seek inside audio files. Production (Vercel)
supports Range natively — this server exists so local testing
behaves like production. Not part of the deployed site.

Usage: python3 dev-server.py [port]     (serves the Portfolio root)
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        rng = self.headers.get('Range')
        if os.path.isdir(path) or not rng:
            return super().send_head()

        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        if not m or (not m.group(1) and not m.group(2)):
            return super().send_head()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None

        size = os.fstat(f.fileno()).st_size
        if m.group(1):
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else size - 1
        else:  # suffix range: bytes=-N
            start = max(0, size - int(m.group(2)))
            end = size - 1
        end = min(end, size - 1)

        if start > end or start >= size:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None

        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self._range_remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        remaining = getattr(self, '_range_remaining', None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        self._range_remaining = None
        while remaining > 0:
            chunk = source.read(min(65536, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def end_headers(self):
        # advertise seekability on plain 200s so browsers ask for ranges
        if not self.headers.get('Range'):
            self.send_header('Accept-Ranges', 'bytes')
        # dev only: never let the browser serve stale files
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(os.path.dirname(here))  # Portfolio root, same layout as Vercel
    print(f'serving {os.getcwd()} on http://localhost:{port} (range-enabled)')
    ThreadingHTTPServer(('127.0.0.1', port), RangeHandler).serve_forever()

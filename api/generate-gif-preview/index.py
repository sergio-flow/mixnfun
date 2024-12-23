from http.server import BaseHTTPRequestHandler, HTTPServer
import imageio
from PIL import Image, ImageOps, ImageSequence
import os
import io
import numpy as np
import requests
from io import BytesIO
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            objs = json.loads(post_data)
            buffer = generate_gif_preview(objs['gif'])
            self.send_response(200)
            self.send_header('Content-type', 'image/jpeg')
            self.end_headers()
            self.wfile.write(buffer.getvalue())
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error processing request: {e}".encode('utf-8'))
        return


def generate_gif_preview(url):
     # Download the GIF
    response = requests.get(url)
    gif = Image.open(BytesIO(response.content))

    # Extract the first frame
    first_frame = gif.convert('RGB')

    # Save the first frame to a buffer as JPEG
    buffer = BytesIO()
    first_frame.save(buffer, format="JPEG")
    buffer.seek(0)
    return buffer
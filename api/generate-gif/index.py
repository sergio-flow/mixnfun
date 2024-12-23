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
            if len(objs['images']) < 2:
                raise ValueError("At least two images are required to create a GIF.")
            buffer = generate_gif(objs['images'])
            self.send_response(200)
            self.send_header('Content-type', 'image/gif')
            self.end_headers()
            self.wfile.write(buffer.getvalue())
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error processing request: {e}".encode('utf-8'))
        return


def generate_gif(image_objects):
    # Function to resize image to cover the specified size, maintaining aspect ratio and cropping as needed
    def resize_image(image, size=(800, 800)):
        # Resize and crop the image to cover the specified size, maintaining aspect ratio
        return ImageOps.fit(image.convert('RGBA'), size, Image.LANCZOS)

    # Lists to hold the images and their durations
    images = []
    durations = []

    # Target size for all images and frames
    target_size = (800, 800)

    # Function to download and open an image from a URL
    def open_image_from_url(url):
        response = requests.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))

    # Loop through and process each image URL
    for image_obj in image_objects:
        with open_image_from_url(image_obj['image']) as img:
            if img.format == 'GIF':
                # Handle GIF: extract frames and resize each one
                for frame in ImageSequence.Iterator(img):
                    resized_frame = resize_image(frame.convert('RGBA'), size=target_size)
                    images.append(np.array(resized_frame))
                    durations.append(frame.info.get('duration'))
            else:
                resized_image = resize_image(img, size=target_size)
                images.append(np.array(resized_image))
                durations.append(1000)  # Duration for non-GIF images

    buffer = io.BytesIO()
    imageio.mimsave(buffer, images, format='GIF', duration=durations, loop=0)
    buffer.seek(0)
    
    return buffer
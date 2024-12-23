from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont
import io
import json
import random


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            text = data.get('text', 'Hola!')
            width = data.get('width', 800)
            height = data.get('height', 800)
            font_size = data.get('font_size', 40)
            
            # Create the image with text
            image = create_image_with_text(divide_text(text), width, height, font_size)
            
            # Save the image to a bytes buffer
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            buffer.seek(0)

            self.send_response(200)
            self.send_header('Content-type', 'image/png')
            self.end_headers()
            self.wfile.write(buffer.getvalue())
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error processing request: {e}".encode('utf-8'))
        return


def create_image_with_text(text, image_width, image_height, font_size):
    colors = ["#F4EFDE", "#FFEEE1", "#FFF0F5", "#F4F9FF", "#F5F7E8"]

    chosen_color = random.choice(colors)

    chosen_text_color = "#d3c9a6"

    if chosen_color == "#FFEEE1":
        chosen_text_color = "#d4b9a4"
    if chosen_color == "#FFF0F5":
        chosen_text_color = "#e4ced5"
    if chosen_color == "#F4F9FF":
        chosen_text_color = "#d3dfed"
    if chosen_color == "#F5F7E8":
        chosen_text_color = "#caceae"
    # Create a white background image
    image = Image.new('RGB', (image_width, image_height), color=chosen_color)
    
    # Initialize ImageDraw
    draw = ImageDraw.Draw(image)
    
    # Load a font
    try:
        # You can specify a path to a .ttf file to use a specific font
        font = ImageFont.truetype("./NotoSans-Medium.ttf", font_size)
    except IOError:
        # If the specified font is not found, use the default font
        font = ImageFont.load_default()

    # Calculate text size and position using textbbox
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (image_width - text_width) // 2
    text_y = (image_height - text_height) // 2
    draw.text((text_x, text_y), text, fill="#000000", font=font)


    font = ImageFont.truetype("./NotoSans-Medium.ttf", 24)
    bbox = draw.textbbox((0, 0), "www.mixnfun.com", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (image_width - text_width) // 2
    text_y = (image_height - text_height) // 2
    draw.text((text_x, 720), "www.mixnfun.com", fill=chosen_text_color, font=font)

    # Save the image
    return image

def divide_text(text, max_length=25):
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        if len(current_line) + len(word) + 1 <= max_length:
            if current_line:
                current_line += " " + word
            else:
                current_line = word
        else:
            lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return "\n".join(lines)
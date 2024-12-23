from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)

            update_gif_number('./subscribers.txt', data['email'], data['book_name'], data['new_chapter'], data['new_gif_number'])

            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write("Got it!")
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error processing request: {e}".encode('utf-8'))
        return

def update_gif_number(file_path, email, book_name, new_chapter, new_gif_number):
    # Read the current entries in the file
    if not os.path.exists(file_path):
        print(f"The file {file_path} does not exist.")
        return

    with open(file_path, 'r') as file:
        lines = file.readlines()

    updated = False
    # Update the gif number if the email and book name match
    with open(file_path, 'w') as file:
        for line in lines:
            existing_email, existing_book_name, chapter, gif_number = line.strip().split(':')
            if existing_email == email and existing_book_name == book_name:
                file.write(f"{email}:{book_name}:{new_chapter}:{new_gif_number}\n")
                updated = True
                print(f"Updated gif number for {email} and {book_name}.")
            else:
                file.write(line)

    if not updated:
        print(f"No entry found for {email} and {book_name}.")
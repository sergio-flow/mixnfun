import os

def extract_number(name):
    """Helper function to extract the number from the beginning of the file or folder name."""
    number = name.split('.')[0]
    return int(number) if number.isdigit() else float('inf')

def create_txt_for_subfolders(books_folder):
    # Walk through the books folder
    for root, dirs, files in os.walk(books_folder):
        # Skip the root folder itself
        if root == books_folder:
            continue
        
        # Sort the subfolders based on the number in front of their name
        dirs.sort(key=extract_number)
        
        # For each subfolder within a book folder
        for subfolder in dirs:
            subfolder_path = os.path.join(root, subfolder)
            txt_file_path = os.path.join(root, f"{subfolder}.txt")
            
            # Collect and sort text files in the subfolder
            text_files = [f for f in os.listdir(subfolder_path) if f.endswith('.txt')]
            text_files.sort(key=extract_number)
            
            # Create or overwrite the subfolder .txt file in the book folder
            with open(txt_file_path, 'w') as txt_file:
                # Traverse each sorted file in the subfolder
                for subfile in text_files:
                    subfile_path = os.path.join(subfolder_path, subfile)
                    # Check if the subfile is a .txt file
                    if os.path.isfile(subfile_path):
                        with open(subfile_path, 'r') as content_file:
                            content = content_file.read()
                            txt_file.write(content + "\n")
            
            print(f"Created: {txt_file_path}")

# Set the path to your books folder
books_folder_path = 'public/books'

# Run the function
create_txt_for_subfolders(books_folder_path)

import os

def create_txt_for_subfolders(books_folder):
    # Walk through the books folder
    for root, dirs, files in os.walk(books_folder):
        # Skip the root folder itself
        if root == books_folder:
            continue
        
        # For each subfolder within a book folder
        for subfolder in dirs:
            subfolder_path = os.path.join(root, subfolder)
            txt_file_path = os.path.join(subfolder_path, f"{subfolder}.txt")
            
            # Create or overwrite the subfolder .txt file
            with open(txt_file_path, 'w') as txt_file:
                # Traverse each file in the subfolder
                for subfile in os.listdir(subfolder_path):
                    subfile_path = os.path.join(subfolder_path, subfile)
                    # Check if the subfile is a .txt file and is not the subfolder .txt file itself
                    if os.path.isfile(subfile_path) and subfile.endswith('.txt') and subfile != f"{subfolder}.txt":
                        with open(subfile_path, 'r') as content_file:
                            content = content_file.read()
                            txt_file.write(content + "\n")
            
            print(f"Created: {txt_file_path}")

# Set the path to your books folder
books_folder_path = 'public/books'

# Run the function
create_txt_for_subfolders(books_folder_path)

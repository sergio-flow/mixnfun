import os
import re

def clean_line(line):
    # Remove numbers followed by a dot at the beginning of the line
    line = re.sub(r'^\d+\.\s*', '', line)
    # Remove leading and trailing whitespace
    return line.strip()

def remove_empty_lines_and_prefix_numbers(file_path):
    # Read the lines from the file
    with open(file_path, 'r') as file:
        lines = file.readlines()
    
    # Clean lines and remove empty lines
    cleaned_lines = [clean_line(line) for line in lines if clean_line(line)]
    
    # Write the cleaned lines back to the file
    with open(file_path, 'w') as file:
        file.writelines(f"{line}\n" for line in cleaned_lines)

def scan_directory(directory_path):
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            if file.endswith(".txt"):
                file_path = os.path.join(root, file)
                remove_empty_lines_and_prefix_numbers(file_path)
                print(f"Processed {file_path}")

if __name__ == "__main__":
    directory_path = input("Enter the directory path to scan: ")
    scan_directory(directory_path)
    print("Processing completed.")

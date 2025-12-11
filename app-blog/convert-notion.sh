#!/bin/bash

# Script to convert Notion export to clean markdown files
# Removes UUID suffixes and cleans up file names

SOURCE_DIR="notion-export-12-10-25/Private & Shared"
DEST_DIR="notion-markdown-clean"

# Function to clean filename - remove UUID and make it readable
clean_filename() {
    local filename="$1"
    # Remove UUID pattern (space + 32 hex chars)
    cleaned=$(echo "$filename" | sed -E 's/ [0-9a-f]{32}//g')
    # Replace spaces with hyphens for URLs
    cleaned=$(echo "$cleaned" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    echo "$cleaned"
}

# Function to process directory recursively
process_directory() {
    local src_dir="$1"
    local dest_dir="$2"
    
    # Create destination directory
    mkdir -p "$dest_dir"
    
    # Process all markdown files in current directory
    for file in "$src_dir"/*.md; do
        if [ -f "$file" ]; then
            basename=$(basename "$file")
            clean_name=$(clean_filename "$basename")
            
            # Copy and clean the file
            cp "$file" "$dest_dir/$clean_name"
            echo "Converted: $basename -> $clean_name"
        fi
    done
    
    # Process subdirectories
    for dir in "$src_dir"/*/; do
        if [ -d "$dir" ]; then
            dirname=$(basename "$dir")
            clean_dirname=$(clean_filename "$dirname")
            process_directory "$dir" "$dest_dir/$clean_dirname"
        fi
    done
}

# Start processing
echo "Converting Notion export to clean markdown..."
process_directory "$SOURCE_DIR" "$DEST_DIR"
echo "Conversion complete!"

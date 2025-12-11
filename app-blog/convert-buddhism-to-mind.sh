#!/bin/bash

# Script to convert Buddhism markdown files to Mind system format
# Each file becomes a separate idea with appropriate metadata

SOURCE_DIR="notion-markdown-clean/buddhism"
DEST_DIR="src/content/mind"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Counter for generating unique IDs
counter=1

# Function to generate a unique thought ID
generate_thought_id() {
    printf "thought-buddhism-%03d" $counter
    ((counter++))
}

# Function to clean markdown content - remove image references
clean_content() {
    local content="$1"
    # Remove image references like ![alt](path)
    content=$(echo "$content" | sed -E 's/!\[([^\]]*)\]\([^\)]+\)//g')
    # Remove standalone image file references
    content=$(echo "$content" | grep -v '\.jpeg\|\.jpg\|\.png\|\.gif')
    echo "$content"
}

# Function to extract title from markdown
get_title() {
    local file="$1"
    # Get first # heading
    title=$(grep -m 1 "^# " "$file" | sed 's/^# //')
    if [ -z "$title" ]; then
        # Fallback to filename
        title=$(basename "$file" .md | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
    fi
    echo "$title"
}

# Function to create slug from title
create_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g'
}

# Function to get category from path
get_category() {
    local filepath="$1"
    # Extract subdirectory as category
    category=$(dirname "$filepath" | sed "s|$SOURCE_DIR/||" | tr '/' '-')
    if [ "$category" = "." ]; then
        category="general"
    fi
    echo "$category"
}

# Process each markdown file
find "$SOURCE_DIR" -name "*.md" | while read -r file; do
    echo "Processing: $file"
    
    # Extract metadata
    title=$(get_title "$file")
    slug=$(create_slug "$title")
    category=$(get_category "$file")
    
    # Read and clean content
    content=$(cat "$file")
    cleaned_content=$(clean_content "$content")
    
    # Escape content for JSON
    escaped_content=$(echo "$cleaned_content" | jq -Rs .)
    
    # Generate thought ID
    thought_id=$(generate_thought_id)
    
    # Create JSON file
    json_file="$DEST_DIR/buddhism-${slug}.json"
    
    cat > "$json_file" << EOF
{
  "title": "$title",
  "summary": "Buddhist practice notes and teachings - $category",
  "createdDate": "$TIMESTAMP",
  "updatedDate": "$TIMESTAMP",
  "hashtags": ["#buddhism", "#pre-website", "#$category"],
  "status": "active",
  "thoughts": [
    {
      "id": "$thought_id",
      "date": "$TIMESTAMP",
      "content": $escaped_content,
      "hashtags": ["#buddhism", "#$category"]
    }
  ],
  "changelog": [
    {
      "date": "$TIMESTAMP",
      "action": "created",
      "description": "Imported from Notion export - pre-website content"
    },
    {
      "date": "$TIMESTAMP",
      "action": "thought_added",
      "description": "Added Buddhist teaching notes",
      "thoughtId": "$thought_id"
    }
  ]
}
EOF
    
    echo "Created: $json_file"
done

echo "Conversion complete! Created $(find "$DEST_DIR" -name "buddhism-*.json" | wc -l) mind ideas."

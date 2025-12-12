# Test Blog Posts

This folder contains test blog posts demonstrating various scenarios for the blog creation system.

## Valid Posts (2)

### 01-valid-post.md
Complete blog post with all fields including hero image uploaded via the admin interface.

**Features:**
- Auto-generated slug from title
- Uploaded hero image with standardized naming: `{slug}-hero.{extension}`
- Image path: `../../assets/my-first-valid-blog-post-hero.jpg`

### 02-valid-post-minimal.md
Minimal valid post with only required fields (no hero image).

**Features:**
- Title, description, and pubDate only
- No hero image (optional field)
- Demonstrates minimum requirements

## Failing Posts (8)

Each failing post demonstrates a different validation error:

### 03-fail-missing-title.md
Missing required `title` field in frontmatter.

### 04-fail-missing-description.md
Missing required `description` field in frontmatter.

### 05-fail-missing-pubdate.md
Missing required `pubDate` field in frontmatter.

### 06-fail-invalid-date-format.md
Invalid date format (not a parseable date string).

### 07-fail-no-frontmatter.md
No YAML frontmatter block at all.

### 08-fail-malformed-yaml.md
Malformed YAML syntax that won't parse.

### 09-fail-empty-content.md
Valid frontmatter but empty/minimal content.

### 10-fail-wrong-date-type.md
Date provided as number instead of string format.

## Hero Image Upload Process

When creating a blog post via the admin interface:

1. **Fill in the title** - The slug auto-generates (e.g., "My Post" → "my-post")
2. **Click "📁 Upload Image"** - Opens file picker for images (JPG, PNG, WebP, GIF)
3. **Select your image** - Max 5MB
4. **Auto-naming** - Image saves as `{slug}-hero.{extension}` (e.g., `my-post-hero.jpg`)
5. **Auto-path** - The heroImage field auto-populates with `../../assets/{slug}-hero.{extension}`

## Image Formats Supported

- JPEG/JPG
- PNG
- WebP
- GIF

## Path Formats

- **From src/assets/**: `../../assets/image-name.jpg`
- **From public/images/**: `/images/image-name.jpg`
- **External URL**: `https://example.com/image.jpg`

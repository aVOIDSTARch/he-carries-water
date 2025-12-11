import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { logPostCreated } from '../../../lib/audit-logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * API endpoint for uploading markdown files to create blog posts
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Check authentication
    const session = await getSession(request);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const validExtensions = ['.md', '.mdx', '.markdown'];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only .md, .mdx, and .markdown files are allowed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Extract frontmatter and content
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);

    if (!match) {
      return new Response(
        JSON.stringify({
          error: 'Invalid markdown file format. File must include frontmatter (---...---)'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const [, frontmatterString, content] = match;

    // Parse frontmatter (basic YAML parsing)
    const frontmatter: Record<string, any> = {};
    frontmatterString.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        frontmatter[key.trim()] = value;
      }
    });

    // Validate required frontmatter fields
    if (!frontmatter.title) {
      return new Response(
        JSON.stringify({ error: 'Frontmatter must include "title"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!frontmatter.description) {
      return new Response(
        JSON.stringify({ error: 'Frontmatter must include "description"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate slug from filename or title
    const slug = path.basename(file.name, path.extname(file.name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure pubDate exists
    if (!frontmatter.pubDate) {
      frontmatter.pubDate = new Date().toISOString().split('T')[0];
    }

    // Create the blog post file
    const blogDir = path.join(process.cwd(), 'src/content/blog');
    await fs.mkdir(blogDir, { recursive: true });

    const blogFilePath = path.join(blogDir, `${slug}${fileExtension}`);

    // Check if file already exists
    try {
      await fs.access(blogFilePath);
      return new Response(
        JSON.stringify({ error: `A post with slug "${slug}" already exists` }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch {
      // File doesn't exist, which is what we want
    }

    // Write the file
    await fs.writeFile(blogFilePath, fileContent, 'utf-8');

    // Log the event
    await logPostCreated(
      slug,
      frontmatter.title,
      {
        id: session.user.id as string | undefined,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
      request
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Blog post created successfully from uploaded file',
        slug,
        title: frontmatter.title,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading blog post:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload blog post',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

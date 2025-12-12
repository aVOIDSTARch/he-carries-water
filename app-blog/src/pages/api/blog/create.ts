import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { logPostCreated } from '../../../lib/audit-logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * API endpoint for creating blog posts from form data
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

    // Parse request data
    const data = await request.json();
    let { title, slug, content, description, pubDate, heroImage } = data;

    // Ensure pubDate is set and in correct format
    if (!pubDate) {
      // Use current date/time if not provided
      const now = new Date();
      pubDate = now.toISOString().split('.')[0]; // Format: YYYY-MM-DDTHH:MM:SS
    } else {
      // Validate and normalize the pubDate
      try {
        const dateObj = new Date(pubDate);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date');
        }
        // Keep the original format if valid (YYYY-MM-DDTHH:MM from datetime-local input)
        // This format is compatible with Astro's z.coerce.date()
      } catch (e) {
        // If invalid, use current date
        const now = new Date();
        pubDate = now.toISOString().split('.')[0];
      }
    }

    // Validate required fields
    if (!title || !slug || !content || !description) {
      return new Response(
        JSON.stringify({ error: 'Title, slug, description, and content are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate slug format (only lowercase letters, numbers, and hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create the blog post file
    const blogDir = path.join(process.cwd(), 'src/content/blog');
    await fs.mkdir(blogDir, { recursive: true });

    const blogFilePath = path.join(blogDir, `${slug}.md`);

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

    // Build frontmatter
    const frontmatter = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `pubDate: ${pubDate}`,
    ];

    if (heroImage) {
      frontmatter.push(`heroImage: "${heroImage}"`);
    }

    frontmatter.push('---');

    // Combine frontmatter and content
    const markdown = frontmatter.join('\n') + '\n\n' + content;

    // Write the file
    await fs.writeFile(blogFilePath, markdown, 'utf-8');

    // Log the event
    await logPostCreated(
      slug,
      title,
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
        message: 'Blog post created successfully',
        slug,
        title,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating blog post:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create blog post',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

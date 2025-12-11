import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { logPostCreated } from '../../../lib/audit-logger';

/**
 * API endpoint for creating blog posts
 *
 * This is an example implementation showing how to integrate audit logging
 * when creating blog posts through an API endpoint.
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
    const { title, slug, content, description } = data;

    // Validate required fields
    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Implement actual blog post creation logic
    // This would typically involve:
    // 1. Creating a markdown file in src/content/blog/
    // 2. Writing frontmatter and content
    // 3. Optionally processing images
    // 4. Validating against the schema

    // Example of what you would do:
    // const fs = require('fs/promises');
    // const path = require('path');
    // const blogPath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`);
    // const markdown = `---
    // title: ${title}
    // description: ${description}
    // pubDate: ${new Date().toISOString()}
    // ---
    // ${content}`;
    // await fs.writeFile(blogPath, markdown);

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

import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * API endpoint for uploading hero images
 * Saves images to src/assets/ with standardized naming
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const slug = formData.get('slug') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate filename based on slug or timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = slug
      ? `${slug}-hero.${extension}`
      : `hero-${timestamp}.${extension}`;

    // Save to src/assets/
    const assetsDir = path.join(process.cwd(), 'src/assets');
    await fs.mkdir(assetsDir, { recursive: true });

    const filepath = path.join(assetsDir, filename);

    // Convert File to Buffer and write
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    // Return the relative path that should be used in markdown frontmatter
    const relativePath = `../../assets/${filename}`;

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        path: relativePath,
        message: 'Image uploaded successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload image',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

export const POST: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { githubToken, githubUsername } = body as { githubToken?: string; githubUsername?: string };

    if (!githubUsername) {
      return new Response(JSON.stringify({ error: 'GitHub username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read existing .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_PATH, 'utf-8');
    } catch {
      // File doesn't exist, start fresh
      envContent = '';
    }

    // Update or add GITHUB_USERNAME
    if (envContent.includes('GITHUB_USERNAME=')) {
      envContent = envContent.replace(
        /GITHUB_USERNAME=.*/,
        `GITHUB_USERNAME=${githubUsername}`
      );
    } else {
      envContent += `\nGITHUB_USERNAME=${githubUsername}`;
    }

    // Update or add GITHUB_TOKEN if provided
    if (githubToken) {
      if (envContent.includes('GITHUB_TOKEN=')) {
        envContent = envContent.replace(
          /GITHUB_TOKEN=.*/,
          `GITHUB_TOKEN=${githubToken}`
        );
      } else {
        envContent += `\nGITHUB_TOKEN=${githubToken}`;
      }
    }

    // Clean up any double newlines
    envContent = envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    await fs.writeFile(ENV_PATH, envContent);

    return new Response(JSON.stringify({
      success: true,
      message: 'GitHub credentials updated. Restart the server to apply changes.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save credentials',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return current username (never expose the actual token)
  const username = import.meta.env.GITHUB_USERNAME || '';
  const token = import.meta.env.GITHUB_TOKEN || '';

  // Only indicate if token exists and show masked version
  const hasToken = token.length > 0;
  const maskedToken = hasToken
    ? `${token.substring(0, 4)}${'•'.repeat(Math.min(token.length - 8, 20))}${token.substring(token.length - 4)}`
    : '';

  return new Response(JSON.stringify({
    githubUsername: username,
    hasToken,
    maskedToken,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

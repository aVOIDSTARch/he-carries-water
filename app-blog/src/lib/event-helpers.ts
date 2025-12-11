/**
 * Event Helpers
 *
 * This module provides examples and helper functions for integrating
 * audit logging into your API routes and admin pages.
 *
 * Usage Examples:
 *
 * 1. In a blog post API route (src/pages/api/blog/create.ts):
 *
 *    import { logPostCreated } from '@/lib/audit-logger';
 *    import { getSession } from 'auth-astro/server';
 *
 *    export async function POST({ request }) {
 *      const session = await getSession(request);
 *      if (!session) return new Response('Unauthorized', { status: 401 });
 *
 *      const formData = await request.formData();
 *      const title = formData.get('title');
 *      const slug = formData.get('slug');
 *
 *      // ... create blog post logic ...
 *
 *      await logPostCreated(slug, title, {
 *        id: session.user.id,
 *        name: session.user.name,
 *        email: session.user.email,
 *      }, request);
 *
 *      return new Response(JSON.stringify({ success: true }));
 *    }
 *
 * 2. In a mind idea API route (src/pages/api/mind/create.ts):
 *
 *    import { logMindIdeaCreated } from '@/lib/audit-logger';
 *
 *    export async function POST({ request }) {
 *      // ... create mind idea logic ...
 *
 *      await logMindIdeaCreated(ideaId, ideaTitle, {
 *        name: session.user.name,
 *        email: session.user.email,
 *      }, request);
 *
 *      return new Response(JSON.stringify({ success: true }));
 *    }
 *
 * 3. In a mind thought API route (src/pages/api/mind/[id]/thought.ts):
 *
 *    import { logMindThoughtAdded } from '@/lib/audit-logger';
 *
 *    export async function POST({ request, params }) {
 *      // ... add thought logic ...
 *
 *      await logMindThoughtAdded(
 *        params.id,
 *        ideaTitle,
 *        thoughtId,
 *        { name: session.user.name },
 *        request
 *      );
 *
 *      return new Response(JSON.stringify({ success: true }));
 *    }
 *
 * 4. For custom events:
 *
 *    import { logEvent } from '@/lib/audit-logger';
 *
 *    await logEvent({
 *      timestamp: new Date().toISOString(),
 *      eventType: 'system_update',
 *      title: 'System configuration updated',
 *      description: 'Updated site configuration',
 *      user: { name: 'Admin' },
 *      tags: ['system', 'config'],
 *      severity: 'info',
 *    });
 */

import type { AstroGlobal } from 'astro';
import { getSession } from 'auth-astro/server';
import type { EventUser } from './audit-logger';

/**
 * Extract user information from Astro global object
 */
export async function getUserFromSession(Astro: AstroGlobal): Promise<EventUser | undefined> {
  const session = await getSession(Astro.request);
  if (!session?.user) return undefined;

  return {
    id: session.user.id as string | undefined,
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined,
  };
}

/**
 * Extract user information from a Request object
 */
export async function getUserFromRequest(request: Request): Promise<EventUser | undefined> {
  const session = await getSession(request);
  if (!session?.user) return undefined;

  return {
    id: session.user.id as string | undefined,
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined,
  };
}

/**
 * Example middleware for automatic audit logging on all admin routes
 *
 * This can be added to src/middleware.ts to automatically log all admin page access
 */
export const exampleMiddleware = `
import { defineMiddleware } from 'astro:middleware';
import { getSession } from 'auth-astro/server';
import { logEvent } from './lib/audit-logger';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // Log admin page access
  if (url.pathname.startsWith('/admin')) {
    const session = await getSession(request);

    if (session?.user) {
      await logEvent({
        timestamp: new Date().toISOString(),
        eventType: 'other',
        title: \`Admin page accessed: \${url.pathname}\`,
        description: \`User accessed \${url.pathname}\`,
        user: {
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined,
        },
        metadata: {
          path: url.pathname,
          method: request.method,
        },
        tags: ['admin', 'access'],
        severity: 'info',
      });
    }
  }

  return next();
});
`;

export default {
  getUserFromSession,
  getUserFromRequest,
};

import type { APIRoute } from 'astro';
import { logCommentAdded } from '../../../lib/audit-logger';

/**
 * Webhook endpoint for Giscus comment events
 *
 * To use this webhook:
 * 1. Set up a GitHub webhook on your repository
 * 2. Configure it to send "Discussion comment" events
 * 3. Point it to: https://yourdomain.com/api/webhooks/giscus
 * 4. Add a webhook secret to your .env file as GISCUS_WEBHOOK_SECRET
 *
 * GitHub Webhook Documentation:
 * https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks
 *
 * Note: Giscus uses GitHub Discussions, so you'll receive discussion events
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify webhook signature (recommended for security)
    // const signature = request.headers.get('x-hub-signature-256');
    // const secret = import.meta.env.GISCUS_WEBHOOK_SECRET;
    // if (!verifySignature(await request.text(), signature, secret)) {
    //   return new Response('Invalid signature', { status: 401 });
    // }

    const payload = await request.json();

    // Check if this is a discussion comment event
    const action = payload.action;
    const discussion = payload.discussion;
    const comment = payload.comment;

    if (!discussion || !comment) {
      return new Response('Not a comment event', { status: 200 });
    }

    // Extract blog post information from the discussion
    // Giscus discussions are typically linked to blog posts via their URL
    const discussionUrl = discussion.html_url;
    const commentUser = comment.user;

    // Parse the blog post slug from the discussion
    // This assumes your Giscus is configured to use the page URL
    // You may need to adjust this based on your configuration
    let postSlug = 'unknown';
    let postTitle = discussion.title;

    // Try to extract slug from discussion category description or body
    // This is an example - adjust based on your setup
    if (discussion.category) {
      // You might store the blog post URL in the discussion
      const urlMatch = discussion.body?.match(/\/blog\/([^\/\s]+)/);
      if (urlMatch) {
        postSlug = urlMatch[1];
      }
    }

    // Log different types of comment events
    switch (action) {
      case 'created':
        await logCommentAdded(
          postSlug,
          postTitle,
          comment.id.toString(),
          {
            name: commentUser.login,
            email: commentUser.email,
          },
          request
        );
        break;

      case 'edited':
        await logCommentAdded(
          postSlug,
          postTitle,
          comment.id.toString(),
          {
            name: commentUser.login,
            email: commentUser.email,
          },
          request
        );
        break;

      case 'deleted':
        // You can create a custom event for deleted comments
        // await logEvent({ ... });
        break;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing Giscus webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Helper function to verify GitHub webhook signature
 * Uncomment and use this to verify webhook authenticity
 */
// import crypto from 'crypto';
//
// function verifySignature(
//   payload: string,
//   signature: string | null,
//   secret: string
// ): boolean {
//   if (!signature) return false;
//
//   const hmac = crypto.createHmac('sha256', secret);
//   const digest = 'sha256=' + hmac.update(payload).digest('hex');
//
//   return crypto.timingSafeEqual(
//     Buffer.from(signature),
//     Buffer.from(digest)
//   );
// }

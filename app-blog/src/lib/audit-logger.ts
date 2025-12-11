import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type EventType =
  | 'post_created'
  | 'post_updated'
  | 'post_deleted'
  | 'comment_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'mind_idea_created'
  | 'mind_idea_updated'
  | 'mind_thought_added'
  | 'mind_thought_edited'
  | 'user_login'
  | 'user_logout'
  | 'media_uploaded'
  | 'media_deleted'
  | 'system_update'
  | 'other';

export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

export interface EventUser {
  id?: string;
  name?: string;
  email?: string;
}

export interface RelatedContent {
  type?: 'blog' | 'mind' | 'comment' | 'media' | 'other';
  id?: string;
  title?: string;
  url?: string;
}

export interface ChangeDetails {
  before?: Record<string, any>;
  after?: Record<string, any>;
  summary?: string;
}

export interface AuditEvent {
  timestamp: string;
  eventType: EventType;
  title: string;
  description?: string;
  user?: EventUser;
  relatedContent?: RelatedContent;
  changes?: ChangeDetails;
  metadata?: Record<string, any>;
  tags?: string[];
  severity?: SeverityLevel;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Logs an audit event to the filesystem
 */
export async function logEvent(event: AuditEvent): Promise<void> {
  try {
    const eventsDir = path.join(__dirname, '../../content/events');

    // Ensure events directory exists
    await fs.mkdir(eventsDir, { recursive: true });

    // Generate filename based on date (one file per day)
    const date = new Date(event.timestamp);
    const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.json`;
    const filepath = path.join(eventsDir, filename);

    // Read existing events for the day (if file exists)
    let events: AuditEvent[] = [];
    try {
      const fileContent = await fs.readFile(filepath, 'utf-8');
      events = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist yet, start with empty array
      events = [];
    }

    // Add new event
    events.push({
      ...event,
      severity: event.severity || 'info',
    });

    // Write back to file
    await fs.writeFile(filepath, JSON.stringify(events, null, 2), 'utf-8');

    // Also log to console for debugging
    console.log(`[AUDIT] ${event.eventType}: ${event.title}`, event.user?.name || 'system');
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - we don't want audit logging failures to break the app
  }
}

/**
 * Helper function to create a user login event
 */
export async function logUserLogin(user: EventUser, request?: Request): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'user_login',
    title: `User logged in: ${user.name || user.email}`,
    description: 'User successfully authenticated via GitHub',
    user,
    tags: ['authentication', 'login'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a user logout event
 */
export async function logUserLogout(user: EventUser, request?: Request): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'user_logout',
    title: `User logged out: ${user.name || user.email}`,
    description: 'User signed out',
    user,
    tags: ['authentication', 'logout'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a blog post creation event
 */
export async function logPostCreated(
  postId: string,
  postTitle: string,
  user: EventUser,
  request?: Request
): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'post_created',
    title: `New blog post created: ${postTitle}`,
    description: `Blog post "${postTitle}" was created`,
    user,
    relatedContent: {
      type: 'blog',
      id: postId,
      title: postTitle,
      url: `/blog/${postId}`,
    },
    tags: ['blog', 'content', 'create'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a blog post update event
 */
export async function logPostUpdated(
  postId: string,
  postTitle: string,
  user: EventUser,
  changes?: ChangeDetails,
  request?: Request
): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'post_updated',
    title: `Blog post updated: ${postTitle}`,
    description: `Blog post "${postTitle}" was modified`,
    user,
    relatedContent: {
      type: 'blog',
      id: postId,
      title: postTitle,
      url: `/blog/${postId}`,
    },
    changes,
    tags: ['blog', 'content', 'update'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a mind idea creation event
 */
export async function logMindIdeaCreated(
  ideaId: string,
  ideaTitle: string,
  user: EventUser,
  request?: Request
): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'mind_idea_created',
    title: `New mind idea created: ${ideaTitle}`,
    description: `Mind idea "${ideaTitle}" was created`,
    user,
    relatedContent: {
      type: 'mind',
      id: ideaId,
      title: ideaTitle,
      url: `/mind/${ideaId}`,
    },
    tags: ['mind', 'content', 'create'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a mind thought added event
 */
export async function logMindThoughtAdded(
  ideaId: string,
  ideaTitle: string,
  thoughtId: string,
  user: EventUser,
  request?: Request
): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'mind_thought_added',
    title: `New thought added to: ${ideaTitle}`,
    description: `A new thought was added to mind idea "${ideaTitle}"`,
    user,
    relatedContent: {
      type: 'mind',
      id: ideaId,
      title: ideaTitle,
      url: `/mind/${ideaId}`,
    },
    metadata: {
      thoughtId,
    },
    tags: ['mind', 'thought', 'create'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

/**
 * Helper function to create a comment added event
 */
export async function logCommentAdded(
  postId: string,
  postTitle: string,
  commentId: string,
  user: EventUser,
  request?: Request
): Promise<void> {
  await logEvent({
    timestamp: new Date().toISOString(),
    eventType: 'comment_added',
    title: `New comment on: ${postTitle}`,
    description: `A comment was added to "${postTitle}"`,
    user,
    relatedContent: {
      type: 'blog',
      id: postId,
      title: postTitle,
      url: `/blog/${postId}`,
    },
    metadata: {
      commentId,
    },
    tags: ['comment', 'engagement', 'create'],
    severity: 'info',
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

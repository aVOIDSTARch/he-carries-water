# Audit Logging System

This document explains the audit logging system implemented in the "He Carries Water" blog application.

## Overview

The audit logging system tracks all significant events and user actions on the website, including:
- User authentication (login/logout)
- Blog post creation, updates, and deletion
- Mind idea creation and updates
- Thought additions to mind ideas
- Comment activity
- Media uploads
- Admin dashboard access

## Architecture

### Data Storage

Events are stored as JSON files in `src/content/events/` with one file per day:
- Format: `YYYY-MM-DD.json`
- Example: `2024-12-11.json`

Each file contains an array of event objects that occurred on that day.

### Event Schema

Events conform to the schema defined in `src/content.config.ts`:

```typescript
{
  timestamp: string;           // ISO 8601 datetime
  eventType: EventType;        // Type of event (see below)
  title: string;               // Human-readable title
  description?: string;        // Optional detailed description
  user?: {                     // User who performed the action
    id?: string;
    name?: string;
    email?: string;
  };
  relatedContent?: {           // Related content reference
    type?: 'blog' | 'mind' | 'comment' | 'media' | 'other';
    id?: string;               // Content ID or slug
    title?: string;            // Content title
    url?: string;              // URL to content
  };
  changes?: {                  // For updates/edits
    before?: Record<string, any>;
    after?: Record<string, any>;
    summary?: string;
  };
  metadata?: Record<string, any>;  // Additional flexible data
  tags?: string[];             // Categorization tags
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ipAddress?: string;          // User's IP address
  userAgent?: string;          // User's browser/client
  sessionId?: string;          // Session identifier
}
```

### Event Types

Available event types:
- `post_created` - New blog post created
- `post_updated` - Blog post modified
- `post_deleted` - Blog post removed
- `comment_added` - Comment added to content
- `comment_edited` - Comment modified
- `comment_deleted` - Comment removed
- `mind_idea_created` - New mind idea created
- `mind_idea_updated` - Mind idea modified
- `mind_thought_added` - Thought added to mind idea
- `mind_thought_edited` - Thought modified
- `user_login` - User authenticated successfully
- `user_logout` - User signed out
- `media_uploaded` - Media file uploaded
- `media_deleted` - Media file removed
- `system_update` - System configuration change
- `other` - Other events

## Implementation

### Core Modules

1. **`src/lib/audit-logger.ts`** - Main logging utility
   - `logEvent()` - General event logging function
   - Helper functions for specific event types:
     - `logUserLogin()`
     - `logUserLogout()`
     - `logPostCreated()`
     - `logPostUpdated()`
     - `logMindIdeaCreated()`
     - `logMindThoughtAdded()`
     - `logCommentAdded()`

2. **`src/lib/event-helpers.ts`** - Helper utilities
   - `getUserFromSession()` - Extract user from Astro session
   - `getUserFromRequest()` - Extract user from Request object
   - Example middleware implementation

### Current Implementations

#### 1. Authentication (✅ Implemented)

**Location:** `auth.config.ts`

Logs user login events when authentication succeeds:

```typescript
import { logUserLogin } from "./src/lib/audit-logger";

// In signIn callback:
await logUserLogin({
  id: user?.id,
  name: user?.name,
  email: user?.email,
});
```

#### 2. Admin Dashboard Access (✅ Implemented)

**Location:** `src/pages/admin/index.astro`

Logs whenever an authenticated user accesses the admin dashboard.

#### 3. Blog Post API (✅ Example Created)

**Location:** `src/pages/api/blog/create.ts`

Example API endpoint showing how to log blog post creation:

```typescript
import { logPostCreated } from '../../../lib/audit-logger';

// After creating a blog post:
await logPostCreated(slug, title, {
  name: session.user.name,
  email: session.user.email,
}, request);
```

#### 4. Mind Idea API (✅ Examples Created)

**Locations:**
- `src/pages/api/mind/create.ts` - Mind idea creation
- `src/pages/api/mind/thought.ts` - Thought addition

Examples showing how to log mind-related events.

#### 5. Comment Webhook (✅ Example Created)

**Location:** `src/pages/api/webhooks/giscus.ts`

Webhook handler for Giscus comment events (requires GitHub webhook setup).

## Usage Guide

### Logging a Simple Event

```typescript
import { logEvent } from '@/lib/audit-logger';

await logEvent({
  timestamp: new Date().toISOString(),
  eventType: 'other',
  title: 'Custom event occurred',
  description: 'Description of what happened',
  user: {
    name: 'User Name',
    email: 'user@example.com',
  },
  tags: ['custom', 'event'],
  severity: 'info',
});
```

### Logging Blog Post Creation

```typescript
import { logPostCreated } from '@/lib/audit-logger';

await logPostCreated(
  'my-post-slug',
  'My Post Title',
  { name: 'Author Name', email: 'author@example.com' },
  request  // Optional: for IP and user agent tracking
);
```

### Logging with Change Tracking

```typescript
await logPostUpdated(
  postSlug,
  postTitle,
  { name: user.name, email: user.email },
  {
    summary: 'Updated title and content',
    before: { title: 'Old Title' },
    after: { title: 'New Title' },
  },
  request
);
```

## Viewing Audit Logs

### Reading Event Files

Event logs are stored in `src/content/events/` as JSON files:

```bash
# View today's events
cat src/content/events/2024-12-11.json | jq '.'

# Filter by event type
cat src/content/events/2024-12-11.json | jq '.[] | select(.eventType == "user_login")'

# Count events by type
cat src/content/events/2024-12-11.json | jq 'group_by(.eventType) | map({type: .[0].eventType, count: length})'
```

### Querying with Astro

You can query events using Astro's content collections:

```typescript
import { getCollection } from 'astro:content';

// Get all events
const allEvents = await getCollection('events');

// Filter by event type
const loginEvents = allEvents.filter(
  event => event.data.eventType === 'user_login'
);

// Filter by date range
const recentEvents = allEvents.filter(event => {
  const eventDate = new Date(event.data.timestamp);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return eventDate > weekAgo;
});
```

## Next Steps / TODO

### Admin Pages to Create

When you create admin pages for content management, integrate audit logging:

1. **Blog Management**
   - `/admin/blog/new` - Create new post (use `logPostCreated`)
   - `/admin/blog/edit/[slug]` - Edit post (use `logPostUpdated`)
   - `/admin/blog/delete/[slug]` - Delete post (use custom event)

2. **Mind Idea Management**
   - `/admin/mind/new` - Create idea (use `logMindIdeaCreated`)
   - `/admin/mind/edit/[id]` - Edit idea (use custom event)
   - `/admin/mind/[id]/thought` - Add thought (use `logMindThoughtAdded`)

3. **Media Management**
   - `/admin/media` - Upload media (use custom `logMediaUploaded`)
   - Delete media (use custom event)

### Webhook Setup for Comments

To track Giscus comments automatically:

1. Go to your GitHub repository settings
2. Navigate to Webhooks → Add webhook
3. Set Payload URL to: `https://yourdomain.com/api/webhooks/giscus`
4. Select "Let me select individual events" → Check "Discussion comments"
5. Add a secret and store it in `.env` as `GISCUS_WEBHOOK_SECRET`
6. Update `src/pages/api/webhooks/giscus.ts` to verify signatures

### Admin Event Viewer Pages (✅ Implemented)

**Dashboard Recent Activity** (`/admin`)
- Shows last 10 events on the main dashboard
- Color-coded severity bar on the left side of each card
- Displays event type, user, tags, and timestamp
- Link to view related content
- "View All Activity" link to full event log

**Full Event Log** (`/admin/events`)
- Complete audit trail with pagination (25 events per page)
- Filter by event type and severity level
- Statistics dashboard showing:
  - Total events count
  - Info events count
  - Warning events count
  - Error/Critical events count
- Color-coded severity indicators:
  - 🔵 Blue - Info
  - 🟡 Yellow - Warning
  - 🟠 Orange - Error
  - 🔴 Red - Critical
- Each event card includes:
  - Severity color bar
  - Event title and description
  - Event type badge
  - User information
  - Related tags
  - Timestamp
  - Severity badge
  - Link to related content (if applicable)
  - IP address (if available)

## Security Considerations

1. **Access Control**: Ensure only authenticated admins can view audit logs
2. **Sensitive Data**: Be careful not to log sensitive information (passwords, tokens, etc.)
3. **Webhook Security**: Always verify webhook signatures in production
4. **IP Privacy**: Consider privacy implications of logging IP addresses (GDPR, etc.)
5. **Storage**: Event logs can grow large - implement rotation/archiving if needed

## Benefits

- **Accountability**: Track who did what and when
- **Debugging**: Investigate issues by reviewing event history
- **Analytics**: Understand user behavior and content patterns
- **Compliance**: Meet audit requirements for certain applications
- **Security**: Detect unauthorized access attempts

## Sample Events

See `src/content/events/2024-12-11.json` for example events demonstrating the system.

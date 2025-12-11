# Admin Dashboard Features

## Overview

The admin dashboard now includes a comprehensive activity monitoring system with real-time event tracking and detailed audit logs.

## Features Implemented

### 1. Dashboard Recent Activity Widget

**Location:** `/admin` (Main Dashboard)

**Features:**
- Displays the last 10 events in chronological order (newest first)
- Each event card includes:
  - **Severity color bar** - Vertical colored strip on the left side indicating severity level
  - **Event title** - Clear, human-readable description
  - **Event description** - Additional context (optional)
  - **Event type badge** - Category of the event (login, post created, etc.)
  - **User information** - Who performed the action
  - **Tags** - Up to 3 related tags for quick categorization
  - **Timestamp** - When the event occurred
  - **Severity badge** - Visual indicator of importance level
  - **Related content link** - Direct link to associated blog post, mind idea, etc. (if applicable)
- "View All Activity →" link to full event log
- Graceful empty state when no events exist

**Severity Color Coding:**
- 🔵 **Blue** - Info (normal operations)
- 🟡 **Yellow** - Warning (attention needed)
- 🟠 **Orange** - Error (something went wrong)
- 🔴 **Red** - Critical (urgent attention required)

### 2. Full Activity Log Page

**Location:** `/admin/events`

**Features:**

#### Filtering & Search
- Filter by **event type** (login, post created, etc.)
- Filter by **severity level** (info, warning, error, critical)
- Combined filters work together
- "Clear" button to reset all filters
- URL-based filters (shareable filtered views)

#### Statistics Dashboard
Four stat cards showing:
1. **Total Events** - Complete count of all events
2. **Info Events** - Number of informational events (blue)
3. **Warnings** - Number of warning events (yellow)
4. **Errors** - Combined error and critical events (red)

#### Event Display
- **Pagination** - 25 events per page
- **Navigation** - Previous/Next buttons and page numbers
- **Event cards** with same rich information as dashboard widget
- **IP address tracking** - Shows originating IP when available
- Full timestamp with date and time

#### Design
- Consistent brutalist aesthetic matching the rest of the site
- Monospace fonts throughout
- Bold borders and custom shadows
- Color-coded severity indicators
- Responsive layout for mobile devices

## Usage Examples

### Viewing Recent Activity

1. Log in to `/admin`
2. Scroll to "Recent Activity" section
3. See the last 10 events with color-coded severity bars
4. Click on related content links to navigate to specific items

### Filtering Events

1. Navigate to `/admin/events`
2. Use the filter dropdowns to select:
   - Event Type (e.g., "user_login", "post_created")
   - Severity Level (e.g., "warning", "error")
3. Click "Filter" to apply
4. Click "Clear" to reset filters

### Monitoring Security Events

1. Go to `/admin/events`
2. Filter by event type: "user_login"
3. Review all authentication attempts
4. Check IP addresses for suspicious activity
5. Look for failed login attempts (would show as errors)

## Technical Implementation

### Data Flow

```
Event Occurs → audit-logger.ts → JSON file (daily) → Content Collection → Dashboard Display
```

1. **Event Creation**: `logEvent()` or helper functions called
2. **Storage**: Event written to `src/content/events/YYYY-MM-DD.json`
3. **Retrieval**: Astro Content Collections API fetches events
4. **Processing**: Events flattened, sorted, and filtered
5. **Display**: Rendered in event cards with styling

### Files Modified/Created

**Modified:**
- `src/pages/admin/index.astro` - Added recent activity widget

**Created:**
- `src/pages/admin/events.astro` - Full activity log page with filtering and pagination

### Performance Considerations

- Events are loaded on-demand (not in real-time)
- Pagination limits DOM size to 25 events per page
- Filtering happens server-side during page render
- Daily file structure prevents individual files from becoming too large

## Event Types Currently Tracked

1. **Authentication Events**
   - `user_login` - User successfully logged in
   - `user_logout` - User signed out

2. **Content Events** (via API examples)
   - `post_created` - New blog post created
   - `post_updated` - Blog post modified
   - `post_deleted` - Blog post removed
   - `mind_idea_created` - New mind idea created
   - `mind_idea_updated` - Mind idea modified
   - `mind_thought_added` - Thought added to mind idea
   - `mind_thought_edited` - Thought modified

3. **Comment Events** (via webhook)
   - `comment_added` - Comment posted
   - `comment_edited` - Comment modified
   - `comment_deleted` - Comment removed

4. **Media Events** (ready for implementation)
   - `media_uploaded` - File uploaded
   - `media_deleted` - File removed

5. **System Events**
   - `system_update` - Configuration changed
   - `other` - Custom events (e.g., dashboard access)

## Security & Privacy

- **Access Control**: Only authenticated admin users can view events
- **IP Logging**: Optional - can be disabled for privacy
- **User Agent**: Captured for security monitoring
- **No Sensitive Data**: Passwords, tokens, etc. are never logged
- **GDPR Compliance**: Consider retention policies for production use

## Future Enhancements

### Potential Additions

1. **Real-time Updates**
   - WebSocket connection for live event streaming
   - Toast notifications for critical events

2. **Advanced Filtering**
   - Date range picker
   - Multi-select filters
   - Full-text search across event descriptions

3. **Data Export**
   - Export filtered events as CSV
   - Download audit reports as PDF
   - API endpoint for programmatic access

4. **Visualization**
   - Event timeline chart
   - Activity heatmap by hour/day
   - Event type distribution pie chart

5. **Alerting**
   - Email notifications for critical events
   - Slack/Discord webhooks
   - Configurable alert rules

6. **Retention Management**
   - Auto-archive old events
   - Configurable retention periods
   - Compressed storage for archives

## Maintenance

### Daily Operations

- Events are automatically logged (no manual intervention needed)
- One JSON file created per day in `src/content/events/`
- File names follow pattern: `YYYY-MM-DD.json`

### Cleanup

To remove old events:

```bash
# Remove events older than 90 days
find src/content/events -name "*.json" -mtime +90 -delete
```

### Backup

To backup audit logs:

```bash
# Copy all events to backup location
cp -r src/content/events /path/to/backup/events-$(date +%Y%m%d)
```

## Troubleshooting

### Events Not Showing

1. Check that events exist: `ls src/content/events/`
2. Verify JSON format: `cat src/content/events/YYYY-MM-DD.json | jq`
3. Check console for errors during page load
4. Ensure user is authenticated

### Filtering Not Working

1. Clear browser cache
2. Check URL parameters are correct
3. Verify event types match exact enum values
4. Check that events with those criteria exist

### Performance Issues

1. Reduce events per page (modify `perPage` variable)
2. Archive old events to separate directory
3. Add database backend for large-scale deployments

## Screenshots Reference

### Dashboard Widget
- Clean, card-based layout
- Color bar immediately visible on left
- Event details clearly structured
- Easy-to-scan format

### Full Activity Log
- Comprehensive filtering options
- Statistics at a glance
- Paginated for performance
- Detailed event information

---

**Last Updated:** December 11, 2024
**Status:** ✅ Fully Implemented and Tested

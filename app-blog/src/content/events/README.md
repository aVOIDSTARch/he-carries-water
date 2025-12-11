# Events Directory

This directory contains audit log event files for the "He Carries Water" website.

## File Structure

- Each file represents events from a single day
- Files are named: `YYYY-MM-DD.json`
- Each file contains an array of event objects

## Training Data

### Files with Training Data

The following files contain **training/demo data** for testing and demonstration purposes:

1. **`2025-01-01-TRAINING-DATA.json`** - 25 sample events showing all event types
   - Clearly marked with `[TRAINING DATA]` prefix in titles
   - Contains `"isTrainingData": true` in metadata
   - Includes `"canDelete": true` flag
   - Safe to delete when you're ready for production

2. **`2024-12-11.json`** - 8 example events from initial implementation
   - Original sample data for testing
   - Safe to delete

### Training Data Features

All training events include:
- `[TRAINING DATA]` prefix in the title
- `"TRAINING"` tag in the tags array
- Metadata fields:
  - `"isTrainingData": true`
  - `"canDelete": true`
- Various severity levels (info, warning, error, critical)
- Different event types to demonstrate the system

### Sample Event Types Included

- ✅ User login/logout (authentication)
- ✅ Blog post created/updated/deleted
- ✅ Mind idea created/updated
- ✅ Mind thought added/edited
- ✅ Comment added/edited/deleted
- ✅ Media uploaded/deleted
- ✅ System updates
- ✅ Dashboard access

## Removing Training Data

### Option 1: Manual Deletion

Simply delete the training data files:

```bash
rm src/content/events/2025-01-01-TRAINING-DATA.json
rm src/content/events/2024-12-11.json
```

### Option 2: Use the Cleanup Script

Run the provided cleanup script:

```bash
./scripts/remove-training-data.sh
```

This will automatically remove all training data files and show you what remains.

### Option 3: Filter in Code

You can filter out training data programmatically:

```typescript
// Filter out training events
const realEvents = allEvents.filter(event =>
  !event.metadata?.isTrainingData
);
```

## Production Use

Once you're ready for production:

1. Remove all training data files
2. Real events will be automatically created as users interact with the site
3. Events are logged for:
   - User authentication
   - Admin dashboard access
   - Content creation/updates (when admin pages are built)
   - Comments (when webhook is configured)

## Event Retention

Consider implementing a retention policy:

```bash
# Remove events older than 90 days
find src/content/events -name "*.json" -mtime +90 -delete

# Or archive them instead
mkdir -p archive/events
find src/content/events -name "*.json" -mtime +90 -exec mv {} archive/events/ \;
```

## File Permissions

Event files should be:
- Readable by the web server
- Writable by the application (for logging new events)
- Protected from public access (not in `/public` directory)

## Troubleshooting

### Events not showing in dashboard

1. Check files exist: `ls -la src/content/events/`
2. Verify JSON format: `cat src/content/events/YYYY-MM-DD.json | jq`
3. Check file permissions
4. Restart dev server to reload content collections

### File growing too large

If a daily file becomes too large:
1. Consider splitting events into hourly files
2. Implement automatic archiving
3. Move to a database for high-traffic sites

## Security

- Never commit `.env` files with secrets
- Review events before sharing (may contain IP addresses)
- Consider GDPR implications of logging user data
- Implement appropriate retention policies

---

**Note:** This is a file-based audit log system suitable for small to medium sites. For high-traffic production sites, consider migrating to a database backend.

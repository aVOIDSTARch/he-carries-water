# GitHub Project Pages Implementation Plan

## Overview

Build a system that automatically generates project pages from GitHub repositories, with markdown cached locally and displayed on the `/dev/` route.

## User Requirements (Confirmed)

1. **Admin page** to scan GitHub for all repos, checkbox selection, highlight new repos
2. **Full info** from GitHub (name, description, stars, language, topics, license, contributors, releases) - will prune later if needed
3. **Update strategy**: Refresh available repos on admin page visit; sync markdown content daily
4. **Content source**: Use repo's README.md directly
5. **Config storage**: Save admin selections to `project-admin.config.json` file

---

## Architecture

### File Structure

```text
src/
├── content/
│   └── projects/                    # Cached project markdown/data
│       └── {repo-slug}.json         # Individual project data + README
├── lib/
│   └── github-sync.ts               # GitHub API integration
├── pages/
│   ├── dev.astro                    # Update to show project cards
│   ├── dev/
│   │   ├── index.astro              # Full project listing
│   │   └── [slug].astro             # Individual project page
│   ├── admin/
│   │   └── projects.astro           # Admin: select repos to showcase
│   └── api/
│       └── projects/
│           ├── list-repos.ts        # GET: fetch all repos from GitHub
│           ├── save-config.ts       # POST: save selected repos
│           └── sync.ts              # POST: sync markdown for selected repos
├── components/
│   └── ProjectCard.astro            # Project preview card
└── project-admin.config.json        # Selected repos + last scan metadata
```

### Config File Schema (`project-admin.config.json`)

```json
{
  "lastScannedAt": "2025-12-12T10:00:00Z",
  "lastSyncedAt": "2025-12-12T10:00:00Z",
  "knownRepos": ["repo1", "repo2"],
  "selectedRepos": [
    {
      "owner": "louisc",
      "repo": "project-name",
      "slug": "project-name",
      "addedAt": "2025-12-12T10:00:00Z",
      "featured": false,
      "order": 0
    }
  ]
}
```

### Project Data Schema (`src/content/projects/{slug}.json`)

```json
{
  "slug": "project-name",
  "githubUrl": "https://github.com/louisc/project-name",
  "owner": "louisc",
  "repo": "project-name",
  "name": "Project Name",
  "description": "Repo description from GitHub",
  "stars": 42,
  "forks": 5,
  "language": "TypeScript",
  "topics": ["web", "astro"],
  "license": "MIT",
  "lastPushed": "2025-12-10T15:30:00Z",
  "contributors": [
    { "login": "louisc", "avatarUrl": "...", "contributions": 50 }
  ],
  "latestRelease": {
    "tag": "v1.0.0",
    "name": "Initial Release",
    "publishedAt": "2025-12-01T00:00:00Z"
  },
  "readme": "# Project Name\n\nFull README content here...",
  "lastSyncedAt": "2025-12-12T10:00:00Z"
}
```

---

## Implementation Steps

### Step 1: Create GitHub Sync Library

**File:** `src/lib/github-sync.ts`

- `fetchAllRepos(username)` - Get all public repos for a user
- `fetchRepoDetails(owner, repo)` - Get full repo metadata
- `fetchReadme(owner, repo)` - Get README.md content
- `fetchContributors(owner, repo)` - Get top contributors
- `fetchLatestRelease(owner, repo)` - Get latest release info
- Handle rate limiting and errors gracefully
- Use `GITHUB_TOKEN` env var for authenticated requests (5000/hr vs 60/hr)

### Step 2: Create Admin Projects Page

**File:** `src/pages/admin/projects.astro`

- On page load, call `/api/projects/list-repos` to fetch all GitHub repos
- Compare with `knownRepos` in config to highlight NEW repos
- Display checkbox list of all repos with metadata (stars, language, description)
- "Save Selection" button calls `/api/projects/save-config`
- "Sync Now" button calls `/api/projects/sync` to refresh markdown
- Show last scanned/synced timestamps
- Add link to this page from admin dashboard

### Step 3: Create API Endpoints

**File:** `src/pages/api/projects/list-repos.ts`

- GET endpoint
- Fetches all repos from GitHub API
- Returns array of repo summaries

**File:** `src/pages/api/projects/save-config.ts`

- POST endpoint
- Receives selected repos array
- Updates `project-admin.config.json`
- Marks new repos in `knownRepos`

**File:** `src/pages/api/projects/sync.ts`

- POST endpoint
- Reads selected repos from config
- For each: fetch full details + README
- Writes to `src/content/projects/{slug}.json`
- Updates `lastSyncedAt` in config
- Returns sync status/errors

### Step 4: Create Content Collection

**File:** `src/content.config.ts` (modify)

- Add `projects` collection with zod schema matching the JSON structure

### Step 5: Create Project Pages

**File:** `src/pages/dev/index.astro`

- Read from projects content collection
- Display grid of ProjectCard components
- Sort by order field, then by stars

**File:** `src/pages/dev/[slug].astro`

- Dynamic route for individual projects
- Display full project info + rendered README
- Show metadata sidebar (stars, language, contributors, etc.)
- Link to GitHub repo

### Step 6: Create ProjectCard Component

**File:** `src/components/ProjectCard.astro`

- Follow existing IdeaCard pattern
- Show: name, description, language, stars, topics
- Link to `/dev/{slug}`

### Step 7: Update Dev Landing Page

**File:** `src/pages/dev.astro` (modify)

- Replace placeholder with actual project cards
- Or redirect to `/dev/` index

### Step 8: Add Admin Dashboard Link

**File:** `src/pages/admin/index.astro` (modify)

- Add "Manage Projects" link to admin navigation

### Step 9: Setup Daily Sync (Optional)

Options for daily markdown sync:

- GitHub Action with cron schedule calling `/api/projects/sync`
- Or check `lastSyncedAt` on page load and sync if >24 hours

---

## Key Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/github-sync.ts` | Create - GitHub API library |
| `src/project-admin.config.json` | Create - Admin config storage |
| `src/pages/admin/projects.astro` | Create - Admin repo selection UI |
| `src/pages/api/projects/list-repos.ts` | Create - List GitHub repos |
| `src/pages/api/projects/save-config.ts` | Create - Save repo selection |
| `src/pages/api/projects/sync.ts` | Create - Sync project data |
| `src/content.config.ts` | Modify - Add projects collection |
| `src/content/projects/` | Create - Directory for project JSON |
| `src/pages/dev/index.astro` | Create - Project listing page |
| `src/pages/dev/[slug].astro` | Create - Project detail page |
| `src/components/ProjectCard.astro` | Create - Project card component |
| `src/pages/dev.astro` | Modify - Update landing page |
| `src/pages/admin/index.astro` | Modify - Add projects link |
| `.env` | Modify - Add GITHUB_TOKEN |

---

## Environment Variables

```bash
GITHUB_TOKEN=ghp_xxxx        # Personal access token (required for API)
GITHUB_USERNAME=your-username # Your GitHub username
```

---

## User Flow

1. **Admin visits** `/admin/projects`
2. **Page fetches** all repos from GitHub API
3. **New repos highlighted** (not in `knownRepos`)
4. **Admin checks** repos to showcase
5. **Clicks Save** → config updated
6. **Clicks Sync** → markdown fetched and cached
7. **Public visitors** see projects at `/dev/` and `/dev/{slug}`
8. **Daily**: Sync runs automatically (or on first visit if stale)

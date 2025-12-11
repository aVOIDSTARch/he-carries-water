# He Carries Water - Blog & Mind Garden

A personal blog and mind garden built with Astro, featuring blog posts, evolving ideas, and a secure admin interface.

## Features

### Content Management

- ✅ Blog posts with Markdown & MDX support
- ✅ Mind Garden - evolving ideas with thoughts and changelog
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Comments powered by Giscus (GitHub Discussions)

### Admin & Authentication

- ✅ GitHub OAuth authentication
- ✅ Secure admin dashboard
- ✅ Role-based access control (whitelist-based)
- ✅ Comprehensive audit logging system

### Audit Logging

- ✅ Track all user actions (login, logout, content changes)
- ✅ Daily event logs stored as JSON files
- ✅ Integration with authentication and admin actions
- ✅ Ready for content management integration

See [AUDIT_LOGGING.md](AUDIT_LOGGING.md) for detailed documentation.

## 🚀 Project Structure

```text
├── public/                  # Static assets
├── src/
│   ├── components/         # Astro/Preact components
│   ├── content/
│   │   ├── blog/          # Blog posts (Markdown/MDX)
│   │   ├── mind/          # Mind ideas (JSON)
│   │   └── events/        # Audit log events (JSON, auto-generated)
│   ├── layouts/           # Page layouts
│   ├── lib/               # Utility libraries
│   │   ├── audit-logger.ts      # Audit logging utilities
│   │   └── event-helpers.ts     # Event logging helpers
│   ├── pages/
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── api/           # API endpoints
│   │   │   ├── blog/      # Blog post management APIs
│   │   │   ├── mind/      # Mind idea management APIs
│   │   │   └── webhooks/  # External webhooks (Giscus)
│   │   ├── blog/          # Blog post pages
│   │   └── mind/          # Mind idea pages
│   └── content.config.ts  # Content collections schema
├── auth.config.ts         # Authentication configuration
├── astro.config.mjs       # Astro configuration
├── AUDIT_LOGGING.md       # Audit logging documentation
└── package.json
```

### Content Collections

The `src/content/` directory contains three collections:

- **blog** - Blog posts in Markdown/MDX format
- **mind** - Mind ideas in JSON format with thoughts and changelog
- **events** - Audit log events (auto-generated, one file per day)

See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) for more.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# GitHub OAuth App Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Admin Access Control
ADMIN_GITHUB_USERNAME=your_github_username

# Optional: Webhook Secret for Giscus Comments
GISCUS_WEBHOOK_SECRET=your_webhook_secret
```

### Setting Up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the callback URL to: `http://localhost:4321/api/auth/callback/github` (for development)
4. Copy the Client ID and Client Secret to your `.env` file
5. For production, add your production URL as an additional callback URL

## 🔐 Authentication

The site uses GitHub OAuth for authentication with a whitelist-based access control:

- Only users specified in `ADMIN_GITHUB_USERNAME` can access admin pages
- Login redirects to `/admin` dashboard after successful authentication
- All admin actions are logged to the audit system

### Admin Routes

- `/admin` - Admin dashboard (requires authentication)
- `/admin/login` - Login page (redirects to GitHub OAuth)

## 📊 Audit Logging

The audit logging system automatically tracks:

- **Authentication events** - User login/logout
- **Content operations** - Create, update, delete blog posts and mind ideas
- **Admin access** - Dashboard and page access
- **Comments** - Via Giscus webhook integration

### Viewing Audit Logs

Logs are stored in `src/content/events/` as JSON files (one per day):

```bash
# View today's events
cat src/content/events/2024-12-11.json | jq '.'

# Filter by event type
cat src/content/events/2024-12-11.json | jq '.[] | select(.eventType == "user_login")'
```

For detailed usage, see [AUDIT_LOGGING.md](AUDIT_LOGGING.md).

## 🎨 Customization

### Styling

The site uses TailwindCSS with a custom brutalist design system. Main configuration:

- `tailwind.config.mjs` - Tailwind configuration
- Color scheme defined in CSS variables
- Custom shadow utilities for brutalist aesthetic

### Content

- Blog posts: Add Markdown/MDX files to `src/content/blog/`
- Mind ideas: Add JSON files to `src/content/mind/`
- Both collections have schema validation defined in `src/content.config.ts`

## 🚢 Deployment

The site uses server-side rendering (SSR) with the Node.js adapter:

```bash
npm run build
npm run preview  # Test the build locally
```

Deploy to platforms that support Node.js:
- Vercel
- Netlify
- Railway
- Your own VPS

Make sure to:
1. Set environment variables on your hosting platform
2. Update GitHub OAuth callback URLs for production
3. Configure webhook URLs for Giscus (if using comment logging)

## 📝 Recent Updates

### December 2024

- ✅ Fixed authentication redirect to admin dashboard after login
- ✅ Implemented comprehensive audit logging system
- ✅ Added event tracking for authentication and admin access
- ✅ Created API endpoint examples for content management
- ✅ Set up webhook handler for Giscus comment tracking

## 👀 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Auth.js (Auth Astro)](https://authjs.dev/)
- [Giscus](https://giscus.app/)
- [Tailwind CSS](https://tailwindcss.com/)

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).

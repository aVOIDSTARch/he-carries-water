import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
    }),
});

const mind = defineCollection({
  // Load JSON files in the `src/content/mind/` directory
  loader: glob({ base: "./src/content/mind", pattern: "**/*.json" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    createdDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    hashtags: z.array(z.string()),
    status: z.enum(['active', 'archived', 'on-hold']).optional().default('active'),
    thoughts: z.array(z.object({
      id: z.string(), // unique ID for tracking edits
      date: z.coerce.date(),
      content: z.string(),
      hashtags: z.array(z.string()).optional(),
      editedDate: z.coerce.date().optional(),
    })),
    changelog: z.array(z.object({
      date: z.coerce.date(),
      action: z.enum(['created', 'thought_added', 'thought_edited', 'tagged', 'status_changed', 'archived']),
      description: z.string().optional(),
      thoughtId: z.string().optional(), // reference to thought if applicable
    })),
  }),
});

const events = defineCollection({
  // Load JSON files in the `src/content/events/` directory
  // Activity log for tracking website events (posts, comments, edits, etc.)
  // Note: Each file contains an array of events, not a single event
  loader: glob({ base: "./src/content/events", pattern: "**/*.json" }),
  schema: z.array(z.object({
    // Event metadata
    timestamp: z.coerce.date(),
    eventType: z.enum([
      'post_created',
      'post_updated',
      'post_deleted',
      'comment_added',
      'comment_edited',
      'comment_deleted',
      'mind_idea_created',
      'mind_idea_updated',
      'mind_thought_added',
      'mind_thought_edited',
      'user_login',
      'user_logout',
      'media_uploaded',
      'media_deleted',
      'system_update',
      'other'
    ]),

    // Event details
    title: z.string(), // Human-readable title (e.g., "New blog post published")
    description: z.string().optional(), // Optional detailed description

    // User information (who performed the action)
    user: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
    }).optional(),

    // Related content reference
    relatedContent: z.object({
      type: z.enum(['blog', 'mind', 'comment', 'media', 'other']).optional(),
      id: z.string().optional(), // ID or slug of the related content
      title: z.string().optional(), // Title of the related content
      url: z.string().optional(), // URL to the related content
    }).optional(),

    // Change details (for updates/edits)
    changes: z.object({
      before: z.record(z.string(), z.any()).optional(), // Previous values
      after: z.record(z.string(), z.any()).optional(), // New values
      summary: z.string().optional(), // Summary of changes
    }).optional(),

    // Metadata
    metadata: z.record(z.string(), z.any()).optional(), // Additional flexible data
    tags: z.array(z.string()).optional(),
    severity: z.enum(['info', 'warning', 'error', 'critical']).optional().default('info'),

    // System tracking
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    sessionId: z.string().optional(),
  })),
});

export const collections = { blog, mind, events };

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

export const collections = { blog, mind };

import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'project-admin.config.json');

interface SelectedRepo {
  owner: string;
  repo: string;
  slug: string;
  addedAt: string;
  featured: boolean;
  order: number;
}

interface ProjectConfig {
  lastScannedAt: string | null;
  lastSyncedAt: string | null;
  knownRepos: string[];
  selectedRepos: SelectedRepo[];
}

async function readConfig(): Promise<ProjectConfig> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      lastScannedAt: null,
      lastSyncedAt: null,
      knownRepos: [],
      selectedRepos: [],
    };
  }
}

async function writeConfig(config: ProjectConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export const POST: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { selectedRepos } = body as { selectedRepos: { owner: string; repo: string; featured?: boolean; order?: number }[] };

    if (!Array.isArray(selectedRepos)) {
      return new Response(JSON.stringify({ error: 'selectedRepos must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read current config
    const config = await readConfig();

    // Create a map of existing repos to preserve addedAt dates
    const existingRepos = new Map(
      config.selectedRepos.map(r => [r.repo, r])
    );

    // Update selected repos
    const now = new Date().toISOString();
    config.selectedRepos = selectedRepos.map((repo, index) => {
      const existing = existingRepos.get(repo.repo);
      return {
        owner: repo.owner,
        repo: repo.repo,
        slug: repo.repo.toLowerCase(),
        addedAt: existing?.addedAt || now,
        featured: repo.featured ?? existing?.featured ?? false,
        order: repo.order ?? index,
      };
    });

    await writeConfig(config);

    return new Response(JSON.stringify({
      success: true,
      selectedCount: config.selectedRepos.length,
      message: `Saved ${config.selectedRepos.length} projects`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

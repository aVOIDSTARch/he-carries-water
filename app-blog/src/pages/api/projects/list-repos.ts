import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { fetchAllRepos } from '../../../lib/github-sync';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'project-admin.config.json');

interface ProjectConfig {
  lastScannedAt: string | null;
  lastSyncedAt: string | null;
  knownRepos: string[];
  selectedRepos: {
    owner: string;
    repo: string;
    slug: string;
    addedAt: string;
    featured: boolean;
    order: number;
  }[];
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

export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const username = import.meta.env.GITHUB_USERNAME;
    if (!username) {
      return new Response(JSON.stringify({ error: 'GITHUB_USERNAME not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all repos from GitHub
    const repos = await fetchAllRepos(username);

    // Read current config
    const config = await readConfig();

    // Identify new repos (not in knownRepos)
    const newRepoNames = repos
      .map(r => r.name)
      .filter(name => !config.knownRepos.includes(name));

    // Update config with scan time and known repos
    config.lastScannedAt = new Date().toISOString();
    config.knownRepos = [...new Set([...config.knownRepos, ...repos.map(r => r.name)])];
    await writeConfig(config);

    // Get selected repo names for easy lookup
    const selectedRepoNames = new Set(config.selectedRepos.map(r => r.repo));

    // Return repos with metadata
    const reposWithMeta = repos.map(repo => ({
      ...repo,
      isNew: newRepoNames.includes(repo.name),
      isSelected: selectedRepoNames.has(repo.name),
    }));

    return new Response(JSON.stringify({
      repos: reposWithMeta,
      lastScannedAt: config.lastScannedAt,
      lastSyncedAt: config.lastSyncedAt,
      totalRepos: repos.length,
      newRepos: newRepoNames.length,
      selectedCount: config.selectedRepos.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch repositories',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

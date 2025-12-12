import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { fetchFullProjectData } from '../../../lib/github-sync';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'project-admin.config.json');
const PROJECTS_DIR = path.join(process.cwd(), 'src', 'content', 'projects');

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
    // Read config
    const config = await readConfig();

    if (config.selectedRepos.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        synced: 0,
        message: 'No projects selected to sync',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure projects directory exists
    await fs.mkdir(PROJECTS_DIR, { recursive: true });

    // Get list of existing project files
    const existingFiles = await fs.readdir(PROJECTS_DIR);
    const existingProjects = new Set(
      existingFiles
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
    );

    // Track sync results
    const results: { repo: string; status: 'success' | 'error'; message?: string }[] = [];

    // Sync each selected repo
    for (const repo of config.selectedRepos) {
      try {
        const projectData = await fetchFullProjectData(repo.owner, repo.repo);

        // Add order and featured from config
        const dataToSave = {
          ...projectData,
          featured: repo.featured,
          order: repo.order,
        };

        // Write to content directory
        const filePath = path.join(PROJECTS_DIR, `${repo.slug}.json`);
        await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));

        results.push({ repo: repo.repo, status: 'success' });
      } catch (error) {
        console.error(`Error syncing ${repo.repo}:`, error);
        results.push({
          repo: repo.repo,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Remove project files that are no longer selected
    const selectedSlugs = new Set(config.selectedRepos.map(r => r.slug));
    for (const existingSlug of existingProjects) {
      if (!selectedSlugs.has(existingSlug)) {
        const filePath = path.join(PROJECTS_DIR, `${existingSlug}.json`);
        await fs.unlink(filePath);
      }
    }

    // Update last synced time
    config.lastSyncedAt = new Date().toISOString();
    await writeConfig(config);

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(JSON.stringify({
      success: errorCount === 0,
      synced: successCount,
      errors: errorCount,
      results,
      lastSyncedAt: config.lastSyncedAt,
      message: errorCount > 0
        ? `Synced ${successCount} projects with ${errorCount} errors`
        : `Successfully synced ${successCount} projects`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing projects:', error);
    return new Response(JSON.stringify({
      error: 'Failed to sync projects',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

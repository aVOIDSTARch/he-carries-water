/**
 * GitHub Sync Library
 * Handles fetching repository data from GitHub API
 */

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
  body: string | null;
}

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string;
  createdAt: string;
  isArchived: boolean;
  isFork: boolean;
  owner: string;
}

export interface ProjectData {
  slug: string;
  githubUrl: string;
  owner: string;
  repo: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  license: string | null;
  lastPushed: string;
  homepage: string | null;
  contributors: {
    login: string;
    avatarUrl: string;
    contributions: number;
    profileUrl: string;
  }[];
  latestRelease: {
    tag: string;
    name: string;
    publishedAt: string;
    url: string;
  } | null;
  readme: string;
  lastSyncedAt: string;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'hecarrieswater-sync',
  };

  const token = import.meta.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const headers = getHeaders();

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });

      // Check rate limit
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining && parseInt(remaining) < 10) {
        console.warn(`GitHub API rate limit low: ${remaining} requests remaining`);
      }

      if (response.status === 403) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        if (resetTime) {
          const resetDate = new Date(parseInt(resetTime) * 1000);
          throw new Error(`Rate limited. Resets at ${resetDate.toISOString()}`);
        }
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error('Failed to fetch after retries');
}

/**
 * Fetch all public repositories for a GitHub user
 */
export async function fetchAllRepos(username: string): Promise<RepoSummary[]> {
  const repos: RepoSummary[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.status} ${response.statusText}`);
    }

    const data: GitHubRepo[] = await response.json();

    if (data.length === 0) break;

    for (const repo of data) {
      // Skip private, forked, and archived repos by default
      if (repo.private) continue;

      repos.push({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        url: repo.html_url,
        homepage: repo.homepage,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
        createdAt: repo.created_at,
        isArchived: repo.archived,
        isFork: repo.fork,
        owner: repo.owner.login,
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Fetch detailed repository information
 */
export async function fetchRepoDetails(owner: string, repo: string): Promise<GitHubRepo> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch repo details: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch README content for a repository
 */
export async function fetchReadme(owner: string, repo: string): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    if (response.status === 404) {
      return '# No README\n\nThis repository does not have a README file.';
    }
    throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // README content is base64 encoded
  if (data.content && data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  return '# No README\n\nCould not decode README content.';
}

/**
 * Fetch top contributors for a repository
 */
export async function fetchContributors(owner: string, repo: string, limit = 5): Promise<GitHubContributor[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=${limit}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch contributors: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch the latest release for a repository
 */
export async function fetchLatestRelease(owner: string, repo: string): Promise<GitHubRelease | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/latest`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    if (response.status === 404) {
      return null; // No releases
    }
    throw new Error(`Failed to fetch release: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all project data for a repository
 */
export async function fetchFullProjectData(owner: string, repo: string): Promise<ProjectData> {
  // Fetch all data in parallel
  const [repoDetails, readme, contributors, latestRelease] = await Promise.all([
    fetchRepoDetails(owner, repo),
    fetchReadme(owner, repo),
    fetchContributors(owner, repo),
    fetchLatestRelease(owner, repo),
  ]);

  return {
    slug: repo.toLowerCase(),
    githubUrl: repoDetails.html_url,
    owner: repoDetails.owner.login,
    repo: repoDetails.name,
    name: repoDetails.name,
    description: repoDetails.description || '',
    stars: repoDetails.stargazers_count,
    forks: repoDetails.forks_count,
    language: repoDetails.language,
    topics: repoDetails.topics || [],
    license: repoDetails.license?.spdx_id || null,
    lastPushed: repoDetails.pushed_at,
    homepage: repoDetails.homepage,
    contributors: contributors.map(c => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      contributions: c.contributions,
      profileUrl: c.html_url,
    })),
    latestRelease: latestRelease ? {
      tag: latestRelease.tag_name,
      name: latestRelease.name || latestRelease.tag_name,
      publishedAt: latestRelease.published_at,
      url: latestRelease.html_url,
    } : null,
    readme,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Check if a project needs syncing (older than specified hours)
 */
export function needsSync(lastSyncedAt: string | undefined, maxAgeHours = 24): boolean {
  if (!lastSyncedAt) return true;

  const lastSync = new Date(lastSyncedAt);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync >= maxAgeHours;
}

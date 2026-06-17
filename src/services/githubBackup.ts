export interface GitHubViewer {
  login: string;
}

export interface GitHubBackupRepository {
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  htmlUrl: string;
}

export interface GitHubBackupTarget {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface GitHubLoginUrl {
  url: string;
  mode: 'oauth' | 'token';
}

interface GitHubRepositoryResponse {
  name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

interface GitHubContentResponse {
  sha?: string;
  type?: string;
}

export class GitHubBackupError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
    this.name = 'GitHubBackupError';
  }
}

function normalizeRepoName(repo: string) {
  return repo.trim().replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+|-+$/g, '') || 'link-private-backups';
}

function encodePath(path: string) {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
}

function createOAuthState() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function buildGitHubLoginUrl(): GitHubLoginUrl {
  const clientId = String(import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID ?? '').trim();
  const redirectUri = String(import.meta.env.VITE_GITHUB_OAUTH_REDIRECT_URI ?? window.location.origin).trim();

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo',
      state: createOAuthState()
    });
    return { mode: 'oauth', url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  const params = new URLSearchParams({
    scopes: 'repo',
    description: 'LINK private backup'
  });
  return { mode: 'token', url: `https://github.com/settings/tokens/new?${params.toString()}` };
}

async function parseGitHubError(response: Response) {
  try {
    const body = await response.json() as { message?: string };
    return body.message || response.statusText || 'GitHub 请求失败。';
  } catch {
    return response.statusText || 'GitHub 请求失败。';
  }
}

async function githubApiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new GitHubBackupError(await parseGitHubError(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

function toBackupRepository(response: GitHubRepositoryResponse): GitHubBackupRepository {
  return {
    owner: response.owner.login,
    repo: response.name,
    branch: response.default_branch || 'main',
    private: response.private,
    htmlUrl: response.html_url
  };
}

export async function fetchGitHubViewer(token: string): Promise<GitHubViewer> {
  if (!token.trim()) throw new GitHubBackupError('请先填写 GitHub token。');
  return await githubApiFetch<GitHubViewer>('/user', token.trim());
}

export async function ensureGitHubBackupRepository(target: Pick<GitHubBackupTarget, 'token' | 'owner' | 'repo'>): Promise<GitHubBackupRepository> {
  const token = target.token.trim();
  if (!token) throw new GitHubBackupError('请先填写 GitHub token。');

  const repo = normalizeRepoName(target.repo);
  const owner = target.owner.trim() || (await fetchGitHubViewer(token)).login;

  try {
    const existing = await githubApiFetch<GitHubRepositoryResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, token);
    return toBackupRepository(existing);
  } catch (error) {
    if (!(error instanceof GitHubBackupError) || error.status !== 404) throw error;
  }

  const created = await githubApiFetch<GitHubRepositoryResponse>('/user/repos', token, {
    method: 'POST',
    body: JSON.stringify({
      name: repo,
      private: true,
      auto_init: true,
      description: 'LINK app private backups'
    })
  });

  return toBackupRepository(created);
}

export async function uploadGitHubBackup(target: GitHubBackupTarget, content: string, message: string) {
  const token = target.token.trim();
  const owner = target.owner.trim();
  const repo = normalizeRepoName(target.repo);
  const branch = target.branch.trim() || 'main';
  const path = target.path.trim().replace(/^\/+/, '') || 'link-backup.json';
  let sha = '';

  if (!token || !owner || !repo) throw new GitHubBackupError('GitHub 备份配置不完整。');

  try {
    const existing = await githubApiFetch<GitHubContentResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`, token);
    if (existing.type && existing.type !== 'file') throw new GitHubBackupError('备份路径已被非文件内容占用。');
    sha = existing.sha ?? '';
  } catch (error) {
    if (!(error instanceof GitHubBackupError) || error.status !== 404) throw error;
  }

  await githubApiFetch<GitHubContentResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch,
      ...(sha ? { sha } : {})
    })
  });
}

export function formatGitHubBackupError(error: unknown) {
  if (error instanceof GitHubBackupError) return error.message;
  if (error instanceof Error) return error.message;
  return 'GitHub 备份失败。';
}
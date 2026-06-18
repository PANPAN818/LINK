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

export interface GitHubBackupHistoryItem {
  sha: string;
  committedAt: string;
  message: string;
  downloadPath: string;
}

export interface GitHubLoginUrl {
  url: string;
  mode: 'worker' | 'oauth' | 'token';
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
  content?: string;
  encoding?: string;
  sha?: string;
  type?: string;
  download_url?: string;
}

interface GitHubCommitHistoryResponse {
  sha: string;
  commit: {
    message: string;
    committer: {
      date: string;
    };
  };
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

function decodeBase64(text: string) {
  const normalized = text.replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function createOAuthState() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function buildGitHubLoginUrl(): GitHubLoginUrl {
  const workerUrl = String(import.meta.env.VITE_GITHUB_OAUTH_WORKER_URL ?? '').trim().replace(/\/+$/, '');
  if (workerUrl) {
    const params = new URLSearchParams({ app_origin: window.location.origin });
    return { mode: 'worker', url: `${workerUrl}/github/login?${params.toString()}` };
  }

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

export function getGitHubOAuthWorkerOrigin() {
  const workerUrl = String(import.meta.env.VITE_GITHUB_OAUTH_WORKER_URL ?? '').trim();
  if (!workerUrl) return '';

  try {
    return new URL(workerUrl).origin;
  } catch {
    return '';
  }
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

async function githubApiFetchText(path: string, token: string): Promise<string> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github.raw',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    throw new GitHubBackupError(await parseGitHubError(response), response.status);
  }

  return await response.text();
}

async function fetchGitHubDownloadUrl(url: string, token: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/octet-stream',
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new GitHubBackupError(await parseGitHubError(response), response.status);
  }

  return await response.text();
}

async function readGitHubFileText(apiPath: string, token: string, missingMessage: string) {
  const content = await githubApiFetch<GitHubContentResponse>(apiPath, token);
  if (content.type && content.type !== 'file') throw new GitHubBackupError('备份路径不是文件。');
  if (content.content) {
    if (content.encoding && content.encoding !== 'base64') throw new GitHubBackupError(`暂不支持的 GitHub 内容编码：${content.encoding}`);
    return decodeBase64(content.content);
  }

  try {
    const rawText = await githubApiFetchText(apiPath, token);
    if (rawText) return rawText;
  } catch (error) {
    if (!content.download_url) throw error;
  }

  if (content.download_url) return await fetchGitHubDownloadUrl(content.download_url, token);
  throw new GitHubBackupError(missingMessage);
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
    if (!existing.private) throw new GitHubBackupError('同名仓库不是私有仓库，请更换仓库名或先在 GitHub 改为私有。');
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

export async function downloadGitHubBackup(target: GitHubBackupTarget) {
  const token = target.token.trim();
  const owner = target.owner.trim();
  const repo = normalizeRepoName(target.repo);
  const branch = target.branch.trim() || 'main';
  const path = target.path.trim().replace(/^\/+/, '') || 'link-backup.json';

  if (!token || !owner || !repo) throw new GitHubBackupError('GitHub 备份配置不完整。');

  return await readGitHubFileText(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    token,
    '未找到 GitHub 备份文件内容。'
  );
}

export async function listGitHubBackupHistory(target: GitHubBackupTarget, limit = 3): Promise<GitHubBackupHistoryItem[]> {
  const token = target.token.trim();
  const owner = target.owner.trim();
  const repo = normalizeRepoName(target.repo);
  const branch = target.branch.trim() || 'main';
  const path = target.path.trim().replace(/^\/+/, '') || 'link-backup.json';

  if (!token || !owner || !repo) throw new GitHubBackupError('GitHub 备份配置不完整。');

  const commits = await githubApiFetch<GitHubCommitHistoryResponse[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?path=${encodePath(path)}&sha=${encodeURIComponent(branch)}&per_page=${Math.min(Math.max(limit, 1), 20)}`, token);
  return commits.map((commit) => ({
    sha: commit.sha,
    committedAt: commit.commit.committer.date,
    message: commit.commit.message,
    downloadPath: path
  }));
}

export async function downloadGitHubBackupVersion(target: GitHubBackupTarget, ref: string) {
  const token = target.token.trim();
  const owner = target.owner.trim();
  const repo = normalizeRepoName(target.repo);
  const path = target.path.trim().replace(/^\/+/, '') || 'link-backup.json';

  if (!token || !owner || !repo) throw new GitHubBackupError('GitHub 备份配置不完整。');

  return await readGitHubFileText(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
    token,
    '未找到指定版本的 GitHub 备份文件内容。'
  );
}

export function formatGitHubBackupError(error: unknown) {
  if (error instanceof GitHubBackupError) {
    if (error.status === 401) return 'GitHub token 无效或已过期，请重新登录或粘贴新 token。';
    if (error.status === 403) return 'GitHub token 权限不足、API 限流，或浏览器阻止了请求。';
    if (error.status === 404) return '没有找到 GitHub 仓库或备份文件，请先创建私有仓库并完成一次备份。';
    if (error.status === 409) return 'GitHub 仓库还没有可用分支，请先创建私有仓库或检查默认分支。';
    if (error.status === 422) return `GitHub 拒绝了本次操作：${error.message}`;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'GitHub 备份失败。';
}
<template>
  <section class="data-center">
    <section class="backup-card">
      <header class="card-head">
        <div>
          <span class="card-kicker">本地</span>
          <h3>本地备份</h3>
        </div>
        <Download :size="20" stroke-width="2.2" />
      </header>

      <div class="action-row">
        <button class="primary-action" type="button" :disabled="Boolean(localBusy)" @click="exportBackup">
          <Download :size="16" />
          <span>导出备份</span>
        </button>
        <label class="secondary-action file-action" :class="{ disabled: Boolean(localBusy) }" :aria-disabled="Boolean(localBusy)">
          <Upload :size="16" />
          <span>导入备份</span>
          <input type="file" accept=".json,application/json" :disabled="Boolean(localBusy)" @change="importBackup" />
        </label>
      </div>

      <p v-if="localFeedback" class="feedback" :class="localFeedbackKind">{{ localFeedback }}</p>
    </section>

    <section class="backup-card github-card">
      <header class="card-head">
        <div>
          <span class="card-kicker">GitHub</span>
          <h3>自动备份</h3>
        </div>
        <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
      </header>

      <button class="secondary-action wide-action" type="button" @click="openGitHubLogin">
        <Github :size="16" />
        <span>GitHub 登录</span>
      </button>

      <label class="field">
        <span>GitHub token</span>
        <div class="field-with-action">
          <input v-model="githubToken" type="password" autocomplete="off" placeholder="ghp_..." @change="() => saveGitHubDraft()" />
          <button class="icon-action" type="button" :disabled="Boolean(githubBusy) || !githubToken.trim()" aria-label="连接 GitHub" @click="connectGitHub">
            <Github :size="16" />
          </button>
        </div>
      </label>

      <div class="field-grid">
        <label class="field">
          <span>账号</span>
          <input v-model="ownerDraft" placeholder="username" @change="() => saveGitHubDraft()" />
        </label>
        <label class="field">
          <span>私有仓库</span>
          <input v-model="repoDraft" placeholder="link-private-backups" @change="() => saveGitHubDraft()" />
        </label>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>备份路径</span>
          <input v-model="pathDraft" placeholder="link-backup.json" @change="() => saveGitHubDraft()" />
        </label>
        <label class="field">
          <span>间隔分钟</span>
          <input v-model.number="intervalDraft" min="1" max="1440" step="1" type="number" @change="() => saveGitHubDraft()" />
        </label>
      </div>

      <label class="toggle-card">
        <input type="checkbox" :checked="enabledDraft" @change="toggleAutoBackup" />
        <div>
          <strong>自动后台备份</strong>
          <span>{{ autoBackupLabel }}</span>
        </div>
      </label>

      <div class="action-row">
        <button class="secondary-action" type="button" :disabled="Boolean(githubBusy) || !githubToken.trim()" @click="createPrivateRepository">
          <Lock :size="16" />
          <span>创建私有仓库</span>
        </button>
        <button class="primary-action" type="button" :disabled="Boolean(githubBusy) || !isGitHubReady" @click="runManualGitHubBackup">
          <CloudUpload :size="16" />
          <span>立即备份</span>
        </button>
      </div>

      <p v-if="githubFeedback" class="feedback" :class="githubFeedbackKind">{{ githubFeedback }}</p>
      <p v-else-if="settings.githubBackup.lastBackupError" class="feedback error">{{ settings.githubBackup.lastBackupError }}</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CloudUpload, Download, Github, Lock, Upload } from 'lucide-vue-next';
import { buildGitHubLoginUrl, ensureGitHubBackupRepository, fetchGitHubViewer, formatGitHubBackupError } from '@/services/githubBackup';
import { useAppStore } from '@/stores/appStore';
import type { AppSettings, GitHubBackupSettings } from '@/types/domain';
import { createBackupFilename, downloadLinkBackupFile, parseLinkBackupText } from '@/utils/backup';

const props = defineProps<{
  userId: string;
  settings: AppSettings;
}>();

const store = useAppStore();
const localBusy = ref('');
const localFeedback = ref('');
const localFeedbackKind = ref<'success' | 'error'>('success');
const githubBusy = ref('');
const githubFeedback = ref('');
const githubFeedbackKind = ref<'success' | 'error'>('success');
const githubToken = ref('');
const ownerDraft = ref('');
const repoDraft = ref('');
const branchDraft = ref('main');
const pathDraft = ref('link-backup.json');
const intervalDraft = ref(30);
const enabledDraft = ref(false);

const githubSettings = computed(() => props.settings.githubBackup);
const isGitHubReady = computed(() => Boolean(githubToken.value.trim() && ownerDraft.value.trim() && repoDraft.value.trim()));
const statusClass = computed(() => {
  if (githubSettings.value.lastBackupStatus === 'running') return 'running';
  if (githubSettings.value.lastBackupStatus === 'failed') return 'failed';
  if (githubSettings.value.lastBackupStatus === 'success') return 'success';
  return githubSettings.value.enabled ? 'success' : 'idle';
});
const statusLabel = computed(() => {
  if (githubSettings.value.lastBackupStatus === 'running') return '备份中';
  if (githubSettings.value.lastBackupStatus === 'failed') return '失败';
  if (githubSettings.value.lastBackupAt) return formatBackupTime(githubSettings.value.lastBackupAt);
  return githubSettings.value.enabled ? '已开启' : '未开启';
});
const autoBackupLabel = computed(() => enabledDraft.value ? `每 ${normalizedInterval()} 分钟` : '未开启');

watch(
  () => [
    githubSettings.value.token,
    githubSettings.value.owner,
    githubSettings.value.repo,
    githubSettings.value.branch,
    githubSettings.value.path,
    githubSettings.value.intervalMinutes,
    githubSettings.value.enabled
  ],
  () => syncGitHubDraft(),
  { immediate: true }
);

function syncGitHubDraft() {
  githubToken.value = githubSettings.value.token;
  ownerDraft.value = githubSettings.value.owner;
  repoDraft.value = githubSettings.value.repo;
  branchDraft.value = githubSettings.value.branch;
  pathDraft.value = githubSettings.value.path;
  intervalDraft.value = githubSettings.value.intervalMinutes;
  enabledDraft.value = githubSettings.value.enabled;
}

function normalizedInterval() {
  return Math.min(1440, Math.max(1, Math.round(Number(intervalDraft.value) || githubSettings.value.intervalMinutes || 30)));
}

function buildGitHubDraft(overrides: Partial<GitHubBackupSettings> = {}): GitHubBackupSettings {
  return {
    ...githubSettings.value,
    token: githubToken.value.trim(),
    owner: ownerDraft.value.trim().replace(/^@/, ''),
    repo: repoDraft.value.trim() || 'link-private-backups',
    branch: branchDraft.value.trim() || 'main',
    path: pathDraft.value.trim().replace(/^\/+/, '') || 'link-backup.json',
    intervalMinutes: normalizedInterval(),
    enabled: enabledDraft.value,
    ...overrides
  };
}

async function saveGitHubDraft(overrides: Partial<GitHubBackupSettings> = {}) {
  await store.saveSettings({
    ...props.settings,
    githubBackup: buildGitHubDraft(overrides)
  });
}

function setLocalFeedback(message: string, kind: 'success' | 'error' = 'success') {
  localFeedback.value = message;
  localFeedbackKind.value = kind;
}

function setGitHubFeedback(message: string, kind: 'success' | 'error' = 'success') {
  githubFeedback.value = message;
  githubFeedbackKind.value = kind;
}

function formatBackupTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

async function exportBackup() {
  localBusy.value = 'export';
  localFeedback.value = '';

  try {
    const backup = await store.createBackupFile();
    downloadLinkBackupFile(backup, createBackupFilename(props.userId));
    setLocalFeedback('备份已导出。');
  } catch (error) {
    setLocalFeedback(error instanceof Error ? error.message : '导出失败。', 'error');
  } finally {
    localBusy.value = '';
  }
}

async function importBackup(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!window.confirm('导入备份会替换当前本地数据，继续吗？')) {
    input.value = '';
    return;
  }

  localBusy.value = 'import';
  localFeedback.value = '';

  try {
    const snapshot = parseLinkBackupText(await file.text());
    await store.importBackupSnapshot(snapshot);
    setLocalFeedback('备份已导入。');
  } catch (error) {
    setLocalFeedback(error instanceof Error ? error.message : '导入失败。', 'error');
  } finally {
    input.value = '';
    localBusy.value = '';
  }
}

function openGitHubLogin() {
  const login = buildGitHubLoginUrl();
  window.open(login.url, '_blank', 'noopener,noreferrer');
  setGitHubFeedback(login.mode === 'oauth'
    ? '已打开 GitHub 授权页。静态前端仍需要后端回调来自动换取 token。'
    : '已打开 GitHub token 页面。创建后把 token 粘贴回来即可继续自动创建私有仓库。');
}

async function connectGitHub() {
  githubBusy.value = 'connect';
  githubFeedback.value = '';

  try {
    const viewer = await fetchGitHubViewer(githubToken.value);
    ownerDraft.value = viewer.login;
    await saveGitHubDraft({ owner: viewer.login, lastBackupStatus: 'idle', lastBackupError: '' });
    setGitHubFeedback(`已连接 ${viewer.login}。`);
  } catch (error) {
    setGitHubFeedback(formatGitHubBackupError(error), 'error');
  } finally {
    githubBusy.value = '';
  }
}

async function createPrivateRepository() {
  githubBusy.value = 'repo';
  githubFeedback.value = '';

  try {
    const repository = await ensureGitHubBackupRepository(buildGitHubDraft());
    ownerDraft.value = repository.owner;
    repoDraft.value = repository.repo;
    branchDraft.value = repository.branch || branchDraft.value;
    await saveGitHubDraft({ owner: repository.owner, repo: repository.repo, branch: repository.branch || branchDraft.value, lastBackupStatus: 'idle', lastBackupError: '' });
    setGitHubFeedback(`${repository.owner}/${repository.repo} 已就绪。`);
  } catch (error) {
    setGitHubFeedback(formatGitHubBackupError(error), 'error');
  } finally {
    githubBusy.value = '';
  }
}

async function toggleAutoBackup(event: Event) {
  const input = event.target as HTMLInputElement;
  const checked = input.checked;

  if (checked && !isGitHubReady.value) {
    input.checked = false;
    enabledDraft.value = false;
    setGitHubFeedback('请先连接 GitHub 并创建仓库。', 'error');
    return;
  }

  enabledDraft.value = checked;
  await saveGitHubDraft({ enabled: checked, lastBackupStatus: checked ? githubSettings.value.lastBackupStatus : 'idle', lastBackupError: '' });
  setGitHubFeedback(checked ? '自动备份已开启。' : '自动备份已关闭。');
}

async function runManualGitHubBackup() {
  githubBusy.value = 'backup';
  githubFeedback.value = '';

  try {
    await saveGitHubDraft();
    await store.runGitHubBackup('manual');
    setGitHubFeedback(`已备份到 ${ownerDraft.value}/${repoDraft.value}。`);
  } catch (error) {
    setGitHubFeedback(formatGitHubBackupError(error), 'error');
  } finally {
    githubBusy.value = '';
  }
}
</script>

<style scoped>
.data-center {
  display: grid;
  gap: 14px;
}

.backup-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--soft);
}

.card-head,
.action-row,
.field-with-action,
.toggle-card {
  display: flex;
  align-items: center;
}

.card-head {
  justify-content: space-between;
  gap: 12px;
}

.card-kicker {
  display: block;
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-head h3 {
  margin: 0;
  font-size: 17px;
  line-height: 1.15;
}

.action-row {
  gap: 8px;
}

.primary-action,
.secondary-action,
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
}

.primary-action,
.secondary-action {
  flex: 1;
  gap: 6px;
  min-width: 0;
  padding: 0 12px;
}

.wide-action {
  width: 100%;
}

.primary-action {
  background: #111111;
  color: #ffffff;
}

.secondary-action {
  position: relative;
  background: rgba(255, 255, 255, 0.84);
  color: #202321;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.primary-action:disabled,
.secondary-action:disabled,
.secondary-action.disabled,
.icon-action:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.file-action input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.github-card {
  background: linear-gradient(180deg, #f8faf9, #edf3ef);
}

.status-badge {
  flex: 0 0 auto;
  max-width: 108px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.08);
  color: #3d433f;
  font-size: 11px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge.success {
  background: #dff5e6;
  color: #136c36;
}

.status-badge.failed {
  background: #ffe1e1;
  color: #a82424;
}

.status-badge.running {
  background: #e4ecff;
  color: #315ab6;
}

.field,
.toggle-card {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field span,
.toggle-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.field input {
  min-width: 0;
  width: 100%;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  padding: 11px 12px;
  color: #161917;
  font-size: 13px;
}

.field-with-action {
  gap: 8px;
}

.icon-action {
  flex: 0 0 38px;
  width: 38px;
  padding: 0;
  background: #111111;
  color: #ffffff;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.toggle-card {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.toggle-card input {
  width: 18px;
  height: 18px;
}

.toggle-card strong {
  font-size: 13px;
}

.feedback {
  margin: 0;
  color: #136c36;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.feedback.error {
  color: #a82424;
}

@media (max-width: 360px) {
  .field-grid,
  .action-row {
    grid-template-columns: 1fr;
  }

  .action-row {
    display: grid;
  }
}
</style>
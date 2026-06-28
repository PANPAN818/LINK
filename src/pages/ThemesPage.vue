<template>
  <section class="screen no-tabs themes-page">
    <header class="top-bar themes-topbar">
      <button class="themes-title-button" type="button" aria-label="返回上一页" @click="goBack">
        <h1 class="top-title">Themes</h1>
      </button>
      <button class="header-add-button" type="button" aria-label="导入字体" title="导入字体" @click="openImporter">
        <Plus :size="19" stroke-width="2.4" />
      </button>
    </header>

    <main class="themes-main">
      <section v-if="!store.ready" class="themes-panel loading-panel">
        <LoaderCircle :size="18" class="spin" />
        <p>正在加载主题...</p>
      </section>

      <section v-else class="themes-panel">
        <section v-if="activeTab === 'font'" class="font-library" aria-label="字体主题">
          <header class="font-library-head">
            <div>
              <p class="section-kicker">Font Library</p>
              <h2>{{ activeFontEntry?.name || '系统默认' }}</h2>
            </div>
            <button class="section-action" type="button" :disabled="!fontSettings.activeFontId" @click="resetFont">恢复默认</button>
          </header>

          <section v-if="fontEntries.length" class="font-card-list" aria-label="已导入字体">
            <article v-for="entry in fontEntries" :key="entry.id" class="font-card" :class="{ active: entry.id === fontSettings.activeFontId }">
              <div class="font-card-top">
                <span class="font-mark"><Type :size="18" /></span>
                <div class="font-copy">
                  <strong>{{ entry.name }}</strong>
                  <p>{{ entry.family }}</p>
                </div>
                <span class="status-pill" :class="entry.id === fontSettings.activeFontId ? 'enabled' : 'disabled'">
                  {{ entry.id === fontSettings.activeFontId ? 'Applied' : sourceLabel(entry) }}
                </span>
              </div>

              <div class="font-preview" :style="fontPreviewStyle(entry)">
                <span>LINK Preview</span>
                <strong>与你的角色保持连接</strong>
                <p>中文、English、12345 AaBbCc</p>
              </div>

              <footer class="font-card-footer">
                <span>{{ formatFontMeta(entry) }}</span>
                <div>
                  <button class="card-action" type="button" :disabled="entry.id === fontSettings.activeFontId" @click="applyFont(entry.id)">
                    <Check :size="15" />
                    <span>{{ entry.id === fontSettings.activeFontId ? '已应用' : '应用' }}</span>
                  </button>
                  <button class="card-action danger" type="button" @click="removeFont(entry.id)">
                    <Trash2 :size="15" />
                    <span>删除</span>
                  </button>
                </div>
              </footer>
            </article>
          </section>

          <section v-else class="empty-shell">
            <strong>还没有导入字体</strong>
            <p>点击右上角 +，通过链接或本地字体文件添加到字体库。</p>
          </section>

          <p v-if="feedbackMessage" class="sync-feedback success">{{ feedbackMessage }}</p>
        </section>

        <section v-else class="empty-scope" :aria-label="activeMeta.label">
          <component :is="activeMeta.icon" :size="24" stroke-width="2.2" />
          <strong>{{ activeMeta.label }}</strong>
        </section>
      </section>
    </main>

    <nav class="themes-tabs" aria-label="主题分栏">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="themes-tab"
        :class="{ active: activeTab === tab.id }"
        type="button"
        @click="openTab(tab.id)"
      >
        <component :is="tab.icon" :size="20" stroke-width="2.1" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <AppModal v-model="showImporter" title="导入字体" :show-header="false" fixed-height variant="ins">
      <form class="font-composer font-import-composer" @submit.prevent="submitImporter">
        <section class="composer-hero">
          <span class="composer-avatar"><Type :size="26" /></span>
          <div>
            <span>Font Library</span>
            <strong>{{ activeImportTab === 'link' ? '链接导入' : '文件导入' }}</strong>
            <p>{{ activeImportTab === 'link' ? '支持 CSS 字体链接或单个字体文件链接。' : '支持 WOFF、WOFF2、TTF、OTF 本地文件。' }}</p>
          </div>
        </section>

        <nav class="composer-tabs" aria-label="字体导入方式">
          <button
            v-for="tab in importTabs"
            :key="tab.id"
            class="composer-tab"
            :class="{ active: activeImportTab === tab.id }"
            type="button"
            @click="activeImportTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="activeImportTab === 'link'" class="composer-section form-grid">
          <label class="field">
            <span>字体名称</span>
            <input v-model="linkName" placeholder="例如：霞鹜文楷" />
          </label>

          <label class="field">
            <span>字体族名</span>
            <input v-model="linkFamily" placeholder="例如：LXGW WenKai" />
          </label>

          <label class="field">
            <span>字体链接</span>
            <textarea v-model="linkUrls" rows="5" placeholder="每行一个 .woff2 / .ttf / CSS 链接"></textarea>
          </label>
        </section>

        <section v-else class="composer-section form-grid">
          <label class="field">
            <span>字体名称</span>
            <input v-model="fileName" placeholder="留空则使用文件名" />
          </label>

          <label class="field">
            <span>字体族名</span>
            <input v-model="fileFamily" placeholder="留空则使用文件名" />
          </label>

          <label class="file-drop-card">
            <Upload :size="18" />
            <strong>选择字体文件</strong>
            <span>{{ selectedFontFiles.length ? `${selectedFontFiles.length} 个文件待导入` : 'WOFF / WOFF2 / TTF / OTF' }}</span>
            <input type="file" multiple :accept="fontFileAccept" @change="selectFontFiles" />
          </label>

          <div v-if="selectedFontFiles.length" class="selected-file-list">
            <span v-for="file in selectedFontFiles" :key="`${file.name}-${file.size}-${file.lastModified}`">{{ file.name }}</span>
          </div>
        </section>

        <p v-if="importError" class="sync-feedback error">{{ importError }}</p>

        <div class="composer-footer">
          <button class="footer-button footer-cancel" type="button" @click="showImporter = false">取消</button>
          <button class="footer-button footer-save" type="submit">导入</button>
        </div>
      </form>
    </AppModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Check, Globe2, LoaderCircle, Moon, Plus, Trash2, Type, Upload, Wifi } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { AppSettings, AppThemeSettings, ThemeFontEntry, ThemeFontSource } from '@/types/domain';
import { createId } from '@/utils/id';
import { normalizeAppSettings } from '@/utils/settings';

type ThemeTab = 'font' | 'global' | 'online' | 'offline';
type ImportTab = 'link' | 'file';

const tabs = [
  { id: 'font' as ThemeTab, label: '字体', icon: Type },
  { id: 'global' as ThemeTab, label: '全局', icon: Globe2 },
  { id: 'online' as ThemeTab, label: '线上', icon: Wifi },
  { id: 'offline' as ThemeTab, label: '线下', icon: Moon }
];

const importTabs = [
  { id: 'link' as ImportTab, label: '链接导入' },
  { id: 'file' as ImportTab, label: '文件导入' }
];

const fontFileAccept = '.woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf,application/font-woff,application/x-font-ttf,application/x-font-otf';
const supportedFontExtensions = ['woff', 'woff2', 'ttf', 'otf'];
const fontMimeByExtension: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf'
};

const route = useRoute();
const router = useRouter();
const store = useAppStore();
const showImporter = ref(false);
const activeImportTab = ref<ImportTab>('link');
const linkName = ref('');
const linkFamily = ref('');
const linkUrls = ref('');
const fileName = ref('');
const fileFamily = ref('');
const selectedFontFiles = ref<File[]>([]);
const importError = ref('');
const feedbackMessage = ref('');

const currentSettings = computed<AppSettings>(() => normalizeAppSettings(store.settings));
const themeSettings = computed(() => currentSettings.value.themeSettings);
const fontSettings = computed(() => themeSettings.value.fonts);
const fontEntries = computed(() => fontSettings.value.entries);
const activeTab = computed<ThemeTab>(() => {
  const tab = String(route.query.tab ?? 'font');
  return tabs.some((item) => item.id === tab) ? tab as ThemeTab : 'font';
});
const activeMeta = computed(() => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0]);
const activeFontEntry = computed(() => fontEntries.value.find((entry) => entry.id === fontSettings.value.activeFontId) ?? null);

onMounted(() => {
  void store.hydrate();
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: 'home' });
}

function openTab(tab: ThemeTab) {
  if (tab === activeTab.value) return;
  void router.replace({ name: 'themes', query: tab === 'font' ? {} : { tab } });
}

function cloneFontEntry(entry: ThemeFontEntry): ThemeFontEntry {
  return { ...entry };
}

function cloneThemeSettings(settings: AppThemeSettings): AppThemeSettings {
  return {
    fonts: {
      activeFontId: settings.fonts.activeFontId,
      entries: settings.fonts.entries.map(cloneFontEntry)
    },
    global: {},
    online: {},
    offline: {}
  };
}

function sanitizeFontFamily(value: string) {
  return value.replace(/[{};]/g, '').replace(/\s+/g, ' ').trim();
}

function getFileExtension(fileNameValue: string) {
  return fileNameValue.split('.').pop()?.trim().toLowerCase() ?? '';
}

function stripFontExtension(fileNameValue: string) {
  return fileNameValue.replace(/\.[a-z0-9]+$/i, '').trim();
}

function getFontNameFromUrl(url: string, index: number) {
  try {
    const parsedUrl = new URL(url);
    return stripFontExtension(decodeURIComponent(parsedUrl.pathname.split('/').pop() ?? '')) || parsedUrl.hostname || `字体 ${index + 1}`;
  } catch {
    return stripFontExtension(url.split('/').pop()?.split('?')[0] ?? '') || `字体 ${index + 1}`;
  }
}

function splitFontUrls(value: string) {
  return [...new Set(value.split(/\n+/).map((url) => url.trim()).filter(Boolean))];
}

function createFontEntry(options: { name: string; family: string; source: ThemeFontSource; url?: string; mimeType?: string; size?: number }): ThemeFontEntry {
  const now = Date.now();
  const family = sanitizeFontFamily(options.family);
  return {
    id: createId('theme-font'),
    name: options.name.trim() || family || '自定义字体',
    family,
    source: options.source,
    url: options.source === 'family' ? '' : String(options.url ?? '').trim(),
    mimeType: String(options.mimeType ?? '').trim(),
    size: Math.max(0, Math.round(Number(options.size ?? 0) || 0)),
    enabled: true,
    createdAt: now,
    updatedAt: now
  };
}

async function saveThemeSettings(nextThemeSettings: AppThemeSettings) {
  await store.saveSettings({
    ...currentSettings.value,
    themeSettings: nextThemeSettings
  });
}

function openImporter() {
  activeImportTab.value = 'link';
  importError.value = '';
  showImporter.value = true;
}

function inferFontMimeType(file: File) {
  return file.type || fontMimeByExtension[getFileExtension(file.name)] || 'font/woff2';
}

function isSupportedFontFile(file: File) {
  return supportedFontExtensions.includes(getFileExtension(file.name));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('读取字体文件失败')));
    reader.readAsDataURL(file);
  });
}

function selectFontFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFontFiles.value = Array.from(input.files ?? []);
  input.value = '';
  importError.value = '';
}

async function submitImporter() {
  if (activeImportTab.value === 'link') {
    await importFontLinks();
    return;
  }
  await importFontFiles();
}

async function importFontLinks() {
  const urls = splitFontUrls(linkUrls.value);
  const familyBase = sanitizeFontFamily(linkFamily.value || linkName.value);
  if (!urls.length) {
    importError.value = '请先填写字体链接。';
    return;
  }

  const nextThemeSettings = cloneThemeSettings(themeSettings.value);
  const newEntries = urls.map((url, index) => {
    const fallbackName = getFontNameFromUrl(url, index);
    const family = familyBase || fallbackName;
    const name = linkName.value.trim() || family;
    return createFontEntry({
      name: urls.length > 1 && !linkName.value.trim() ? `${name} ${index + 1}` : name,
      family,
      source: 'url',
      url
    });
  });

  nextThemeSettings.fonts.entries = [...newEntries, ...nextThemeSettings.fonts.entries];
  await saveThemeSettings(nextThemeSettings);
  resetImporterDraft();
  feedbackMessage.value = `已导入 ${newEntries.length} 个字体链接。`;
}

async function importFontFiles() {
  const files = selectedFontFiles.value;
  if (!files.length) {
    importError.value = '请先选择字体文件。';
    return;
  }
  const unsupportedFile = files.find((file) => !isSupportedFontFile(file));
  if (unsupportedFile) {
    importError.value = `${unsupportedFile.name} 不是支持的字体格式。`;
    return;
  }

  const nextThemeSettings = cloneThemeSettings(themeSettings.value);
  const newEntries: ThemeFontEntry[] = [];
  for (const [index, file] of files.entries()) {
    const fallbackName = stripFontExtension(file.name) || `字体 ${index + 1}`;
    const family = sanitizeFontFamily(fileFamily.value || fallbackName);
    const name = fileName.value.trim() || fallbackName;
    newEntries.push(createFontEntry({
      name: files.length > 1 && !fileName.value.trim() ? `${name} ${index + 1}` : name,
      family,
      source: 'file',
      url: await readFileAsDataUrl(file),
      mimeType: inferFontMimeType(file),
      size: file.size
    }));
  }

  nextThemeSettings.fonts.entries = [...newEntries, ...nextThemeSettings.fonts.entries];
  await saveThemeSettings(nextThemeSettings);
  resetImporterDraft();
  feedbackMessage.value = `已导入 ${newEntries.length} 个字体文件。`;
}

function resetImporterDraft() {
  linkName.value = '';
  linkFamily.value = '';
  linkUrls.value = '';
  fileName.value = '';
  fileFamily.value = '';
  selectedFontFiles.value = [];
  importError.value = '';
  showImporter.value = false;
}

async function applyFont(fontId: string) {
  const nextThemeSettings = cloneThemeSettings(themeSettings.value);
  const entry = nextThemeSettings.fonts.entries.find((item) => item.id === fontId);
  if (!entry) return;
  entry.enabled = true;
  entry.updatedAt = Date.now();
  nextThemeSettings.fonts.activeFontId = fontId;
  await saveThemeSettings(nextThemeSettings);
  feedbackMessage.value = `已应用 ${entry.name}。`;
}

async function removeFont(fontId: string) {
  const nextThemeSettings = cloneThemeSettings(themeSettings.value);
  nextThemeSettings.fonts.entries = nextThemeSettings.fonts.entries.filter((entry) => entry.id !== fontId);
  if (nextThemeSettings.fonts.activeFontId === fontId) nextThemeSettings.fonts.activeFontId = '';
  await saveThemeSettings(nextThemeSettings);
}

async function resetFont() {
  const nextThemeSettings = cloneThemeSettings(themeSettings.value);
  nextThemeSettings.fonts.activeFontId = '';
  await saveThemeSettings(nextThemeSettings);
  feedbackMessage.value = '已恢复系统默认字体。';
}

function fontPreviewStyle(entry: ThemeFontEntry) {
  return { fontFamily: entry.family };
}

function isStylesheetFontUrl(url: string) {
  const normalizedUrl = url.trim().toLowerCase();
  return normalizedUrl.endsWith('.css') || normalizedUrl.includes('fonts.googleapis.com/css') || normalizedUrl.includes('fontsapi.zeoseven.com');
}

function sourceLabel(entry: ThemeFontEntry) {
  if (entry.source === 'file') return 'File';
  if (entry.source === 'url' && isStylesheetFontUrl(entry.url)) return 'CSS Link';
  if (entry.source === 'url') return 'Link';
  return 'Text';
}

function formatFileSize(size: number) {
  if (!size) return '';
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function formatFontMeta(entry: ThemeFontEntry) {
  const size = formatFileSize(entry.size);
  if (entry.source === 'file') return [entry.mimeType || 'Font file', size].filter(Boolean).join(' · ');
  if (entry.source === 'url') return isStylesheetFontUrl(entry.url) ? 'CSS stylesheet' : 'Remote font file';
  return 'System font stack';
}
</script>

<style scoped>
.themes-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-bottom: 0;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 8% 0%, rgba(255, 218, 227, 0.5), transparent 30%),
    radial-gradient(circle at 94% 10%, rgba(6, 199, 85, 0.14), transparent 28%),
    linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 52%, #edf3f1 100%);
}

.themes-topbar {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  background: rgba(251, 252, 251, 0.92);
  backdrop-filter: blur(18px);
}

.themes-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  margin-right: auto;
  padding: 0;
  color: inherit;
  text-align: left;
}

.themes-title-button .top-title {
  margin: 0;
}

.themes-title-button:active {
  opacity: 0.7;
}

.header-add-button {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  min-height: 34px;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #057a35;
  box-shadow: 0 10px 24px rgba(6, 199, 85, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.themes-main {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px 16px 18px;
}

.themes-panel {
  display: grid;
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
}

.loading-panel,
.empty-scope {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 240px;
  color: #69706a;
  font-size: 12px;
  font-weight: 800;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.font-library,
.font-card-list {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.font-library-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.font-library-head > div {
  display: grid;
  gap: 3px;
  min-width: 0;
  margin-right: auto;
}

.section-kicker,
.composer-hero span,
.field span {
  margin: 0;
  color: #9d7a86;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.font-library-head h2 {
  margin: 0;
  overflow: hidden;
  color: #111111;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-action {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f6f4;
  color: #363a40;
  font-size: 12px;
  font-weight: 900;
}

.section-action:disabled {
  opacity: 0.42;
  cursor: default;
}

.font-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.06);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 248, 251, 0.96));
  box-shadow: 0 12px 32px rgba(26, 30, 38, 0.06);
}

.font-card.active {
  border-color: rgba(6, 199, 85, 0.28);
  background:
    radial-gradient(circle at top right, rgba(6, 199, 85, 0.1), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 252, 248, 0.96));
}

.font-card-top {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.font-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 18px;
  background: #eef8f1;
  color: #057a35;
}

.font-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.font-copy strong,
.font-copy p {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-copy strong {
  color: #111111;
  font-size: 15px;
  font-weight: 900;
}

.font-copy p,
.font-card-footer > span,
.empty-shell p,
.sync-feedback {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.status-pill.enabled {
  background: #e7f8ec;
  color: #138046;
}

.status-pill.disabled {
  background: #f1f3f6;
  color: #79808a;
}

.font-preview {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #111111, #27322b);
  color: #ffffff;
}

.font-preview span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 900;
}

.font-preview strong {
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: 0;
}

.font-preview p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.font-card-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.font-card-footer > span {
  min-width: 0;
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-card-footer > div {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f6f4;
  color: #363a40;
  font-size: 12px;
  font-weight: 900;
}

.card-action:disabled {
  opacity: 0.48;
  cursor: default;
}

.card-action.danger {
  background: #fff1f4;
  color: #d7354b;
}

.empty-shell {
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px dashed rgba(17, 17, 17, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.75);
}

.empty-shell strong,
.composer-hero strong {
  font-size: 18px;
  font-weight: 800;
}

.sync-feedback {
  margin: 0;
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 800;
}

.sync-feedback.success {
  background: #eef8f1;
  color: #057a35;
}

.sync-feedback.error {
  background: rgba(239, 68, 90, 0.1);
  color: #d7354b;
}

.font-composer {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.composer-hero {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 209, 224, 0.65), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 248, 252, 0.94));
}

.composer-avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: #eef8f1;
  color: #057a35;
}

.composer-hero > div {
  min-width: 0;
}

.composer-hero span,
.composer-hero strong {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-hero p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.composer-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.composer-tab {
  min-height: 40px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #6f7079;
  font-size: 12px;
  font-weight: 800;
}

.composer-tab.active {
  background: linear-gradient(180deg, #111111, #2c2f39);
  color: #ffffff;
}

.composer-section {
  min-height: 0;
  align-content: start;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.form-grid {
  display: grid;
  gap: 10px;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field input,
.field textarea {
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #171717;
  font-size: 12px;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06);
}

.field textarea {
  resize: vertical;
  line-height: 1.45;
}

.file-drop-card {
  position: relative;
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 142px;
  padding: 18px;
  border: 1px dashed rgba(17, 17, 17, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  color: #363a40;
  text-align: center;
}

.file-drop-card strong,
.file-drop-card span {
  display: block;
}

.file-drop-card strong {
  font-size: 14px;
}

.file-drop-card span {
  color: var(--muted);
  font-size: 12px;
}

.file-drop-card input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.selected-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.selected-file-list span {
  max-width: 100%;
  overflow: hidden;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #69706a;
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  width: 100%;
  align-self: end;
}

.footer-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 800;
}

.footer-cancel {
  border-radius: 16px 0 0 16px;
  background: rgba(255, 255, 255, 0.88);
  color: #4f535b;
}

.footer-save {
  border-radius: 0 16px 16px 0;
  background: linear-gradient(180deg, #1f2229, #373b45);
  color: #ffffff;
}

:global(.modal-panel .modal-body .font-import-composer.font-import-composer .composer-footer) {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
  gap: 0 !important;
  width: 100% !important;
}

:global(.modal-panel .modal-body .font-import-composer.font-import-composer .footer-button) {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 42px !important;
  border-radius: 0 !important;
}

:global(.modal-panel .modal-body .font-import-composer.font-import-composer .footer-cancel) {
  border-radius: 16px 0 0 16px !important;
}

:global(.modal-panel .modal-body .font-import-composer.font-import-composer .footer-save) {
  border-radius: 0 16px 16px 0 !important;
}

.themes-tabs {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px;
  padding: 7px calc(8px + var(--safe-right)) calc(9px + var(--safe-bottom)) calc(8px + var(--safe-left));
  border-top: 1px solid rgba(17, 17, 17, 0.05);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
}

.themes-tab {
  display: grid;
  justify-items: center;
  gap: 3px;
  min-width: 0;
  min-height: 46px;
  padding: 6px 2px;
  border-radius: 13px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}

.themes-tab span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.themes-tab.active {
  background: #eef8f1;
  color: #111111;
}

.themes-tab svg {
  width: 19px;
  height: 19px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 420px) {
  .themes-main {
    padding-inline: 10px;
  }

  .themes-panel {
    padding: 12px;
    border-radius: 18px;
  }

  .font-card {
    padding: 12px;
    border-radius: 18px;
  }

  .font-card-top {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .font-mark {
    width: 42px;
    height: 42px;
    border-radius: 16px;
  }

  .status-pill {
    grid-column: 2;
    justify-self: start;
  }

  .font-card-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .font-card-footer > div,
  .card-action {
    width: 100%;
  }
}
</style>
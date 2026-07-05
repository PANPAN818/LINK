<template>
  <MobileShell />
  <GlobalVoomNotice />
  <GlobalSmallTheaterNotice />
  <FirstRunDisclaimer v-if="showDisclaimer" :model-value="showDisclaimer" @complete="handleDisclaimerComplete" />
  <AppModal v-model="store.configAlert.open" :title="store.configAlert.title">
    <section class="config-alert">
      <p>{{ store.configAlert.message }}</p>
    </section>
  </AppModal>
  <audio ref="musicAudioRef" class="global-music-audio" preload="metadata"></audio>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import MobileShell from '@/components/layout/MobileShell.vue';
import AppModal from '@/components/common/AppModal.vue';
import FirstRunDisclaimer from '@/components/common/FirstRunDisclaimer.vue';
import GlobalSmallTheaterNotice from '@/components/common/GlobalSmallTheaterNotice.vue';
import GlobalVoomNotice from '@/components/common/GlobalVoomNotice.vue';
import { syncKeepAlive } from '@/services/keepAlive';
import { useAppStore } from '@/stores/appStore';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import type { ThemeFontEntry, ThemeStylePreset, ThemeStyleScopeSettings } from '@/types/domain';
import { defaultOfflineThemeCss, defaultOfflineThemePresetId, defaultOnlineThemeCss, defaultOnlineThemePresetId } from '@/utils/themeStyles';

const store = useAppStore();
const route = useRoute();
const musicPlayer = useMusicPlayerStore();
const musicAudioRef = ref<HTMLAudioElement | null>(null);
let githubAutoBackupTimer: number | undefined;
const themeFontStyleId = 'link-theme-fonts';
const onlineThemeStyleId = 'link-online-theme-styles';
const offlineThemeStyleId = 'link-offline-theme-styles';
const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const showDisclaimer = computed(() => store.ready && !store.settings?.disclaimerAccepted);
const githubBackupScheduleKey = computed(() => {
  const backup = store.settings?.githubBackup;
  if (!store.ready || !backup?.enabled || !backup.token || !backup.owner || !backup.repo) return '';
  return [backup.owner, backup.repo, backup.branch, backup.path, backup.intervalMinutes].join('|');
});
const themeFontSettings = computed(() => store.settings?.themeSettings.fonts ?? { activeFontId: '', entries: [] as ThemeFontEntry[] });
const onlineThemeSettings = computed(() => store.settings?.themeSettings.online ?? { activePresetId: '', presets: [] });
const offlineThemeSettings = computed(() => store.settings?.themeSettings.offline ?? { activePresetId: '', presets: [] });
const routeConversationId = computed(() => {
  if (!['chat-room', 'offline-room'].includes(String(route.name ?? ''))) return '';
  const rawId = route.params.id;
  return Array.isArray(rawId) ? String(rawId[0] ?? '') : String(rawId ?? '');
});
const routeCharacter = computed(() => {
  const conversation = routeConversationId.value ? store.conversationById(routeConversationId.value) : null;
  return conversation ? store.characterById(conversation.charId) : null;
});
const keepAliveSettings = computed(() => store.settings?.keepAlive ?? null);

function sanitizeCssText(value: string) {
  return value.replace(/[{};]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function getThemeFontFamilyStack(entry: ThemeFontEntry | null) {
  const family = sanitizeCssText(entry?.family ?? '');
  if (!family) return '';
  return family.includes(',') ? family : `"${escapeCssString(family)}", ${systemFontStack}`;
}

function isStylesheetFontUrl(url: string) {
  const normalizedUrl = url.trim().toLowerCase();
  return normalizedUrl.endsWith('.css') || normalizedUrl.includes('fonts.googleapis.com/css') || normalizedUrl.includes('fontsapi.zeoseven.com');
}

function getThemeFontStyleElement() {
  let styleElement = document.getElementById(themeFontStyleId) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = themeFontStyleId;
    document.head.appendChild(styleElement);
  }
  return styleElement;
}

function getOnlineThemeStyleElement() {
  let styleElement = document.getElementById(onlineThemeStyleId) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = onlineThemeStyleId;
    document.head.appendChild(styleElement);
  }
  return styleElement;
}

function getOfflineThemeStyleElement() {
  let styleElement = document.getElementById(offlineThemeStyleId) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = offlineThemeStyleId;
    document.head.appendChild(styleElement);
  }
  return styleElement;
}

function setAppFontFamily(fontFamilyStack: string) {
  const targets = [document.documentElement, document.body, document.getElementById('app')].filter((target): target is HTMLElement => Boolean(target));
  targets.forEach((target) => {
    if (fontFamilyStack) target.style.setProperty('--app-font-family', fontFamilyStack);
    else target.style.removeProperty('--app-font-family');
  });
}

function applyThemeFonts() {
  if (typeof document === 'undefined') return;

  const enabledFontEntries = themeFontSettings.value.entries.filter((entry) => entry.enabled && entry.family.trim());
  const activeFontEntry = enabledFontEntries.find((entry) => entry.id === themeFontSettings.value.activeFontId) ?? null;
  const stylesheetImports: string[] = [];
  const fontFaces: string[] = [];

  enabledFontEntries
    .filter((entry) => entry.source !== 'family' && entry.url.trim())
    .forEach((entry) => {
      const escapedUrl = escapeCssString(entry.url.trim());
      if (entry.source === 'url' && isStylesheetFontUrl(entry.url)) {
        stylesheetImports.push(`@import url("${escapedUrl}");`);
        return;
      }

      fontFaces.push(`@font-face { font-family: "${escapeCssString(sanitizeCssText(entry.family))}"; src: url("${escapedUrl}"); font-weight: 100 900; font-style: normal; font-display: swap; }`);
    });

  getThemeFontStyleElement().textContent = [...stylesheetImports, ...fontFaces].join('\n');

  const fontFamilyStack = getThemeFontFamilyStack(activeFontEntry);
  setAppFontFamily(fontFamilyStack);
}

function resolveThemePresetCss(settings: ThemeStyleScopeSettings, defaultPresetId: string, defaultCss: string, localPresetId = '') {
  const localId = localPresetId.trim();
  if (localId === defaultPresetId) return defaultCss;
  const localPreset = localId ? settings.presets.find((entry: ThemeStylePreset) => entry.id === localId) : null;
  if (localPreset?.css.trim()) return localPreset.css.trim();

  const globalPreset = settings.activePresetId ? settings.presets.find((entry: ThemeStylePreset) => entry.id === settings.activePresetId) : null;
  return globalPreset?.css.trim() || defaultCss;
}

function applyOnlineThemeStyles() {
  if (typeof document === 'undefined') return;
  getOnlineThemeStyleElement().textContent = resolveThemePresetCss(
    onlineThemeSettings.value,
    defaultOnlineThemePresetId,
    defaultOnlineThemeCss,
    routeCharacter.value?.themeStyleBindings?.onlinePresetId
  );
}

function applyOfflineThemeStyles() {
  if (typeof document === 'undefined') return;
  getOfflineThemeStyleElement().textContent = resolveThemePresetCss(
    offlineThemeSettings.value,
    defaultOfflineThemePresetId,
    defaultOfflineThemeCss,
    routeCharacter.value?.themeStyleBindings?.offlinePresetId
  );
}

function clearGitHubAutoBackupTimer() {
  if (!githubAutoBackupTimer) return;
  window.clearInterval(githubAutoBackupTimer);
  githubAutoBackupTimer = undefined;
}

function getGitHubBackupIntervalMs() {
  const minutes = Math.max(1, store.settings?.githubBackup.intervalMinutes ?? 30);
  return minutes * 60 * 1000;
}

async function runGitHubAutoBackupIfDue() {
  const backup = store.settings?.githubBackup;
  if (!backup?.enabled || !backup.token || !backup.owner || !backup.repo) return;

  const intervalMs = getGitHubBackupIntervalMs();
  if (backup.lastBackupAt && Date.now() - backup.lastBackupAt < intervalMs) return;

  try {
    await store.runGitHubBackup('auto');
  } catch {
    return;
  }
}

watch(
  githubBackupScheduleKey,
  (scheduleKey) => {
    clearGitHubAutoBackupTimer();
    if (!scheduleKey) return;

    void runGitHubAutoBackupIfDue();
    githubAutoBackupTimer = window.setInterval(() => {
      void runGitHubAutoBackupIfDue();
    }, getGitHubBackupIntervalMs());
  },
  { immediate: true }
);

watch(themeFontSettings, applyThemeFonts, { immediate: true, deep: true });
watch(onlineThemeSettings, applyOnlineThemeStyles, { immediate: true, deep: true });
watch(offlineThemeSettings, applyOfflineThemeStyles, { immediate: true, deep: true });
watch(routeCharacter, () => {
  applyOnlineThemeStyles();
  applyOfflineThemeStyles();
}, { immediate: true, deep: true });
watch(keepAliveSettings, syncKeepAlive, { immediate: true, deep: true });

onMounted(() => {
  musicPlayer.setAudioElement(musicAudioRef.value);
});

onBeforeUnmount(() => {
  clearGitHubAutoBackupTimer();
  setAppFontFamily('');
  document.getElementById(themeFontStyleId)?.remove();
  document.getElementById(onlineThemeStyleId)?.remove();
  document.getElementById(offlineThemeStyleId)?.remove();
  musicPlayer.setAudioElement(null);
});

async function handleDisclaimerComplete() {
  if (!store.settings) return;
  await store.saveSettings({
    ...store.settings,
    disclaimerAccepted: true
  });
}
</script>

<style scoped>
.config-alert p {
  margin: 0;
  color: #363a40;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.global-music-audio {
  display: none;
}
</style>

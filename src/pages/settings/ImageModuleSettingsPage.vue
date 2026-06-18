<template>
  <section class="screen no-tabs image-module-page">
    <header class="top-bar image-module-topbar">
      <button class="image-module-title-button" type="button" aria-label="返回图片设置" @click="goBack">
        <h1 class="top-title">{{ activeMeta.title }}</h1>
      </button>
    </header>

    <main class="image-module-main">
      <section v-if="store.ready" class="image-module-panel">
        <ImageModuleConfigurator :settings="currentSettings" :module-id="activeModule" @save="saveSettings" />
      </section>
      <section v-else class="loading-card">
        <p>正在加载图片设置...</p>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageModuleConfigurator from '@/components/settings/ImageModuleConfigurator.vue';
import { useAppStore } from '@/stores/appStore';
import type { AppSettings, ImageModuleId } from '@/types/domain';
import { normalizeAppSettings } from '@/utils/settings';

const moduleMetas = [
  { id: 'openai' as ImageModuleId, title: 'OpenAI' },
  { id: 'novelai' as ImageModuleId, title: 'NovelAI' },
  { id: 'pollinations' as ImageModuleId, title: 'Pollinations' }
];

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const currentSettings = computed<AppSettings>(() => normalizeAppSettings(store.settings));
const activeModule = computed<ImageModuleId>(() => {
  const moduleId = String(route.params.module ?? '').trim();
  return moduleMetas.some((item) => item.id === moduleId) ? moduleId as ImageModuleId : 'openai';
});
const activeMeta = computed(() => moduleMetas.find((item) => item.id === activeModule.value) ?? moduleMetas[0]);

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: 'settings', query: { tab: 'image' } });
}

async function saveSettings(nextSettings: AppSettings) {
  await store.saveSettings(nextSettings);
}
</script>

<style scoped>
.image-module-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background:
    radial-gradient(circle at 8% 0%, rgba(255, 218, 227, 0.54), transparent 30%),
    radial-gradient(circle at 94% 10%, rgba(6, 199, 85, 0.14), transparent 28%),
    linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 52%, #edf3f1 100%);
}

.image-module-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 0;
  background: rgba(251, 252, 251, 0.9);
  backdrop-filter: blur(18px);
}

.image-module-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  margin-right: auto;
  padding: 0;
  color: inherit;
}

.image-module-title-button .top-title {
  margin: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-module-main {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px calc(16px + var(--safe-right)) calc(22px + var(--safe-bottom)) calc(16px + var(--safe-left));
}

.image-module-panel,
.loading-card {
  display: grid;
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
  font-size: 12px;
}

.loading-card {
  place-items: center;
  min-height: 240px;
  color: #69706a;
  font-size: 12px;
}

.image-module-main :deep(input),
.image-module-main :deep(textarea),
.image-module-main :deep(select) {
  font-size: 12px;
}

@media (max-width: 420px) {
  .image-module-main {
    padding-inline: max(10px, var(--safe-left)) max(10px, var(--safe-right));
  }

  .image-module-panel,
  .loading-card {
    padding: 12px;
    border-radius: 18px;
  }
}
</style>
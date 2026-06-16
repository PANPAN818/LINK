<template>
  <section class="screen no-tabs world-book-page">
    <header class="top-bar world-book-topbar">
      <button class="world-book-title-button" type="button" aria-label="返回首页" @click="goBack">
        <h1 class="top-title">World Book</h1>
      </button>

      <button class="world-book-create-button" type="button" aria-label="新建世界书" @click="openCreateWorldBook">
        <Plus :size="20" stroke-width="2.4" />
      </button>
    </header>

    <main class="world-book-main">
      <section v-if="store.ready" class="world-book-panel">
        <WorldBookShelf ref="worldBookShelfRef" :books="filteredBooks" :create-scope="activeScope" />
      </section>
      <section v-else class="loading-card">
        <p>正在为你的书架装帧...</p>
      </section>
    </main>

    <nav v-if="store.ready" class="world-book-scope-tabs" aria-label="世界书作用域筛选">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="world-book-scope-tab"
        :class="{ active: activeScope === filter.id }"
        type="button"
        @click="setScope(filter.id)"
      >
        <component :is="filter.icon" :size="20" stroke-width="2.1" />
        <span>{{ filter.shortLabel }}</span>
        <small>{{ scopeCount(filter.id) }}</small>
      </button>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { BookOpen, BookOpenText, Globe2, Plus, UserRound } from 'lucide-vue-next';
import WorldBookShelf from '@/components/home/WorldBookShelf.vue';
import { useAppStore } from '@/stores/appStore';
import type { WorldBookEntry } from '@/types/domain';

type ScopeFilter = 'all' | WorldBookEntry['scope'];

const router = useRouter();
const store = useAppStore();
const worldBookShelfRef = ref<InstanceType<typeof WorldBookShelf> | null>(null);
const activeScope = ref<ScopeFilter>('all');

const filters = [
  { id: 'all' as ScopeFilter, shortLabel: '全部', icon: BookOpen },
  { id: 'global-online' as ScopeFilter, shortLabel: '线上', icon: Globe2 },
  { id: 'global-offline' as ScopeFilter, shortLabel: '线下', icon: BookOpenText },
  { id: 'local' as ScopeFilter, shortLabel: '局部', icon: UserRound }
];

const scopeCounts = computed(() => ({
  'global-online': store.worldBooks.filter((book) => book.scope === 'global-online').length,
  'global-offline': store.worldBooks.filter((book) => book.scope === 'global-offline').length,
  local: store.worldBooks.filter((book) => book.scope === 'local').length
}));

const filteredBooks = computed(() => {
  if (activeScope.value === 'all') return store.worldBooks;
  return store.worldBooks.filter((book) => book.scope === activeScope.value);
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: 'home' });
}

function openCreateWorldBook() {
  worldBookShelfRef.value?.openCreateModal();
}

function setScope(scope: ScopeFilter) {
  activeScope.value = scope;
}

function scopeCount(scope: ScopeFilter) {
  if (scope === 'all') return store.worldBooks.length;
  return scopeCounts.value[scope];
}
</script>

<style scoped>
.world-book-page {
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
  background:
    radial-gradient(circle at top left, rgba(6, 199, 85, 0.12), transparent 34%),
    radial-gradient(circle at top right, rgba(255, 214, 224, 0.4), transparent 28%),
    linear-gradient(180deg, #fffdfd 0%, #f6f8f7 56%, #eef3f0 100%);
}

.world-book-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
}

.world-book-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  margin-right: auto;
}

.world-book-title-button .top-title {
  margin: 0;
  font-size: 17px;
  text-align: left;
}

.world-book-create-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  color: #111111;
}

.world-book-main {
  flex: 1;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  overflow-y: auto;
  padding: 10px 16px 14px;
}

.world-book-panel,
.loading-card {
  display: grid;
  padding: 13px;
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

.world-book-scope-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(17, 17, 17, 0.05);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
}

.world-book-scope-tab {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 3px;
  min-height: 44px;
  padding: 5px 4px;
  border-radius: 14px;
  color: #7c847f;
  font-size: 9px;
  font-weight: 800;
}

.world-book-scope-tab.active {
  background: #eef8f1;
  color: #111111;
}

.world-book-scope-tab svg {
  width: 18px;
  height: 18px;
}

.world-book-scope-tab small {
  position: absolute;
  top: 4px;
  right: calc(50% - 25px);
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background: #eef8f1;
  color: #2c7544;
  font-size: 8px;
  line-height: 15px;
  text-align: center;
}

.world-book-scope-tab.active small {
  background: #ffffff;
}

@media (min-width: 480px) {
  .world-book-main {
    padding-inline: 16px;
  }
}
</style>
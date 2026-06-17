<template>
  <div class="world-shelf">
    <section class="library-card">
      <div class="section-head">
        <p class="eyebrow">Cover shelf</p>
      </div>

      <div v-if="visibleBooks.length" class="shelf-grid">
        <article
          v-for="entry in visibleBooks"
          :key="entry.id"
          class="book-tile"
          :class="[scopeClass(entry.scope), { disabled: !entry.enabled }]"
        >
          <button class="cover-button" type="button" @click="openEditPage(entry)">
            <span class="book-glow" aria-hidden="true"></span>
            <span class="cover-wrap">
              <img class="cover-image" :src="resolveWorldBookCover(entry)" :alt="`${entry.title || 'World book'} 封面`" />
              <i class="cover-spine"></i>
            </span>
            <span class="book-copy">
              <strong>{{ entry.title || '未命名世界书' }}</strong>
            </span>
          </button>
        </article>
      </div>

      <div v-else class="empty-shelf">
        <strong>这一层还空着</strong>
        <p>写下一条角色记忆、地点规则，或先生成一本封面草稿。</p>
        <button type="button" @click="openCreateModal">创建第一本</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { WorldBookEntry } from '@/types/domain';
import { resolveWorldBookCover } from '@/utils/worldBook';

type ScopeFilter = 'all' | WorldBookEntry['scope'];

const props = defineProps<{
  books: WorldBookEntry[];
  createScope?: ScopeFilter;
}>();

const router = useRouter();
const visibleBooks = computed(() => props.books);

function openCreateModal() {
  const query = props.createScope && props.createScope !== 'all' ? { scope: props.createScope } : undefined;
  void router.push({ name: 'world-book-new', query });
}

function openEditPage(entry: WorldBookEntry) {
  void router.push({ name: 'world-book-edit', params: { id: entry.id } });
}

function scopeClass(scope: WorldBookEntry['scope']) {
  return {
    'global-online': 'scope-online',
    'global-offline': 'scope-offline',
    local: 'scope-local'
  }[scope];
}

defineExpose({
  openCreateModal
});
</script>

<style scoped>
.world-shelf {
  --accent: #06c755;
  --accent-soft: #eef8f1;
  --ink: #1f2622;
  --muted: #7c847f;
  --line: rgba(17, 17, 17, 0.05);
  --shadow: rgba(16, 24, 20, 0.06);
  display: grid;
  gap: 12px;
}

.library-card,
.empty-shelf {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 249, 0.92));
  box-shadow: 0 18px 40px var(--shadow);
}

.library-card::before,
.empty-shelf::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top left, rgba(6, 199, 85, 0.1), transparent 34%),
    radial-gradient(circle at top right, rgba(244, 154, 181, 0.12), transparent 28%);
}

.library-card {
  padding: 14px;
}

.section-head,
.shelf-grid,
.empty-shelf > * {
  position: relative;
  z-index: 1;
}

.section-head {
  margin-bottom: 10px;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.shelf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 8px;
  align-items: stretch;
}

.book-tile {
  position: relative;
  display: grid;
  gap: 8px;
  min-width: 0;
  isolation: isolate;
}

.book-tile.disabled {
  opacity: 0.62;
}

.cover-button {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  text-align: left;
  box-shadow: none;
}

.cover-button:active .cover-wrap {
  transform: translateY(-1px);
}

.book-glow {
  position: absolute;
  inset: 12px 16px auto;
  height: 38%;
  border-radius: 999px;
  opacity: 0.28;
  filter: blur(22px);
  pointer-events: none;
}

.scope-online .book-glow {
  background: rgba(6, 199, 85, 0.62);
}

.scope-offline .book-glow {
  background: rgba(155, 164, 159, 0.68);
}

.scope-local .book-glow {
  background: rgba(244, 154, 181, 0.78);
}

.cover-wrap {
  position: relative;
  display: block;
  width: min(100%, 190px);
  aspect-ratio: 0.68;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 17px 22px 22px 17px;
  background: linear-gradient(180deg, #f4f7f5, #e8eeea);
  box-shadow: inset 8px 0 12px rgba(72, 84, 77, 0.1), 0 16px 30px rgba(16, 24, 20, 0.12);
  pointer-events: none;
  transition: transform 0.16s ease;
}

.cover-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.cover-spine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 14%;
  background: linear-gradient(90deg, rgba(53, 64, 58, 0.2), rgba(255, 255, 255, 0.04));
  mix-blend-mode: multiply;
  pointer-events: none;
}

.book-copy {
  display: grid;
  width: 100%;
  min-width: 0;
  justify-items: center;
  text-align: center;
}

.book-copy strong {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: var(--ink);
  font-size: 9px;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-overflow: clip;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.empty-shelf {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 190px;
  padding: 20px;
  color: var(--muted);
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
}

.empty-shelf strong {
  color: var(--ink);
  font-size: 13px;
}

.empty-shelf p {
  margin: 0;
}

.empty-shelf button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  box-shadow: 0 12px 24px rgba(6, 199, 85, 0.2);
}

@media (max-width: 360px) {
  .shelf-grid {
    gap: 10px 8px;
  }
}

@media (min-width: 680px) {
  .shelf-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>

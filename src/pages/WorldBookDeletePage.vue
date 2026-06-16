<template>
  <section class="screen no-tabs world-book-delete-page">
    <header class="top-bar world-book-delete-topbar">
      <button class="world-book-delete-title-button" type="button" aria-label="返回世界书编辑" @click="cancelDelete">
        <h1 class="top-title">Delete World Book</h1>
      </button>
    </header>

    <main class="world-book-delete-main">
      <section v-if="store.ready && targetBook" class="confirm-card">
        <p class="eyebrow">Delete check</p>
        <Trash2 :size="28" stroke-width="2.2" aria-hidden="true" />
        <h2>确认删除这本世界书？</h2>
        <p>
          <strong>{{ targetBook.title || '未命名世界书' }}</strong>
          删除后会从书架移除，绑定到角色的局部引用也会一并清掉。
        </p>
        <div class="confirm-actions">
          <button class="ghost-button" type="button" @click="cancelDelete">再想想</button>
          <button class="ghost-button danger" type="button" @click="confirmDelete">确认删除</button>
        </div>
      </section>

      <section v-else-if="store.ready" class="confirm-card missing">
        <p class="eyebrow">Not found</p>
        <h2>找不到这本世界书</h2>
        <p>它可能已经被删除，或当前数据还没有同步到本机。</p>
        <button class="ghost-button" type="button" @click="goBackToShelf">回到书架</button>
      </section>

      <section v-else class="loading-card">
        <p>正在确认书本状态...</p>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Trash2 } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const targetId = computed(() => String(route.params.id ?? '').trim());
const targetBook = computed(() => store.worldBooks.find((book) => book.id === targetId.value) ?? null);

onMounted(() => {
  void store.hydrate();
});

function goBackToShelf() {
  void router.replace({ name: 'world-book' });
}

function cancelDelete() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  if (targetBook.value) {
    void router.replace({ name: 'world-book-edit', params: { id: targetId.value } });
    return;
  }
  goBackToShelf();
}

async function confirmDelete() {
  if (!targetBook.value) return;
  await store.deleteWorldBook(targetBook.value.id);
  goBackToShelf();
}
</script>

<style scoped>
.world-book-delete-page {
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(6, 199, 85, 0.12), transparent 34%),
    radial-gradient(circle at top right, rgba(255, 214, 224, 0.4), transparent 28%),
    linear-gradient(180deg, #fffdfd 0%, #f6f8f7 56%, #eef3f0 100%);
}

.world-book-delete-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
}

.world-book-delete-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  margin-right: auto;
}

.world-book-delete-title-button .top-title {
  margin: 0;
  text-align: left;
}

.world-book-delete-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 10px calc(16px + var(--safe-right)) calc(22px + var(--safe-bottom)) calc(16px + var(--safe-left));
}

.confirm-card,
.loading-card {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
}

.confirm-card {
  color: #7c847f;
}

.confirm-card svg {
  color: #b4485c;
}

.eyebrow {
  margin: 0;
  color: #7c847f;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.confirm-card h2,
.confirm-card p {
  margin: 0;
}

.confirm-card h2 {
  color: #1f2622;
  font-size: 24px;
  line-height: 1.1;
}

.confirm-card p {
  line-height: 1.7;
}

.confirm-card strong {
  display: block;
  margin-bottom: 4px;
  color: #1f2622;
}

.confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 15px;
  border: 1px solid rgba(17, 17, 17, 0.05);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #1f2622;
  font-weight: 900;
}

.ghost-button.danger {
  background: rgba(239, 68, 90, 0.08);
  color: #b4485c;
}

.loading-card,
.missing {
  place-items: center;
  min-height: 240px;
  color: #69706a;
  text-align: center;
}

@media (max-width: 430px) {
  .world-book-delete-main {
    padding-inline: 12px;
  }

  .confirm-card,
  .loading-card {
    padding: 18px;
    border-radius: 20px;
  }
}
</style>
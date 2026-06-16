<template>
  <section class="screen no-tabs sticker-manage-page">
    <header class="top-bar sticker-manage-topbar">
      <button class="sticker-manage-title-button" type="button" aria-label="返回 Stickers" @click="goBack">
        <h1 class="top-title">Sticker Manage</h1>
      </button>
    </header>

    <main class="sticker-manage-main">
      <StickerManagePanel
        v-if="manager.store.ready"
        :groups="manager.groups.value"
        :all-stickers="manager.allStickers.value"
        :stickers="manager.stickers.value"
        :active-group-id="manager.activeGroupId.value"
        :selected-ids="manager.selectedStickerIds.value"
        :group-drafts="manager.groupDrafts.value"
        :description-drafts="manager.descriptionDrafts.value"
        :sticker-group-drafts="manager.stickerGroupDrafts.value"
        :move-target-group-id="manager.moveTargetGroupId.value"
        :feedback="manager.feedback.value"
        @update:active-group-id="manager.setActiveGroupId"
        @update:group-draft="manager.updateGroupDraft"
        @update:description-draft="manager.updateDescriptionDraft"
        @update:sticker-group-draft="manager.updateStickerGroupDraft"
        @update:move-target-group-id="manager.moveTargetGroupId.value = $event"
        @toggle-sticker="manager.toggleStickerSelection"
        @toggle-select-all="manager.toggleSelectAll"
        @create-group="manager.createGroup"
        @rename-group="manager.renameGroup"
        @delete-group="manager.deleteGroup"
        @save-sticker="manager.saveSticker"
        @delete-sticker="manager.deleteSticker"
        @move-selected="manager.moveSelected"
        @delete-selected="manager.deleteSelected"
      />
      <section v-else class="loading-card">
        <p>正在整理贴纸抽屉...</p>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StickerManagePanel from '@/components/stickers/StickerManagePanel.vue';
import { useStickerManager } from '@/utils/stickerManager';

const route = useRoute();
const router = useRouter();
const manager = useStickerManager(String(route.query.group ?? ''));

onMounted(() => {
  void manager.store.hydrate();
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: 'stickers' });
}
</script>

<style scoped>
.sticker-manage-page {
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(255, 213, 226, 0.68), transparent 32%),
    radial-gradient(circle at top right, rgba(6, 199, 85, 0.1), transparent 30%),
    linear-gradient(180deg, #fffafc 0%, #f7f8fb 56%, #eef4f0 100%);
}

.sticker-manage-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
}

.sticker-manage-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  margin-right: auto;
}

.sticker-manage-title-button .top-title {
  margin: 0;
  text-align: left;
}

.sticker-manage-main {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 10px 16px 28px;
}

.loading-card {
  display: grid;
  place-items: center;
  min-height: 260px;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
  color: #6b6d73;
  font-size: 12px;
}

@media (max-width: 420px) {
  .sticker-manage-main {
    padding-inline: 12px;
  }
}
</style>
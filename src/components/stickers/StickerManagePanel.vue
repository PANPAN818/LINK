<template>
  <section class="manage-panel">
    <div class="manage-head">
      <div>
        <p class="manage-kicker">Sticker Manage</p>
        <h2>贴纸图库</h2>
      </div>
      <span class="selection-badge">已选 {{ selectedCount }} / {{ stickers.length }}</span>
    </div>

    <section v-if="activeSection === 'groups'" class="flow-panel">
      <div class="section-head">
        <div>
          <p class="section-kicker">Groups</p>
        </div>
        <button class="add-group-button" type="button" aria-label="创建分组" @click="emit('create-group')">
          <Plus :size="17" stroke-width="2.5" />
        </button>
      </div>

      <div class="group-list">
        <article v-for="group in groups" :key="group.id" class="group-row">
          <input :value="groupDrafts[group.id] ?? group.name" aria-label="分组名称" @input="emit('update:groupDraft', group.id, ($event.target as HTMLInputElement).value)" />
          <button class="mini-button" type="button" @click="emit('rename-group', group.id)">保存</button>
          <button class="mini-button danger" type="button" :disabled="groups.length <= 1" @click="emit('delete-group', group.id)">删除</button>
        </article>
      </div>
    </section>

    <section v-else class="flow-panel sticker-workspace">
      <nav class="group-filter" aria-label="按分组查看 Stickers">
        <button
          v-for="group in viewGroups"
          :key="group.id"
          class="group-filter-pill"
          :class="{ active: activeGroupId === group.id }"
          type="button"
          @click="emit('update:activeGroupId', group.id)"
        >
          <span>{{ group.name }}</span>
          <small>{{ group.count }}</small>
        </button>
      </nav>

      <section class="batch-bar">
        <button class="select-button" type="button" :aria-label="allSelected ? '取消全选当前分组' : '全选当前分组'" :disabled="!stickers.length" @click="emit('toggle-select-all')">{{ allSelected ? '取消' : '全选' }}</button>
        <select :value="moveTargetGroupId" aria-label="移动到分组" @change="emit('update:moveTargetGroupId', ($event.target as HTMLSelectElement).value)">
          <option value="">移动到</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
        <button class="mini-button" type="button" :disabled="!selectedCount || !moveTargetGroupId" @click="emit('move-selected')">移动</button>
        <button class="mini-button danger" type="button" :disabled="!selectedCount" @click="emit('delete-selected')">删除</button>
      </section>

      <section v-if="stickers.length" class="sticker-list">
        <article v-for="sticker in stickers" :key="sticker.id" class="sticker-row">
          <label class="check-wrap" aria-label="选择 Sticker">
            <input :checked="selectedIds.includes(sticker.id)" type="checkbox" @change="emit('toggle-sticker', sticker.id)" />
            <span></span>
          </label>
          <img :src="sticker.imageUrl" :alt="sticker.description" />
          <div class="sticker-editor-lines">
            <input class="description-input" :value="descriptionDrafts[sticker.id] ?? sticker.description" aria-label="文字描述" @input="emit('update:descriptionDraft', sticker.id, ($event.target as HTMLInputElement).value)" />
            <div class="sticker-action-line">
              <select :value="stickerGroupDrafts[sticker.id] ?? sticker.groupIds[0] ?? ''" aria-label="Sticker 分组" @change="emit('update:stickerGroupDraft', sticker.id, ($event.target as HTMLSelectElement).value)">
                <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
              <button class="mini-button" type="button" @click="emit('save-sticker', sticker.id)">保存</button>
              <button class="mini-button danger" type="button" @click="emit('delete-sticker', sticker.id)">删除</button>
            </div>
          </div>
        </article>
      </section>
      <section v-else class="empty-card">
        <p>当前分组暂无贴纸。</p>
      </section>
    </section>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>

    <nav class="mode-tabs" aria-label="管理模式">
      <button class="mode-tab" :class="{ active: activeSection === 'stickers' }" type="button" @click="activeSection = 'stickers'">
        <ImagePlus :size="20" stroke-width="2.1" />
        <span>贴纸</span>
      </button>
      <button class="mode-tab" :class="{ active: activeSection === 'groups' }" type="button" @click="activeSection = 'groups'">
        <Folder :size="20" stroke-width="2.1" />
        <span>分组</span>
      </button>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Folder, ImagePlus, Plus } from 'lucide-vue-next';
import type { Sticker, StickerGroup } from '@/types/domain';

const props = defineProps<{
  groups: StickerGroup[];
  allStickers: Sticker[];
  stickers: Sticker[];
  activeGroupId: string;
  selectedIds: string[];
  groupDrafts: Record<string, string>;
  descriptionDrafts: Record<string, string>;
  stickerGroupDrafts: Record<string, string>;
  moveTargetGroupId: string;
  feedback: string;
}>();

const emit = defineEmits<{
  'update:activeGroupId': [groupId: string];
  'update:groupDraft': [groupId: string, value: string];
  'update:descriptionDraft': [stickerId: string, value: string];
  'update:stickerGroupDraft': [stickerId: string, groupId: string];
  'update:moveTargetGroupId': [value: string];
  'toggle-sticker': [stickerId: string];
  'toggle-select-all': [];
  'create-group': [];
  'rename-group': [groupId: string];
  'delete-group': [groupId: string];
  'save-sticker': [stickerId: string];
  'delete-sticker': [stickerId: string];
  'move-selected': [];
  'delete-selected': [];
}>();

const activeSection = ref<'stickers' | 'groups'>('stickers');
const selectedCount = computed(() => props.selectedIds.length);
const allSelected = computed(() => Boolean(props.stickers.length) && props.stickers.every((sticker) => props.selectedIds.includes(sticker.id)));
const viewGroups = computed(() => props.groups.map((group) => ({
    id: group.id,
    name: group.name,
    count: countForGroup(group.id)
  }))
);

function countForGroup(groupId: string) {
  return props.allStickers.filter((sticker) => sticker.groupIds[0] === groupId).length;
}
</script>

<style scoped>
.manage-panel {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding-bottom: calc(72px + var(--safe-bottom));
  font-size: 12px;
}

.manage-head,
.section-head,
.batch-bar,
.sticker-row {
  display: flex;
  align-items: center;
}

.manage-head,
.section-head {
  justify-content: space-between;
  gap: 10px;
}

.manage-head {
  padding: 0 2px;
}

.manage-kicker,
.section-kicker {
  margin: 0;
  color: #8f8790;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.manage-head h2 {
  margin: 4px 0 0;
  color: #2a242c;
  letter-spacing: 0;
}

.manage-head h2 {
  font-size: 17px;
  line-height: 1.18;
}

.selection-badge {
  flex: 0 0 auto;
  min-width: 38px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.08);
  color: #5f5962;
  text-align: center;
  font-size: 10px;
  font-weight: 900;
}

.add-group-button {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: #111111;
}

.mode-tabs {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 8px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(17, 17, 17, 0.05);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
}

.mode-tab {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 6px 4px;
  border-radius: 14px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
}

.mode-tab.active {
  background: #eef8f1;
  color: #111111;
}

.mode-tab svg {
  width: 20px;
  height: 20px;
}

.flow-panel,
.batch-bar,
.sticker-list,
.empty-card {
  display: grid;
  gap: 10px;
}

.flow-panel,
.empty-card {
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
}

.group-list,
.sticker-workspace {
  display: grid;
  gap: 10px;
}

.group-row,
.batch-bar,
.sticker-row {
  gap: 8px;
}

.group-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 76px;
  align-items: center;
  gap: 8px;
}

.group-row > * {
  width: 100%;
  min-width: 0;
}

.group-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 1px;
}

.group-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: #6a636a;
  font-size: 12px;
  font-weight: 900;
}

.group-filter-pill.active {
  background: #111111;
  color: #ffffff;
}

.group-filter-pill small {
  color: inherit;
  opacity: 0.66;
  font-size: 10px;
  font-weight: 800;
}

.group-row input,
.batch-bar select,
.description-input,
.sticker-action-line select {
  min-width: 0;
  min-height: 34px;
  border-radius: 10px;
  background: rgba(242, 243, 246, 0.96);
  color: #251f26;
  padding: 7px 9px;
  font-size: 12px;
}

.batch-bar select,
.sticker-editor-lines {
  flex: 1;
}

.batch-bar {
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.78fr) minmax(0, 0.78fr);
  align-items: center;
}

.batch-bar > * {
  width: 100%;
  min-width: 0;
}

.select-button,
.mini-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 8px;
  border-radius: 12px;
  background: rgba(17, 17, 17, 0.07);
  color: #1f1b21;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.mini-button.danger {
  color: #b03756;
}

.select-button:disabled,
.mini-button:disabled {
  opacity: 0.42;
}

.sticker-row {
  display: grid;
  grid-template-columns: 26px 76px minmax(0, 1fr);
  align-items: start;
}

.check-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-top: 7px;
}

.check-wrap input {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.check-wrap span {
  width: 20px;
  height: 20px;
  border-radius: 7px;
  border: 1.5px solid rgba(17, 17, 17, 0.22);
  background: rgba(255, 255, 255, 0.88);
}

.check-wrap input:checked + span {
  background: #111111;
  border-color: #111111;
}

.sticker-row img {
  width: 76px;
  height: 76px;
  border-radius: 16px;
  object-fit: contain;
  background: transparent;
}

.sticker-editor-lines {
  display: grid;
  grid-template-rows: 34px 34px;
  gap: 7px;
  min-width: 0;
}

.description-input,
.sticker-action-line > * {
  width: 100%;
  min-width: 0;
  height: 34px;
}

.sticker-action-line {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  min-width: 0;
}

.feedback,
.empty-card p {
  margin: 0;
  color: #6a636a;
  font-size: 12px;
  line-height: 1.45;
}

.feedback {
  padding: 0 2px;
  color: #6e4d57;
}

@media (max-width: 420px) {
  .manage-panel {
    gap: 12px;
  }

  .flow-panel,
  .empty-card {
    padding: 12px;
  }

  .batch-bar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .select-button,
  .mini-button {
    padding-inline: 5px;
    font-size: 11px;
  }

  .sticker-row {
    grid-template-columns: 24px 72px minmax(0, 1fr);
  }

  .sticker-row img {
    width: 72px;
    height: 72px;
  }
}
</style>
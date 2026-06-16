<template>
  <section class="sticker-sheet" :class="`sticker-sheet-${presentation}`" @click="hideTransientUi">
    <header class="sticker-head" @click.stop>
      <strong>Stickers</strong>
      <div v-if="showToolbarActions || showManageAction || showClose" class="head-actions">
        <template v-if="showToolbarActions">
          <button class="head-icon" :class="{ active: activeTool === 'group-name' }" type="button" aria-label="分组名" @click="toggleTool('group-name')">
            <PencilLine :size="17" />
          </button>
          <button class="head-icon" :class="{ active: activeTool === 'import' }" type="button" aria-label="URL / 文本导入" @click="toggleTool('import')">
            <Upload :size="17" />
          </button>
          <label class="head-icon file-head" aria-label="文件">
            <FileUp :size="17" />
            <input type="file" multiple accept="image/*,.txt,.json,.doc,.docx,text/plain,application/json,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="importFiles" />
          </label>
        </template>
        <button v-if="showManageAction" class="head-icon" type="button" aria-label="管理 Stickers" @click="emit('manage')">
          <Settings2 :size="18" />
        </button>
        <button v-if="showClose" class="close-button" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
    </header>

    <nav class="group-tabs" aria-label="Stickers 分组" @click.stop>
      <button
        v-for="group in groupTabs"
        :key="group.id"
        class="group-pill"
        :class="{ active: currentActiveGroupId === group.id }"
        type="button"
        @click="currentActiveGroupId = group.id"
      >
        <span>{{ group.name }}</span>
        <small>{{ group.count }}</small>
      </button>
    </nav>

    <section v-if="showToolbarActions && activeTool" class="tool-popover" @click.stop>
      <form v-if="activeTool === 'group-name'" class="group-editor" @submit.prevent="submitGroupName">
        <input v-model="newGroupName" aria-label="Stickers 分组名" placeholder="新分组" />
        <button class="icon-action" type="submit" :aria-label="currentActiveGroupId === 'all' ? '添加分组' : '保存分组名'">
          <component :is="currentActiveGroupId === 'all' ? Plus : Check" :size="16" />
        </button>
        <button class="icon-action danger" type="button" :disabled="!canDeleteActiveGroup" aria-label="删除分组" @click="deleteActiveGroup">
          <Trash2 :size="15" />
        </button>
      </form>

      <div v-else class="import-row">
        <textarea v-model="importText" aria-label="URL / 文本导入"></textarea>
        <button class="mini-action" type="button" :disabled="importing || !importText.trim()" aria-label="导入" @click="importFromText"></button>
      </div>
      <p v-if="feedback" class="feedback">{{ feedback }}</p>
    </section>

    <section v-if="filteredStickers.length" class="sticker-grid">
      <button
        v-for="sticker in filteredStickers"
        :key="sticker.id"
        class="sticker-tile"
        :class="{ selected: selectedStickerId === sticker.id }"
        type="button"
        @click.stop="handleStickerClick(sticker)"
      >
        <img :src="sticker.imageUrl" :alt="sticker.description" />
        <span>{{ sticker.description }}</span>
      </button>
    </section>
    <section v-else class="empty-stickers">
      <ImagePlus :size="28" />
      <strong>暂无 Stickers</strong>
    </section>

    <form v-if="allowStickerEditing && selectedSticker && !conversationId" class="sticker-editor" @click.stop @submit.prevent="saveSelectedSticker">
      <div class="editor-head">
        <strong>编辑 Sticker</strong>
        <select v-model="draftGroupId" aria-label="Sticker 分组">
          <option v-for="group in sortedStickerGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
        <button class="icon-action danger" type="button" aria-label="删除 Sticker" @click="deleteSelectedSticker">
          <Trash2 :size="16" />
        </button>
      </div>
      <div class="editor-row">
        <input v-model="draftDescription" aria-label="文字描述" required />
        <button class="save-button" type="submit" aria-label="保存 Sticker">
          <Check :size="16" />
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Check, FileUp, ImagePlus, PencilLine, Plus, Settings2, Trash2, Upload, X } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';
import type { Sticker, StickerSourceType } from '@/types/domain';
import { parseStickerImportText, readImageFileAsSticker, readStickerImportFile } from '@/utils/stickers';

const props = withDefaults(defineProps<{
  conversationId?: string;
  showClose?: boolean;
  showToolbarActions?: boolean;
  showManageAction?: boolean;
  activeGroupId?: string;
  allowStickerEditing?: boolean;
  presentation?: 'page' | 'modal';
}>(), {
  conversationId: undefined,
  showClose: true,
  showToolbarActions: true,
  showManageAction: false,
  activeGroupId: undefined,
  allowStickerEditing: true,
  presentation: 'page'
});

const emit = defineEmits<{
  close: [];
  manage: [];
  'update:activeGroupId': [value: string];
}>();

const store = useAppStore();
const internalActiveGroupId = ref(props.activeGroupId ?? '');
const newGroupName = ref('');
const importText = ref('');
const feedback = ref('');
const importing = ref(false);
const selectedStickerId = ref('');
const draftDescription = ref('');
const draftImageUrl = ref('');
const draftGroupId = ref('');
const activeTool = ref<'group-name' | 'import' | ''>('');

const stickers = computed(() => store.stickers ?? []);
const stickerGroups = computed(() => store.stickerGroups ?? []);
const sortedStickerGroups = computed(() => store.sortedStickerGroups ?? []);
const currentActiveGroupId = computed({
  get: () => props.activeGroupId ?? internalActiveGroupId.value,
  set: (value: string) => {
    internalActiveGroupId.value = value;
    emit('update:activeGroupId', value);
  }
});

const firstGroupId = computed(() => sortedStickerGroups.value[0]?.id ?? '');
const groupTabs = computed(() => sortedStickerGroups.value.map((group) => ({
    id: group.id,
    name: group.name,
    count: store.stickersForGroup(group.id).length
  }))
);
const filteredStickers = computed(() => currentActiveGroupId.value ? store.stickersForGroup(currentActiveGroupId.value) : []);
const selectedSticker = computed(() => stickers.value.find((sticker) => sticker.id === selectedStickerId.value) ?? null);
const canDeleteActiveGroup = computed(() => currentActiveGroupId.value !== 'all' && stickerGroups.value.length > 1);
const targetImportGroupIds = computed(() => {
  if (currentActiveGroupId.value) return [currentActiveGroupId.value];
  return firstGroupId.value ? [firstGroupId.value] : [];
});

onMounted(() => {
  void store.hydrate();
});

watch(
  () => props.activeGroupId,
  (groupId) => {
    if (groupId !== undefined) internalActiveGroupId.value = groupId;
  }
);

watch(
  () => stickerGroups.value,
  () => {
    feedback.value = '';
    if (!sortedStickerGroups.value.some((group) => group.id === currentActiveGroupId.value)) currentActiveGroupId.value = firstGroupId.value;
  },
  { immediate: true }
);

watch(
  () => currentActiveGroupId.value,
  (groupId) => {
    selectedStickerId.value = '';
    const group = stickerGroups.value.find((item) => item.id === groupId);
    newGroupName.value = group?.name ?? '';
  },
  { immediate: true }
);

watch(selectedSticker, (sticker) => {
  if (!sticker) return;
  draftDescription.value = sticker.description;
  draftImageUrl.value = sticker.imageUrl;
  draftGroupId.value = sticker.groupIds[0] ?? sortedStickerGroups.value[0]?.id ?? '';
});

function sourceTypeForFile(file: File): StickerSourceType {
  if (/\.json$/i.test(file.name)) return 'json-file';
  return /\.docx?$/i.test(file.name) ? 'doc-file' : 'text-file';
}

function selectSticker(sticker: Sticker) {
  selectedStickerId.value = sticker.id;
}

function hideTransientUi() {
  selectedStickerId.value = '';
  activeTool.value = '';
}

function toggleTool(tool: 'group-name' | 'import') {
  selectedStickerId.value = '';
  feedback.value = '';
  activeTool.value = activeTool.value === tool ? '' : tool;
}

async function handleStickerClick(sticker: Sticker) {
  if (!props.conversationId) {
    if (props.allowStickerEditing) selectSticker(sticker);
    return;
  }
  await store.sendStickerMessage(props.conversationId, sticker);
  emit('close');
}

async function submitGroupName() {
  const name = newGroupName.value.trim();
  if (!name) return;
  const existingGroup = stickerGroups.value.find((item) => item.id === currentActiveGroupId.value);
  if (existingGroup) {
    await store.saveStickerGroup({ ...existingGroup, name });
    feedback.value = '分组名已保存。';
    return;
  }
  const group = await store.addStickerGroup(name);
  currentActiveGroupId.value = group.id;
}

async function deleteActiveGroup() {
  if (!canDeleteActiveGroup.value) return;
  const group = stickerGroups.value.find((item) => item.id === currentActiveGroupId.value);
  if (!group || !window.confirm(`删除分组“${group.name}”？分组内 Sticker 会保留。`)) return;
  const deleted = await store.deleteStickerGroup(group.id);
  if (deleted) currentActiveGroupId.value = sortedStickerGroups.value.find((item) => item.id !== group.id)?.id ?? '';
}

async function importDrafts(drafts: ReturnType<typeof parseStickerImportText>) {
  if (!drafts.length) {
    feedback.value = '没有识别到可导入的图片链接。';
    return;
  }
  const created = await store.importStickers(drafts, targetImportGroupIds.value);
  feedback.value = created.length ? `已导入 ${created.length} 个 Stickers。` : '没有新增 Stickers。';
}

async function importFromText() {
  if (!importText.value.trim()) return;
  importing.value = true;
  try {
    await importDrafts(parseStickerImportText(importText.value, 'url'));
    importText.value = '';
  } finally {
    importing.value = false;
  }
}

async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (!files.length) return;
  importing.value = true;
  try {
    const drafts = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        drafts.push(await readImageFileAsSticker(file));
        continue;
      }
      const text = await readStickerImportFile(file);
      drafts.push(...parseStickerImportText(text, sourceTypeForFile(file)));
    }
    await importDrafts(drafts);
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : '文件导入失败。';
  } finally {
    importing.value = false;
    input.value = '';
  }
}

async function saveSelectedSticker() {
  if (!selectedSticker.value) return;
  await store.saveSticker({
    ...selectedSticker.value,
    description: draftDescription.value.trim(),
    imageUrl: draftImageUrl.value.trim(),
    groupIds: draftGroupId.value ? [draftGroupId.value] : targetImportGroupIds.value
  });
  feedback.value = 'Sticker 已保存。';
}

async function deleteSelectedSticker() {
  if (!selectedSticker.value || !window.confirm(`删除 Sticker“${selectedSticker.value.description}”？`)) return;
  const deletedId = selectedSticker.value.id;
  await store.deleteSticker(deletedId);
  selectedStickerId.value = '';
  feedback.value = 'Sticker 已删除。';
}
</script>

<style scoped>
.sticker-sheet {
  position: relative;
  display: grid;
  align-content: start;
  align-items: start;
  gap: 8px;
  min-width: 0;
  color: #211f22;
}

.sticker-head,
.group-tabs,
.sticker-grid,
.empty-stickers {
  width: 100%;
  min-width: 0;
}

.sticker-head,
.editor-head,
.group-editor {
  display: flex;
  align-items: center;
}

.sticker-head,
.editor-head {
  justify-content: space-between;
  gap: 8px;
}

.sticker-head strong {
  color: #8c848c;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.close-button,
.head-icon,
.icon-action {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  color: #211f22;
}

.close-button,
.head-icon {
  background: transparent;
}

.head-icon.active {
  background: #111111;
  color: #ffffff;
}

.file-head {
  position: relative;
}

.icon-action {
  background: rgba(255, 255, 255, 0.78);
}

.icon-action.danger {
  color: var(--danger);
}

.icon-action:disabled {
  opacity: 0.35;
}

.file-head input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.tool-popover {
  position: absolute;
  top: 34px;
  left: 0;
  right: 0;
  z-index: 4;
  display: grid;
  gap: 6px;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 36px rgba(37, 34, 40, 0.14);
  backdrop-filter: blur(18px);
}

.group-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.group-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  max-width: min(220px, 70vw);
  min-height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #68616b;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.group-pill span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-pill.active {
  background: #111111;
  color: #ffffff;
}

.group-pill small {
  opacity: 0.72;
}

.group-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px 28px;
  gap: 5px;
}

.group-editor input,
.import-row textarea {
  min-height: 28px;
  border-radius: 9px;
  background: rgba(244, 245, 247, 0.96);
  padding: 5px 8px;
  font-size: 11px;
}

.sticker-editor,
.empty-stickers {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.sticker-editor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  gap: 7px;
  padding: 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12px 34px rgba(36, 34, 40, 0.14);
  backdrop-filter: blur(18px);
}

.editor-head strong {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  white-space: nowrap;
}

.editor-head select {
  width: auto;
  min-width: 92px;
  max-width: 136px;
  height: 28px;
  padding: 0 8px;
  border-radius: 9px;
  background: #f1f2f4;
  color: #24262a;
  font-size: 11px;
  font-weight: 800;
}

.editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 6px;
}

.editor-row input {
  min-height: 32px;
  border-radius: 9px;
  background: #f1f2f4;
  padding: 6px 9px;
  font-size: 12px;
}

.import-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px;
  gap: 5px;
  align-items: stretch;
}

.import-row textarea {
  height: 32px;
  min-height: 32px;
  resize: vertical;
}

.mini-action,
.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 !important;
  padding-inline: 0 !important;
  border-radius: 9px;
  background: #211f22;
  color: #ffffff;
  font-weight: 900;
}

.mini-action {
  width: 28px;
}

.sticker-sheet .mini-action {
  min-height: 28px !important;
  padding: 0 !important;
  padding-inline: 0 !important;
}

.feedback {
  margin: 0;
  color: #69626d;
  font-size: 11px;
  line-height: 1.45;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 8px;
  padding-bottom: 0;
}

.sticker-tile {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
  padding: 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid transparent;
  text-align: left;
}

.sticker-tile.selected {
  border-color: rgba(17, 17, 17, 0.14);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.sticker-tile img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  object-fit: cover;
  background: #eff1f3;
}

.sticker-tile span {
  color: #39343a;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  min-height: 30px;
  overflow: hidden;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sticker-sheet-modal .sticker-grid {
  --modal-grid-width: min(calc(100vw - var(--safe-left) - var(--safe-right) - 44px), 424px);
  --modal-grid-column: calc((var(--modal-grid-width) - 24px) / 4);
  --modal-grid-row: calc(var(--modal-grid-column) + 32px);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-height: min(
    calc(var(--app-height) - var(--safe-top) - var(--safe-bottom) - 132px),
    calc(var(--modal-grid-row) * 3 + 16px)
  );
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
  -webkit-overflow-scrolling: touch;
}

.empty-stickers {
  place-items: center;
  min-height: 220px;
  color: #8e8890;
}

.empty-stickers strong {
  font-size: 18px;
  color: #4f4850;
}
</style>
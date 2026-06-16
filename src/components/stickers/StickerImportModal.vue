<template>
  <AppModal :model-value="modelValue" title="导入 Stickers" :show-header="false" variant="ins" @update:model-value="emit('update:modelValue', $event)">
    <section class="import-modal">
      <div class="modal-head">
        <div>
          <p class="modal-kicker">Sticker Import</p>
          <h3>选择导入方式与目标分组</h3>
        </div>
        <span class="mode-badge">{{ modeLabelMap[activeTab] }}</span>
      </div>

      <nav class="tab-row" aria-label="Stickers 导入方式">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-pill"
          :class="{ active: activeTab === tab.id }"
          type="button"
          @click="emit('update:activeTab', tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="target-row" :class="{ 'has-file': activeTab !== 'url' }">
        <label class="field">
          <span>导入到分组</span>
          <select :value="selectedGroupId" @change="emit('update:selectedGroupId', ($event.target as HTMLSelectElement).value)">
            <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
        </label>

        <section v-if="activeTab !== 'url'" class="file-card">
          <span class="field-label">{{ fileLabelMap[activeTab] }}</span>
          <label class="file-button">
            选择文件
            <input :accept="acceptMap[activeTab]" multiple type="file" @change="emitFiles" />
          </label>
        </section>
      </div>

      <label v-if="activeTab === 'url'" class="field grow">
        <span>URL 内容</span>
        <textarea
          :value="textValue"
          placeholder="每行一条，支持“描述 + 图片链接”或 JSON。"
          @input="emit('update:textValue', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>

      <section v-if="selectedFiles.length" class="file-list">
        <strong>已选择 {{ selectedFiles.length }} 个文件</strong>
        <p>{{ selectedFiles.map((file) => file.name).join('、') }}</p>
      </section>

      <p class="import-note">{{ helperMap[activeTab] }}</p>
      <p v-if="feedback" class="feedback">{{ feedback }}</p>

      <div class="modal-actions">
        <button class="secondary-ghost" type="button" @click="emit('update:modelValue', false)">取消</button>
        <button class="save-button" type="button" :disabled="disabled" @click="emit('submit')">导入</button>
      </div>
    </section>
  </AppModal>
</template>

<script setup lang="ts">
import AppModal from '@/components/common/AppModal.vue';
import type { StickerGroup } from '@/types/domain';

export type StickerImportTab = 'url' | 'txt' | 'doc' | 'json' | 'local';

const props = defineProps<{
  modelValue: boolean;
  activeTab: StickerImportTab;
  groups: StickerGroup[];
  selectedGroupId: string;
  textValue: string;
  selectedFiles: File[];
  feedback: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:activeTab': [tab: StickerImportTab];
  'update:selectedGroupId': [groupId: string];
  'update:textValue': [value: string];
  'update:selectedFiles': [files: File[]];
  submit: [];
}>();

const tabs: Array<{ id: StickerImportTab; label: string }> = [
  { id: 'url', label: 'URL 导入' },
  { id: 'txt', label: 'TXT 导入' },
  { id: 'doc', label: 'DOC 导入' },
  { id: 'json', label: 'JSON 导入' },
  { id: 'local', label: '本地导入' }
];

const modeLabelMap: Record<StickerImportTab, string> = {
  url: '链接文本',
  txt: '文本文档',
  doc: 'Word 文档',
  json: 'JSON 文件',
  local: '本地图片'
};

const helperMap: Record<StickerImportTab, string> = {
  url: '支持逐行或连续粘贴，描述和图片链接之间可用中文/英文分号、空格或多空格分隔。',
  txt: 'TXT 中可写连续多条“描述 + 图片链接”，支持分号、空格、多空格和 JSON 列表。',
  doc: '支持 .doc / .docx，文档中含图片链接、连续多条文本或 JSON 结构即可识别。',
  json: '支持 JSON 数组、对象映射，字段可用 description/name/text 与 imageUrl/url/src/image。',
  local: '本地图片会用文件名作为默认文字描述，导入后仍可继续修改。'
};

const fileLabelMap: Record<Exclude<StickerImportTab, 'url'>, string> = {
  txt: '上传 TXT 文件',
  doc: '上传 DOC / DOCX 文件',
  json: '上传 JSON 文件',
  local: '上传图片文件'
};

const acceptMap: Record<Exclude<StickerImportTab, 'url'>, string> = {
  txt: '.txt,text/plain',
  doc: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: '.json,application/json',
  local: 'image/*'
};

function emitFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  emit('update:selectedFiles', Array.from(input.files ?? []));
}
</script>

<style scoped>
.import-modal {
  display: grid;
  gap: 12px;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.modal-kicker,
.field-label,
.import-note {
  margin: 0;
  color: #8f8790;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.modal-head h3,
.file-list strong {
  margin: 4px 0 0;
  color: #2a242c;
  font-size: 18px;
  line-height: 1.2;
}

.mode-badge {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.08);
  color: #2a242c;
  font-size: 11px;
  font-weight: 800;
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tab-pill {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #6a636a;
  font-size: 12px;
  font-weight: 800;
}

.tab-pill.active {
  background: #111111;
  color: #ffffff;
}

.target-row {
  display: grid;
  gap: 8px;
}

.target-row.has-file {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
}

.target-row.has-file > * {
  min-width: 0;
}

.field,
.file-card,
.file-list {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.74);
}

.field span {
  color: #6f6870;
  font-size: 12px;
  font-weight: 800;
}

.field select,
.field textarea {
  border-radius: 12px;
  background: rgba(242, 243, 246, 0.96);
  color: #251f26;
  padding: 10px 12px;
}

.field textarea {
  min-height: 180px;
  resize: vertical;
}

.field.grow {
  min-height: 0;
}

.file-card {
  align-content: space-between;
}

.file-card p,
.file-list p,
.feedback,
.import-note {
  margin: 0;
  color: #6a636a;
  font-size: 12px;
  line-height: 1.5;
}

.file-button,
.secondary-ghost,
.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
}

.file-button {
  position: relative;
  width: 100%;
  background: rgba(17, 17, 17, 0.08);
  color: #171319;
}

.file-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.feedback {
  color: #6e4d57;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.secondary-ghost {
  background: rgba(17, 17, 17, 0.08);
  color: #251f26;
}

.save-button {
  background: #111111;
  color: #ffffff;
}

.save-button:disabled {
  opacity: 0.4;
}
</style>

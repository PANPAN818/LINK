<template>
  <AppModal :model-value="modelValue" title="模型切换" :show-header="false" variant="ins" @update:model-value="emit('update:modelValue', $event)">
    <section class="model-switch-panel form-grid">
      <label v-for="scope in modelScopes" :key="scope.id" class="field model-select-field">
        <span>{{ scope.label }}</span>
        <div class="model-select-shell">
          <img v-if="selectedModelMeta(draft.modelOverrides[scope.id])" :src="selectedModelMeta(draft.modelOverrides[scope.id])?.avatar" :alt="selectedModelMeta(draft.modelOverrides[scope.id])?.vendorName" />
          <span v-if="selectedModelMeta(draft.modelOverrides[scope.id])" class="model-select-vendor">{{ selectedModelMeta(draft.modelOverrides[scope.id])?.vendorName }}</span>
          <select v-model="draft.modelOverrides[scope.id]" :class="{ 'with-provider': selectedModelMeta(draft.modelOverrides[scope.id]) }" @change="saveDraft">
            <option value="">跟随全局默认模型</option>
            <optgroup v-for="vendor in groupedModels" :key="`${scope.id}-${vendor.id}`" :label="vendorSelectLabel(vendor)">
              <option v-for="model in vendor.models" :key="`${scope.id}-${model.value}`" :value="model.value">
                {{ model.label }}
              </option>
            </optgroup>
          </select>
        </div>
      </label>
    </section>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { ChatModelScope, ConversationSettings } from '@/types/domain';
import { normalizeConversationSettings } from '@/utils/memory';

const props = defineProps<{
  modelValue: boolean;
  conversationId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useAppStore();
const modelScopes: Array<{ id: ChatModelScope; label: string }> = [
  { id: 'online', label: '线上聊天模型' },
  { id: 'offline', label: '线下 RP 模型' },
  { id: 'voom', label: 'VOOM 生成模型' }
];
const draft = reactive<ConversationSettings>(normalizeConversationSettings(null, props.conversationId));

const groupedModels = computed(() => {
  return (store.settings?.apiVendors ?? [])
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      avatar: vendor.avatar,
      models: vendor.models
        .filter((model) => model.selected)
        .map((model) => ({
          value: `${vendor.id}::${model.id}`,
          label: model.nickname || model.id
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN'))
    }))
    .filter((vendor) => vendor.models.length)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
});

watch(
  () => [props.conversationId, store.conversationSettings.length, props.modelValue] as const,
  () => {
    Object.assign(draft, normalizeConversationSettings(store.settingsForConversation(props.conversationId), props.conversationId));
  },
  { immediate: true }
);

function saveDraft() {
  void store.saveConversationSettings({ ...draft, conversationId: props.conversationId });
}

function vendorSelectLabel(vendor: { avatar: string; name: string }) {
  return `${vendor.avatar ? '◉ ' : ''}${vendor.name}`;
}

function selectedModelMeta(value: string) {
  if (!value.trim()) return null;
  const [vendorId, ...modelParts] = value.split('::');
  if (!modelParts.length) return null;
  const vendor = groupedModels.value.find((item) => item.id === vendorId);
  if (!vendor) return null;
  const modelValue = `${vendorId}::${modelParts.join('::')}`;
  const model = vendor.models.find((item) => item.value === modelValue);
  if (!model) return null;
  return {
    avatar: vendor.avatar,
    vendorName: vendor.name,
    modelLabel: model.label
  };
}
</script>

<style scoped>
.model-switch-panel {
  padding-top: 4px;
}

.model-select-field select {
  width: 100%;
  min-height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  color: #24201e;
  font-weight: 800;
}

.model-select-shell {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 5px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
}

.model-select-shell img {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--soft);
}

.model-select-vendor {
  max-width: 86px;
  overflow: hidden;
  color: #5f5a56;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-select-shell select:not(.with-provider) {
  grid-column: 1 / -1;
}
</style>
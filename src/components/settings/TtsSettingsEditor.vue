<template>
  <form class="form-grid" @submit.prevent="submit">
    <label class="toggle-row toggle-card">
      <input v-model="draft.ttsEnabled" type="checkbox" />
      <div>
        <strong>启用语音回复偏好</strong>
        <span>为在线聊天保留 TTS 播放方式、音色和触发策略。</span>
      </div>
    </label>

    <label class="field">
      <span>默认音色</span>
      <input v-model="draft.ttsVoice" placeholder="alloy / aria / zh-CN-XiaoxiaoNeural" />
    </label>

    <label class="field">
      <span>播放方式</span>
      <select v-model="draft.ttsPlaybackMode">
        <option value="manual">手动播放</option>
        <option value="auto">自动播放</option>
      </select>
    </label>

    <button class="secondary-action" type="submit">保存语音设置</button>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { AppSettings } from '@/types/domain';

const props = defineProps<{
  settings: AppSettings;
}>();

const emit = defineEmits<{
  save: [settings: AppSettings];
}>();

const draft = reactive({ ...props.settings });

watch(
  () => props.settings,
  (nextSettings) => Object.assign(draft, nextSettings),
  { deep: true }
);

function submit() {
  emit('save', { ...draft });
}
</script>

<style scoped>
.toggle-card {
  align-items: start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--soft);
}

.toggle-card div {
  display: grid;
  gap: 4px;
}

.toggle-card strong {
  font-size: 14px;
}

.toggle-card span {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.toggle-row {
  display: flex;
}

.toggle-row input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}
</style>
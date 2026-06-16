<template>
  <form class="form-grid" @submit.prevent="submit">
    <label class="field">
      <span>社交昵称</span>
      <input v-model="draft.nickname" required />
    </label>
    <label class="field">
      <span>人设称呼</span>
      <input v-model="draft.name" required />
    </label>
    <label class="field">
      <span>聊天头像 URL</span>
      <input v-model="draft.avatar" required />
    </label>
    <label class="avatar-import-button">
      <input type="file" accept="image/*" @change="readAvatar" />
      <span>本地选择聊天头像</span>
    </label>
    <label class="field">
      <span>个性签名</span>
      <input v-model="draft.signature" />
    </label>
    <label class="field">
      <span>用户人设</span>
      <textarea v-model="draft.description" required />
    </label>
    <button class="primary-action" type="submit">保存</button>
    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { UserProfile } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';

const props = defineProps<{
  user: UserProfile;
}>();

const emit = defineEmits<{
  save: [user: UserProfile];
}>();

const draft = reactive({ ...props.user });
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');

watch(
  () => props.user,
  (nextUser) => Object.assign(draft, nextUser),
  { deep: true }
);

function submit() {
  emit('save', { ...draft });
}

async function readAvatar(event: Event) {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  avatarEditorSource.value = image;
  showAvatarEditor.value = true;
}

function applyEditedAvatar(value: string) {
  draft.avatar = value;
}
</script>

<style scoped>
.avatar-import-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--soft);
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
}

.avatar-import-button input {
  display: none;
}
</style>
<template>
  <form class="form-grid" @submit.prevent="submit">
    <label class="field">
      <span>名字</span>
      <input v-model="draft.name" required />
    </label>
    <label class="field">
      <span>头像 URL</span>
      <input v-model="draft.avatar" required />
    </label>
    <label class="avatar-import-button">
      <input type="file" accept="image/*" @change="readAvatar" />
      <span>本地选择头像</span>
    </label>
    <label class="field">
      <span>角色资料</span>
      <textarea v-model="draft.description" required />
    </label>
    <label class="field">
      <span>朋友圈频率</span>
      <select v-model="draft.voomFrequency">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </label>
    <section v-if="localBooks.length" class="bind-list">
      <strong>绑定局部世界书</strong>
      <label v-for="book in localBooks" :key="book.id" class="bind-row">
        <input :checked="draft.localWorldBookIds.includes(book.id)" type="checkbox" @change="toggleBook(book.id, $event)" />
        <span>{{ book.title }}</span>
      </label>
    </section>
    <button class="primary-action" type="submit">保存</button>
    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { CharacterProfile, WorldBookEntry } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';

const props = defineProps<{
  character: CharacterProfile;
  localBooks: WorldBookEntry[];
}>();

const emit = defineEmits<{
  save: [character: CharacterProfile];
}>();

const draft = reactive({ ...props.character });
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');

watch(
  () => props.character,
  (nextCharacter) => Object.assign(draft, nextCharacter),
  { deep: true }
);

function submit() {
  emit('save', { ...draft, localWorldBookIds: [...draft.localWorldBookIds] });
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

function toggleBook(bookId: string, event: Event) {
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
  const ids = new Set(draft.localWorldBookIds);
  if (checked) ids.add(bookId);
  else ids.delete(bookId);
  draft.localWorldBookIds = [...ids];
}
</script>

<style scoped>
.bind-list {
  display: grid;
  gap: 6px;
}

.bind-list strong {
  font-size: 12px;
  color: #686b70;
}

.bind-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 9px;
  border-radius: 8px;
  background: var(--soft);
}

.bind-row input {
  width: 16px;
  height: 16px;
}

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
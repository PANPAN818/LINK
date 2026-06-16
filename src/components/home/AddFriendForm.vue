<template>
  <section class="add-friend-sheet">
    <form v-if="activeTab === 'add'" id="add-friend-form" class="form-grid" @submit.prevent="submitAdd">
      <section class="profile-section wide-field" aria-label="角色基础资料">
        <div class="avatar-card">
          <img class="avatar-preview" :src="avatarPreview" :alt="draft.nickname || draft.name || 'new friend'" />
          <label class="avatar-upload">
            <input type="file" accept="image/*" @change="readAvatar($event)" />
            <span>导入头像</span>
          </label>
        </div>
        <div class="profile-fields">
          <label class="field avatar-url-field">
            <span>头像 URL</span>
            <input v-model="draft.avatar" placeholder="https://..." />
          </label>

          <section class="identity-row" aria-label="角色名称资料">
            <label class="field compact-field">
              <span>名字</span>
              <input v-model="draft.name" required placeholder="真名" />
            </label>

            <label class="field compact-field">
              <span>网名</span>
              <input v-model="draft.nickname" required placeholder="" />
            </label>

            <label class="field compact-field note-field">
              <span>备注</span>
              <input v-model="draft.userNote" placeholder="备注名" />
            </label>
          </section>
        </div>
      </section>

      <label class="field wide-field">
        <span>个性签名</span>
        <input v-model="draft.signature" placeholder="角色在 Link 上的个性签名" />
      </label>

      <label class="field wide-field">
        <span>角色资料</span>
        <textarea v-model="draft.description" rows="7" required />
      </label>

      <label class="field wide-field">
        <span>绑定用户账号</span>
        <select v-model="draft.boundUserId">
          <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.nickname }} · ID {{ account.id }}</option>
        </select>
      </label>

      <section class="local-book-bind wide-field" aria-labelledby="local-world-book-title">
        <div class="local-book-header">
          <strong id="local-world-book-title">绑定局部世界书</strong>
          <span v-if="localBooks.length">{{ draft.localWorldBookIds.length }}/{{ localBooks.length }}</span>
        </div>
        <div v-if="localBooks.length" class="local-book-list">
          <label v-for="book in localBooks" :key="book.id" class="local-book-row" :class="{ selected: draft.localWorldBookIds.includes(book.id) }">
            <input :checked="draft.localWorldBookIds.includes(book.id)" type="checkbox" @change="toggleLocalWorldBook(book.id, $event)" />
            <span class="book-check" aria-hidden="true"></span>
            <span>{{ book.title }}</span>
          </label>
        </div>
        <p v-else class="local-book-empty">暂无局部世界书</p>
      </section>

    </form>

    <section v-else-if="activeTab === 'scan'" class="scan-panel">
      <p class="panel-copy">导入 PNG 角色卡图片或 JSON 文件，会自动创建角色并把绑定世界书一起导入成局部世界书。</p>
      <label class="upload-card">
        <input type="file" accept=".json,image/png" @change="importCard($event)" />
        <ImagePlus class="upload-icon" :size="22" stroke-width="2.2" aria-hidden="true" />
        <strong>导入角色卡</strong>
        <span>支持 PNG / JSON</span>
      </label>

      <label class="field wide-field">
        <span>绑定用户账号</span>
        <select v-model="scanBoundUserId">
          <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.nickname }} · ID {{ account.id }}</option>
        </select>
      </label>

      <article v-if="importPreview" class="import-preview">
        <img :src="importPreview.avatar" :alt="importPreview.nickname" />
        <div>
          <strong>{{ importPreview.nickname }}</strong>
          <p>{{ importPreview.signature }}</p>
          <span>附带 {{ importPreview.worldBooks.length }} 条局部世界书</span>
        </div>
      </article>

      <button v-if="importPreview" class="primary-action" type="button" @click="submitImportedCharacter">导入</button>
    </section>

    <section v-else class="placeholder-panel">
      <strong>{{ activeTab === 'create-group' ? '创建群组' : '加入群组' }}</strong>
      <p>这里先保留占位，后续会接群资料、邀请口令和群聊会话流。</p>
    </section>

    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ImagePlus } from 'lucide-vue-next';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { UserProfile, WorldBookEntry } from '@/types/domain';
import { importSillyTavernCharacterCard, type ImportedCharacterCard } from '@/utils/characterCard';
import { readImageFileFromInput } from '@/utils/imageFile';

const defaultAvatarSeed = 'NewFriend';
const defaultAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="默认角色头像">
    <defs>
      <linearGradient id="friendCardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffd8e3"/>
        <stop offset="100%" stop-color="#dff7e8"/>
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="28" fill="url(#friendCardBg)"/>
    <circle cx="48" cy="35" r="15" fill="#ffffff" fill-opacity="0.96"/>
    <path d="M24 79c3-14 14-22 24-22s21 8 24 22" fill="#ffffff" fill-opacity="0.96"/>
    <text x="48" y="88" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#3a4a43">${defaultAvatarSeed}</text>
  </svg>
`)}`;

interface AddFriendPayload {
  nickname: string;
  name: string;
  userNote: string;
  avatar: string;
  signature: string;
  description: string;
  boundUserId: string;
  localWorldBookIds?: string[];
  importedWorldBooks?: WorldBookEntry[];
}

type TabId = 'add' | 'scan' | 'create-group' | 'join-group';

const props = withDefaults(defineProps<{
  accounts: UserProfile[];
  activeUserId: string;
  activeTab?: TabId;
  localBooks?: WorldBookEntry[];
}>(), {
  activeTab: 'add',
  localBooks: () => []
});

const emit = defineEmits<{
  add: [payload: AddFriendPayload];
  'update:activeTab': [value: TabId];
}>();

const activeTab = computed({
  get: () => props.activeTab,
  set: (value: TabId) => emit('update:activeTab', value)
});
const scanBoundUserId = ref(props.activeUserId || props.accounts[0]?.id || '');
const importPreview = ref<ImportedCharacterCard | null>(null);
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');
const localBooks = computed(() => props.localBooks.filter((book) => book.scope === 'local'));

const draft = reactive({
  nickname: '',
  name: '',
  userNote: '',
  avatar: '',
  signature: '',
  description: '',
  boundUserId: props.activeUserId || props.accounts[0]?.id || '',
  localWorldBookIds: [] as string[]
});
const avatarPreview = computed(() => draft.avatar.trim() || defaultAvatar);

const accounts = props.accounts;

function resetDraft() {
  draft.nickname = '';
  draft.name = '';
  draft.userNote = '';
  draft.avatar = '';
  draft.signature = '';
  draft.description = '';
  draft.boundUserId = props.activeUserId || props.accounts[0]?.id || '';
  draft.localWorldBookIds = [];
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

function submitAdd() {
  emit('add', {
    nickname: draft.nickname,
    name: draft.name,
    userNote: draft.userNote,
    avatar: avatarPreview.value,
    signature: draft.signature,
    description: draft.description,
    boundUserId: draft.boundUserId,
    localWorldBookIds: [...draft.localWorldBookIds]
  });
  resetDraft();
}

function toggleLocalWorldBook(bookId: string, event: Event) {
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
  const ids = new Set(draft.localWorldBookIds);
  if (checked) ids.add(bookId);
  else ids.delete(bookId);
  draft.localWorldBookIds = [...ids];
}

async function importCard(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importPreview.value = await importSillyTavernCharacterCard(file);
  input.value = '';
}

function submitImportedCharacter() {
  if (!importPreview.value) return;
  emit('add', {
    nickname: importPreview.value.nickname,
    name: importPreview.value.name,
    userNote: '',
    avatar: importPreview.value.avatar,
    signature: importPreview.value.signature,
    description: importPreview.value.description,
    boundUserId: scanBoundUserId.value,
    importedWorldBooks: importPreview.value.worldBooks
  });
  importPreview.value = null;
}
</script>

<style scoped>
.add-friend-sheet {
  display: grid;
  gap: 0;
  min-width: 0;
  color: #151719;
  font-size: 12px;
}

.form-grid,
.scan-panel,
.placeholder-panel {
  display: grid;
  gap: 14px;
}

.wide-field {
  min-width: 0;
}

.profile-section,
.local-book-bind,
.scan-panel,
.placeholder-panel {
  border: 1px solid rgba(17, 17, 17, 0.04);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14px 36px rgba(21, 30, 26, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.profile-section {
  display: grid;
  grid-template-columns: clamp(82px, 25vw, 104px) minmax(0, 1fr);
  gap: clamp(10px, 3vw, 14px);
  align-items: center;
  padding: clamp(12px, 3.5vw, 14px);
  border-radius: 24px;
}

.avatar-card {
  align-self: center;
  display: grid;
  justify-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-preview,
.import-preview img {
  width: clamp(70px, 21vw, 88px);
  height: clamp(70px, 21vw, 88px);
  border-radius: clamp(20px, 6vw, 26px);
  background: #eef3f1;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05), 0 12px 26px rgba(26, 33, 30, 0.08);
}

.avatar-upload,
.upload-card,
.primary-action {
  touch-action: manipulation;
}

.avatar-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  max-width: 100%;
  padding: 0 clamp(10px, 2.8vw, 12px);
  border-radius: 999px;
  border: 1px solid rgba(6, 199, 85, 0.16);
  background: linear-gradient(135deg, rgba(232, 249, 239, 0.98), rgba(255, 242, 247, 0.96));
  color: #16643e;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
  box-shadow: 0 10px 20px rgba(31, 120, 74, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.avatar-upload input,
.upload-card input {
  display: none;
}

.profile-fields {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.identity-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(8px, 2.5vw, 10px);
  min-width: 0;
}

.note-field {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.field > span {
  color: #4c5357;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  min-height: 44px;
  padding: 11px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #151719;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06);
}

.field textarea {
  min-height: 168px;
  resize: vertical;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #a3a9ad;
}

.field:focus-within > span {
  color: #17191b;
}

.field:focus-within input,
.field:focus-within textarea,
.field:focus-within select {
  box-shadow: inset 0 0 0 1px rgba(6, 199, 85, 0.35), 0 0 0 3px rgba(6, 199, 85, 0.1);
}

.local-book-bind {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 22px;
}

.local-book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.local-book-header strong {
  color: #30363a;
  font-size: 13px;
}

.local-book-header span,
.local-book-empty,
.panel-copy,
.placeholder-panel p,
.import-preview p,
.import-preview span {
  color: #69736f;
  line-height: 1.55;
}

.local-book-header span,
.local-book-empty {
  font-size: 11px;
  font-weight: 800;
}

.local-book-empty,
.panel-copy,
.placeholder-panel p {
  margin: 0;
}

.local-book-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.local-book-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 16px;
  border: 1px solid rgba(42, 75, 60, 0.08);
  background: rgba(250, 252, 250, 0.96);
  color: #33393d;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(30, 55, 45, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  touch-action: manipulation;
}

.local-book-row input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.book-check {
  position: relative;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1.5px rgba(104, 119, 111, 0.35);
}

.book-check::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 4px;
  width: 6px;
  height: 10px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.local-book-row.selected {
  border-color: rgba(6, 199, 85, 0.24);
  background: linear-gradient(135deg, rgba(237, 252, 242, 0.98), rgba(255, 246, 249, 0.96));
  color: #1f5f3d;
  box-shadow: 0 10px 24px rgba(31, 120, 74, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.local-book-row.selected .book-check {
  background: var(--link-green);
  box-shadow: inset 0 0 0 1px rgba(6, 199, 85, 0.7), 0 6px 14px rgba(6, 199, 85, 0.22);
}

.local-book-row.selected .book-check::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.local-book-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-action {
  border: 1px solid rgba(6, 199, 85, 0.18);
  background: linear-gradient(135deg, rgba(224, 249, 233, 0.98), rgba(255, 242, 247, 0.96));
  color: #16643e;
  box-shadow: 0 14px 28px rgba(31, 120, 74, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.scan-panel,
.placeholder-panel {
  padding: 14px;
  border-radius: 24px;
}

.panel-copy {
  font-size: 12px;
}

.upload-card {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 8px;
  min-height: 136px;
  padding: 18px;
  border: 1px dashed rgba(21, 23, 25, 0.14);
  border-radius: 22px;
  background: rgba(248, 251, 249, 0.94);
  color: #202426;
  text-align: center;
}

.upload-icon {
  color: var(--link-green);
}

.upload-card strong,
.placeholder-panel strong,
.import-preview strong {
  font-size: 13px;
}

.upload-card span,
.import-preview span {
  color: #78807c;
  font-size: 11px;
  font-weight: 800;
}

.import-preview {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 22px;
  background: rgba(248, 251, 249, 0.94);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05);
}

.import-preview p,
.import-preview span {
  display: block;
  margin: 6px 0 0;
  font-size: 11px;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  border-radius: 17px;
  font-size: 12px;
  font-weight: 800;
}

.placeholder-panel {
  min-height: 220px;
  align-content: center;
  justify-items: center;
  text-align: center;
}

</style>
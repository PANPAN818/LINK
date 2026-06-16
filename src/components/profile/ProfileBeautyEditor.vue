<template>
  <form class="profile-editor" @submit.prevent="submit">
    <section class="editor-preview" :style="previewStyle">
      <div class="preview-copy">
        <span>{{ draft.archiveLabel }}</span>
        <strong>{{ draft.nickname || 'momo' }}</strong>
        <small>@{{ displayHandle }} · {{ draft.mood || 'soft mood' }}</small>
      </div>
      <div class="preview-card">
        <img :src="draft.avatar" :alt="draft.nickname" />
        <div>
          <p>{{ draft.bio }}</p>
          <small>{{ draft.location }}</small>
        </div>
      </div>
    </section>

    <section class="editor-section">
      <h3><UserRound :size="17" /> 文字</h3>
      <div class="editor-grid">
        <label class="editor-field">
          <span>归档标题</span>
          <input v-model="draft.archiveLabel" required />
        </label>
        <label class="editor-field">
          <span>右上编辑按钮</span>
          <input v-model="draft.editLabel" required />
        </label>
        <label class="editor-field">
          <span>弹层标题</span>
          <input v-model="draft.editorTitle" required />
        </label>
        <label class="editor-field">
          <span>昵称</span>
          <input v-model="draft.nickname" required />
        </label>
        <label class="editor-field">
          <span>账号</span>
          <input v-model="draft.handle" placeholder="momo.zip" />
        </label>
        <label class="editor-field">
          <span>心情</span>
          <input v-model="draft.mood" />
        </label>
        <label class="editor-field wide">
          <span>个性签名</span>
          <textarea v-model="draft.bio" required />
        </label>
        <label class="editor-field">
          <span>所在地</span>
          <input v-model="draft.location" />
        </label>
        <label class="editor-field">
          <span>私信按钮文字</span>
          <input v-model="draft.messageLabel" />
        </label>
        <label class="editor-field">
          <span>Moments 标题</span>
          <input v-model="draft.momentsLabel" />
        </label>
      </div>
    </section>

    <section class="editor-section">
      <h3><ImagePlus :size="17" /> 图片与颜色</h3>
      <div class="editor-grid">
        <label class="editor-field wide">
          <span>全屏背景图 URL</span>
          <input v-model="draft.backgroundImage" required />
        </label>
        <label class="editor-field wide">
          <span>头像 URL</span>
          <input v-model="draft.avatar" required />
        </label>
        <div class="upload-row wide">
          <label class="upload-action">
            <ImagePlus :size="17" /> 上传背景
            <input type="file" accept="image/*" @change="readImageFile('backgroundImage', $event)" />
          </label>
          <label class="upload-action">
            <Camera :size="17" /> 上传头像
            <input type="file" accept="image/*" @change="readImageFile('avatar', $event)" />
          </label>
        </div>
        <label class="editor-field">
          <span>强调色</span>
          <input v-model="draft.accentColor" type="color" />
        </label>
        <div class="swatch-row">
          <button
            v-for="color in profileAccentOptions"
            :key="color"
            class="color-swatch"
            :class="{ selected: draft.accentColor === color }"
            :style="{ backgroundColor: color }"
            type="button"
            :aria-label="`选择颜色 ${color}`"
            @click="draft.accentColor = color"
          ></button>
        </div>
      </div>
    </section>

    <section class="editor-section">
      <h3><SlidersHorizontal :size="17" /> 数据与标签</h3>
      <div class="editor-grid stats-grid">
        <label class="editor-field">
          <span>数字 1</span>
          <input v-model.number="draft.stats.posts" type="number" min="0" />
        </label>
        <label class="editor-field">
          <span>标题 1</span>
          <input v-model="draft.stats.postsLabel" />
        </label>
        <label class="editor-field">
          <span>数字 2</span>
          <input v-model="draft.stats.followers" />
        </label>
        <label class="editor-field">
          <span>标题 2</span>
          <input v-model="draft.stats.followersLabel" />
        </label>
        <label class="editor-field">
          <span>数字 3</span>
          <input v-model.number="draft.stats.following" type="number" min="0" />
        </label>
        <label class="editor-field">
          <span>标题 3</span>
          <input v-model="draft.stats.followingLabel" />
        </label>
        <label class="editor-field wide">
          <span>卡片内标签</span>
          <input v-model="tagText" placeholder="daily, film, cafe" />
        </label>
        <label class="editor-field wide">
          <span>胶囊标签</span>
          <input v-model="chipText" placeholder="seoul, cafe day, film" />
        </label>
      </div>
    </section>

    <section class="editor-section">
      <h3><LinkIcon :size="17" /> 链接组件</h3>
      <div class="repeat-list">
        <div v-for="(link, index) in draft.links" :key="link.id" class="repeat-row">
          <label class="editor-field">
            <span>左侧文字</span>
            <input v-model="link.label" />
          </label>
          <label class="editor-field">
            <span>右侧链接</span>
            <input v-model="link.url" />
          </label>
          <button class="mini-action" type="button" aria-label="删除链接" @click="removeItem('links', index)">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
      <button class="secondary-editor-action" type="button" @click="addLink">
        <Plus :size="17" /> 添加链接
      </button>
    </section>

    <section class="editor-section">
      <h3><CircleDot :size="17" /> 高光组件</h3>
      <div class="repeat-list">
        <div v-for="(highlight, index) in draft.highlights" :key="highlight.id" class="repeat-row media-row">
          <img :src="highlight.image || draft.avatar" :alt="highlight.title" />
          <label class="editor-field">
            <span>标题</span>
            <input v-model="highlight.title" />
          </label>
          <label class="editor-field">
            <span>图片 URL</span>
            <input v-model="highlight.image" />
          </label>
          <label class="mini-upload">
            <ImagePlus :size="16" />
            <input type="file" accept="image/*" @change="readCollectionImage('highlights', index, $event)" />
          </label>
          <button class="mini-action" type="button" aria-label="删除高光" @click="removeItem('highlights', index)">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
      <button class="secondary-editor-action" type="button" @click="addHighlight">
        <Plus :size="17" /> 添加高光
      </button>
    </section>

    <section class="editor-section">
      <h3><Grid3X3 :size="17" /> Moments 组件</h3>
      <div class="repeat-list">
        <div v-for="(moment, index) in draft.moments" :key="moment.id" class="repeat-row media-row">
          <img :src="moment.image || draft.avatar" :alt="moment.title" />
          <label class="editor-field">
            <span>标题</span>
            <input v-model="moment.title" />
          </label>
          <label class="editor-field">
            <span>图片 URL</span>
            <input v-model="moment.image" />
          </label>
          <label class="mini-upload">
            <ImagePlus :size="16" />
            <input type="file" accept="image/*" @change="readCollectionImage('moments', index, $event)" />
          </label>
          <button class="mini-action" type="button" aria-label="删除 Moment" @click="removeItem('moments', index)">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
      <button class="secondary-editor-action" type="button" @click="addMoment">
        <Plus :size="17" /> 添加 Moment
      </button>
    </section>

    <div class="form-actions">
      <button class="save-action" type="submit">
        <Check :size="18" /> 保存
      </button>
    </div>

    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Camera, Check, CircleDot, Grid3X3, ImagePlus, Link as LinkIcon, Plus, SlidersHorizontal, Trash2, UserRound } from 'lucide-vue-next';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { VisualProfile } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';
import { normalizeVisualProfile, profileAccentOptions } from '@/utils/profile';

type ImageField = 'avatar' | 'backgroundImage';
type MediaCollection = 'highlights' | 'moments';
type RepeatableCollection = 'links' | MediaCollection;

const props = defineProps<{
  profile: VisualProfile;
}>();

const emit = defineEmits<{
  save: [profile: VisualProfile];
}>();

const draft = reactive<VisualProfile>(normalizeVisualProfile(props.profile));
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');

watch(
  () => props.profile,
  (nextProfile) => {
    Object.assign(draft, normalizeVisualProfile(nextProfile));
  },
  { immediate: true, deep: true }
);

const tagText = computed({
  get: () => draft.tags.join(', '),
  set: (value: string) => {
    draft.tags = splitList(value, 12);
  }
});

const chipText = computed({
  get: () => draft.chips.join(', '),
  set: (value: string) => {
    draft.chips = splitList(value, 12);
  }
});

const displayHandle = computed(() => draft.handle.replace(/^@/, '') || 'momo.zip');

const previewStyle = computed(() => ({
  '--profile-accent': draft.accentColor || '#f49ab5',
  backgroundImage: `linear-gradient(180deg, rgba(66, 66, 62, 0.04), rgba(52, 54, 52, 0.4)), url(${JSON.stringify(draft.backgroundImage)})`
}));

function splitList(value: string, limit: number) {
  return value
    .split(/[，,\n]/)
    .map((item) => item.trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, limit);
}

function createEditorId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function addLink() {
  draft.links.push({ id: createEditorId('profile_link'), label: 'new link', url: '' });
}

function addHighlight() {
  draft.highlights.push({ id: createEditorId('profile_highlight'), title: 'new', image: '' });
}

function addMoment() {
  draft.moments.push({ id: createEditorId('profile_moment'), title: 'new', image: '' });
}

function removeItem(collection: RepeatableCollection, index: number) {
  draft[collection].splice(index, 1);
}

async function readImageFile(field: ImageField, event: Event) {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  if (field === 'avatar') {
    avatarEditorSource.value = image;
    showAvatarEditor.value = true;
    return;
  }
  draft[field] = image;
}

function applyEditedAvatar(value: string) {
  draft.avatar = value;
}

function readCollectionImage(collection: MediaCollection, index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    draft[collection][index].image = String(reader.result ?? draft[collection][index].image);
    input.value = '';
  });
  reader.readAsDataURL(file);
}

function submit() {
  emit('save', normalizeVisualProfile(draft));
}
</script>

<style scoped>
.profile-editor {
  display: grid;
  gap: 16px;
  color: #252323;
}

.editor-preview {
  display: grid;
  gap: 14px;
  min-height: 260px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  background-color: #7d7f7b;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
}

.preview-copy {
  display: grid;
  justify-items: start;
}

.preview-copy span {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 15px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.preview-copy strong {
  margin-top: 22px;
  font-size: 46px;
  line-height: 0.88;
  font-weight: 900;
}

.preview-copy small {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 850;
}

.preview-card {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  background: rgba(242, 242, 242, 0.88);
  color: #252323;
  backdrop-filter: blur(16px);
}

.preview-card img {
  width: 76px;
  height: 76px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  object-fit: cover;
}

.preview-card p,
.preview-card small {
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-card p {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 900;
}

.preview-card small {
  display: block;
  color: #767676;
  font-size: 13px;
  font-weight: 850;
  white-space: nowrap;
}

.editor-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  background: rgba(245, 245, 245, 0.74);
  box-shadow: 0 12px 34px rgba(45, 45, 45, 0.08);
  backdrop-filter: blur(14px);
}

.editor-section:last-of-type {
  border-bottom: 1px solid rgba(255, 255, 255, 0.72);
}

.editor-section h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.editor-grid,
.repeat-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.editor-field {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.editor-field.wide,
.upload-row.wide {
  grid-column: 1 / -1;
}

.editor-field span {
  color: #6e6e6e;
  font-size: 12px;
  font-weight: 900;
}

.editor-field input,
.editor-field textarea {
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.62);
  padding: 9px 12px;
  color: #111111;
  font-weight: 760;
}

.editor-field input[type='color'] {
  padding: 4px;
}

.editor-field textarea {
  min-height: 92px;
  resize: vertical;
}

.upload-row,
.swatch-row,
.form-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.upload-action,
.secondary-editor-action,
.mini-action,
.mini-upload,
.save-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  border-radius: 8px;
  font-weight: 900;
}

.upload-action {
  position: relative;
  flex: 1;
  min-width: 120px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.58);
  overflow: hidden;
}

.upload-action input,
.mini-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.color-swatch {
  width: 34px;
  height: 34px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-swatch.selected {
  box-shadow: 0 0 0 3px #111111;
}

.repeat-list {
  display: grid;
  gap: 12px;
}

.repeat-row {
  align-items: end;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  background: rgba(255, 255, 255, 0.44);
}

.media-row {
  grid-template-columns: 48px minmax(0, 1fr) minmax(0, 1fr) 38px 38px;
}

.media-row img {
  align-self: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.58);
}

.mini-action,
.mini-upload {
  position: relative;
  width: 38px;
  background: rgba(255, 255, 255, 0.82);
  color: #2a2a2a;
}

.secondary-editor-action {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.54);
}

.form-actions {
  position: sticky;
  bottom: -14px;
  padding: 10px 0 0;
  background: linear-gradient(180deg, rgba(224, 224, 224, 0), rgba(224, 224, 224, 0.96) 28%);
}

.save-action {
  width: 100%;
  min-height: 52px;
  background: var(--profile-accent, #f49ab5);
  color: #ffffff;
  font-size: 16px;
}

@media (max-width: 380px) {
  .editor-grid,
  .repeat-row,
  .media-row {
    grid-template-columns: 1fr;
  }

  .media-row img {
    width: 72px;
    height: 72px;
  }
}
</style>

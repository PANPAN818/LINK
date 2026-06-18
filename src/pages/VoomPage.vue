<template>
  <section class="screen voom-page">
    <header class="top-bar">
      <h1 class="top-title">LINK VOOM</h1>
      <div class="icon-row">
        <button class="icon-button" type="button" aria-label="用户发布 VOOM" @click="openUserVoomPublisher">
          <Plus :size="24" />
        </button>
        <button class="icon-button" type="button" aria-label="发布 VOOM" @click="openVoomPublisher">
          <SquarePen :size="24" />
        </button>
        <ImageModelPickerButton :icon-size="24" />
      </div>
    </header>

    <section class="story-strip">
      <button class="story-button" type="button">
        <span class="story-avatar">
          <UserRound :size="30" />
          <i><Plus :size="16" /></i>
        </span>
        <span>您的故事</span>
      </button>
    </section>

    <div v-if="!store.sortedVoomPosts.length" class="empty-state">
      <div>
        <h2>马上就开始使用LINK VOOM吧!</h2>
        <p>到LINK VOOM看看大家的近况吧!<br />您也试着分享看看吧!</p>
      </div>
    </div>

    <VoomPostCard
      v-for="post in store.sortedVoomPosts"
      :key="post.id"
      :post="post"
      :author-name="voomAuthorNameForPost(post)"
      :current-user-name="store.user?.nickname"
      :can-regenerate-image="canRegenerateVoomImage"
      :regenerating-image="regeneratingImagePostIds.includes(post.id)"
      :replying-thread="store.isReplyingVoomComments(post.id)"
      @comment="handleComment"
      @regenerate-image="handleRegenerateImage"
      @reply-thread="store.replyToVoomComments"
      @toggle-like="store.toggleVoomLike"
    />

    <AppModal v-model="showVoomPublisher" title="发布 VOOM" variant="ins">
      <section class="voom-publisher">
        <div class="publisher-copy">
          <strong>选择发布角色</strong>
          <span>{{ publisherCharacters.length ? '将根据该角色最近的聊天与记忆生成动态。' : '当前账号还没有绑定可发布 VOOM 的角色。' }}</span>
        </div>

        <div v-if="publisherCharacters.length" class="publisher-list">
          <button
            class="publisher-option"
            :class="{ active: selectedPublisherId === randomPublisherId }"
            type="button"
            :disabled="creatingVoomPost"
            @click="selectedPublisherId = randomPublisherId"
          >
            <span class="random-avatar"><Shuffle :size="20" /></span>
            <span>
              <strong>随机角色</strong>
              <small>从当前账号绑定角色中抽取</small>
            </span>
          </button>

          <button
            v-for="character in publisherCharacters"
            :key="character.id"
            class="publisher-option"
            :class="{ active: selectedPublisherId === character.id }"
            type="button"
            :disabled="creatingVoomPost"
            @click="selectedPublisherId = character.id"
          >
            <img :src="character.avatar" :alt="getCharacterDisplayName(character)" />
            <span>
              <strong>{{ getCharacterDisplayName(character) }}</strong>
              <small>{{ character.name }}</small>
            </span>
          </button>
        </div>

        <section v-else class="picker-empty">
          <strong>暂无角色</strong>
          <p>请先在当前账号下添加并绑定角色。</p>
        </section>

        <div class="publisher-actions">
          <button class="publisher-secondary" type="button" :disabled="creatingVoomPost" @click="showVoomPublisher = false">取消</button>
          <button class="publisher-primary" type="button" :disabled="creatingVoomPost || !publisherCharacters.length" @click="confirmCreateVoomPost">
            <LoaderCircle v-if="creatingVoomPost" class="publisher-loading" :size="16" />
            <span>{{ creatingVoomPost ? '生成中' : '确认发布' }}</span>
          </button>
        </div>
      </section>
    </AppModal>

    <AppModal v-model="showUserVoomPublisher" title="发布 VOOM" variant="ins">
      <form class="user-voom-publisher" @submit.prevent="confirmCreateUserVoomPost">
        <section class="manual-section">
          <div class="publisher-copy">
            <strong>选择账号</strong>
            <span>以这个用户身份发布到可见角色的 VOOM 与对话里。</span>
          </div>
          <div class="account-list">
            <button
              v-for="account in store.accounts"
              :key="account.id"
              class="account-option"
              :class="{ active: selectedUserVoomAccountId === account.id }"
              type="button"
              :disabled="creatingUserVoomPost"
              @click="selectUserVoomAccount(account.id)"
            >
              <img :src="account.avatar" :alt="account.nickname || account.name" />
              <span>
                <strong>{{ account.nickname || account.name }}</strong>
                <small>{{ account.id }}</small>
              </span>
            </button>
          </div>
        </section>

        <label class="manual-field">
          <span>正文</span>
          <textarea v-model="userVoomContent" maxlength="500" placeholder="写点什么" :disabled="creatingUserVoomPost"></textarea>
        </label>

        <section class="manual-section">
          <div class="publisher-copy compact-copy">
            <strong>配图</strong>
            <span>可留空，也可以选择本地图片或文字描述卡片。</span>
          </div>
          <div class="media-tabs">
            <button type="button" :class="{ active: userVoomMediaMode === 'none' }" :disabled="creatingUserVoomPost" @click="setUserVoomMediaMode('none')">
              <X :size="15" />
              <span>无</span>
            </button>
            <button type="button" :class="{ active: userVoomMediaMode === 'image' }" :disabled="creatingUserVoomPost" @click="setUserVoomMediaMode('image')">
              <ImageIcon :size="15" />
              <span>图片</span>
            </button>
            <button type="button" :class="{ active: userVoomMediaMode === 'card' }" :disabled="creatingUserVoomPost" @click="setUserVoomMediaMode('card')">
              <FileText :size="15" />
              <span>卡片</span>
            </button>
          </div>

          <div v-if="userVoomMediaMode === 'image'" class="image-compose">
            <label class="image-upload">
              <input type="file" accept="image/*" :disabled="creatingUserVoomPost" @change="readUserVoomImage" />
              <img v-if="userVoomImage" :src="userVoomImage" alt="VOOM 图片预览" />
              <span v-else><Upload :size="18" />选择本地图片</span>
            </label>
            <label class="manual-field compact-field">
              <span>图片描述</span>
              <textarea v-model="userVoomImageDescription" maxlength="120" placeholder="可选，用于对话记录与评论区" :disabled="creatingUserVoomPost"></textarea>
            </label>
          </div>

          <label v-else-if="userVoomMediaMode === 'card'" class="manual-field compact-field">
            <span>文字描述卡片</span>
            <textarea v-model="userVoomImageDescription" maxlength="120" placeholder="写下卡片内容或画面描述" :disabled="creatingUserVoomPost"></textarea>
          </label>
        </section>

        <section class="manual-section">
          <div class="publisher-copy compact-copy">
            <strong>可见范围</strong>
            <span>{{ userVoomVisibilitySummary }}</span>
          </div>
          <div class="visibility-tabs">
            <button type="button" :class="{ active: userVoomVisibility === 'public' }" :disabled="creatingUserVoomPost" @click="selectUserVoomVisibility('public')">
              <Globe2 :size="15" />
              <span>公开</span>
            </button>
            <button type="button" :class="{ active: userVoomVisibility === 'selected' }" :disabled="creatingUserVoomPost" @click="selectUserVoomVisibility('selected')">
              <UserRound :size="15" />
              <span>指定角色</span>
            </button>
          </div>

          <div v-if="userVoomVisibility === 'selected' && userVoomAccountCharacters.length" class="target-list">
            <label v-for="character in userVoomAccountCharacters" :key="character.id" class="target-option">
              <input type="checkbox" :checked="selectedUserVoomCharacterIds.includes(character.id)" :disabled="creatingUserVoomPost" @change="toggleUserVoomCharacter(character.id)" />
              <img :src="character.avatar" :alt="getCharacterDisplayName(character)" />
              <span>
                <strong>{{ getCharacterDisplayName(character) }}</strong>
                <small>{{ character.name }}</small>
              </span>
            </label>
          </div>

          <section v-else-if="!userVoomAccountCharacters.length" class="picker-empty">
            <strong>暂无可见角色</strong>
            <p>这个账号还没有绑定角色。</p>
          </section>
        </section>

        <div class="publisher-actions">
          <button class="publisher-secondary" type="button" :disabled="creatingUserVoomPost" @click="showUserVoomPublisher = false">取消</button>
          <button class="publisher-primary" type="submit" :disabled="!canSubmitUserVoomPost || creatingUserVoomPost">
            <LoaderCircle v-if="creatingUserVoomPost" class="publisher-loading" :size="16" />
            <span>{{ creatingUserVoomPost ? '发布中' : '发布' }}</span>
          </button>
        </div>
      </form>
    </AppModal>

  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { FileText, Globe2, Image as ImageIcon, LoaderCircle, Plus, Shuffle, SquarePen, Upload, UserRound, X } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import ImageModelPickerButton from '@/components/settings/ImageModelPickerButton.vue';
import VoomPostCard from '@/components/voom/VoomPostCard.vue';
import { useAppStore } from '@/stores/appStore';
import type { VoomPost, VoomPostVisibility } from '@/types/domain';
import { getCharacterDisplayName, getCharacterVoomAuthorName } from '@/utils/character';
import { getSelectedImageModelOption } from '@/utils/settings';

const store = useAppStore();
const showVoomPublisher = ref(false);
const showUserVoomPublisher = ref(false);
const creatingVoomPost = ref(false);
const creatingUserVoomPost = ref(false);
const regeneratingImagePostIds = ref<string[]>([]);
const randomPublisherId = 'random';
const selectedPublisherId = ref(randomPublisherId);
const selectedUserVoomAccountId = ref('');
const userVoomContent = ref('');
const userVoomMediaMode = ref<'none' | 'image' | 'card'>('none');
const userVoomImage = ref('');
const userVoomImageDescription = ref('');
const userVoomVisibility = ref<VoomPostVisibility>('public');
const selectedUserVoomCharacterIds = ref<string[]>([]);

const publisherCharacters = computed(() => store.charactersForActiveUser);
const canRegenerateVoomImage = computed(() => Boolean(getSelectedImageModelOption(store.settings)));

const selectedUserVoomAccount = computed(() => {
  const selectedId = selectedUserVoomAccountId.value.trim();
  return (selectedId ? store.userById(selectedId) : null) ?? store.user ?? store.accounts[0] ?? null;
});

const userVoomAccountCharacters = computed(() => {
  const accountId = selectedUserVoomAccount.value?.id;
  return accountId ? store.characters.filter((character) => character.boundUserId === accountId) : [];
});

const userVoomTargetCharacterIds = computed(() => {
  if (userVoomVisibility.value === 'public') return userVoomAccountCharacters.value.map((character) => character.id);
  const availableIds = new Set(userVoomAccountCharacters.value.map((character) => character.id));
  return selectedUserVoomCharacterIds.value.filter((id) => availableIds.has(id));
});

const userVoomVisibilitySummary = computed(() => {
  const total = userVoomAccountCharacters.value.length;
  if (userVoomVisibility.value === 'public') return total ? `公开给该账号绑定的 ${total} 个角色` : '该账号暂无绑定角色';
  return total ? `已选择 ${userVoomTargetCharacterIds.value.length} / ${total} 个角色` : '该账号暂无可选择角色';
});

const canSubmitUserVoomPost = computed(() => {
  if (!selectedUserVoomAccount.value || !userVoomContent.value.trim() || !userVoomTargetCharacterIds.value.length) return false;
  if (userVoomMediaMode.value === 'image') return Boolean(userVoomImage.value);
  if (userVoomMediaMode.value === 'card') return Boolean(userVoomImageDescription.value.trim());
  return true;
});

function voomAuthorNameForPost(post: VoomPost) {
  const character = store.characterById(post.charId);
  return character ? getCharacterVoomAuthorName(character) : post.authorName;
}

async function handleComment(postId: string, content: string, parentId?: string) {
  await store.addVoomComment(postId, content, parentId ?? '');
}

async function handleRegenerateImage(postId: string, description: string) {
  if (regeneratingImagePostIds.value.includes(postId)) return;
  regeneratingImagePostIds.value = [...regeneratingImagePostIds.value, postId];
  try {
    await store.regenerateVoomPostImage(postId, description);
  } finally {
    regeneratingImagePostIds.value = regeneratingImagePostIds.value.filter((id) => id !== postId);
  }
}

function openVoomPublisher() {
  selectedPublisherId.value = randomPublisherId;
  showVoomPublisher.value = true;
}

function resetUserVoomDraft(accountId = store.user?.id || store.accounts[0]?.id || '') {
  selectedUserVoomAccountId.value = accountId;
  userVoomContent.value = '';
  userVoomMediaMode.value = 'none';
  userVoomImage.value = '';
  userVoomImageDescription.value = '';
  userVoomVisibility.value = 'public';
  selectedUserVoomCharacterIds.value = store.characters
    .filter((character) => character.boundUserId === accountId)
    .map((character) => character.id);
}

function openUserVoomPublisher() {
  resetUserVoomDraft();
  showUserVoomPublisher.value = true;
}

function selectUserVoomAccount(accountId: string) {
  selectedUserVoomAccountId.value = accountId;
  selectedUserVoomCharacterIds.value = store.characters
    .filter((character) => character.boundUserId === accountId)
    .map((character) => character.id);
}

function setUserVoomMediaMode(mode: 'none' | 'image' | 'card') {
  userVoomMediaMode.value = mode;
  if (mode === 'none') {
    userVoomImage.value = '';
    userVoomImageDescription.value = '';
  } else if (mode === 'card') {
    userVoomImage.value = '';
  }
}

function selectUserVoomVisibility(visibility: VoomPostVisibility) {
  userVoomVisibility.value = visibility;
  if (visibility === 'selected' && !selectedUserVoomCharacterIds.value.length) {
    selectedUserVoomCharacterIds.value = userVoomAccountCharacters.value.map((character) => character.id);
  }
}

function toggleUserVoomCharacter(characterId: string) {
  selectedUserVoomCharacterIds.value = selectedUserVoomCharacterIds.value.includes(characterId)
    ? selectedUserVoomCharacterIds.value.filter((id) => id !== characterId)
    : [...selectedUserVoomCharacterIds.value, characterId];
}

function readUserVoomImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    userVoomImage.value = String(reader.result ?? '');
    input.value = '';
  });
  reader.readAsDataURL(file);
}

function resolvePublisherCharacter() {
  if (!publisherCharacters.value.length) return null;
  if (selectedPublisherId.value === randomPublisherId) {
    return publisherCharacters.value[Math.floor(Math.random() * publisherCharacters.value.length)];
  }
  return publisherCharacters.value.find((character) => character.id === selectedPublisherId.value) ?? publisherCharacters.value[0];
}

async function confirmCreateVoomPost() {
  const character = resolvePublisherCharacter();
  const conversation = character ? store.conversations.find((item) => item.charId === character.id) : null;
  if (!conversation) {
    store.showConfigAlert('请先添加并绑定一个角色，再生成 VOOM。', '无法生成 VOOM');
    return;
  }
  creatingVoomPost.value = true;
  try {
    const post = await store.createMomentFromConversation(conversation.id);
    if (post) showVoomPublisher.value = false;
  } finally {
    creatingVoomPost.value = false;
  }
}

async function confirmCreateUserVoomPost() {
  if (creatingUserVoomPost.value) return;
  creatingUserVoomPost.value = true;
  try {
    const post = await store.createUserVoomPost({
      userId: selectedUserVoomAccount.value?.id ?? '',
      content: userVoomContent.value,
      image: userVoomMediaMode.value === 'image' ? userVoomImage.value : '',
      imageDescription: userVoomMediaMode.value === 'none' ? '' : userVoomImageDescription.value,
      visibility: userVoomVisibility.value,
      characterIds: userVoomVisibility.value === 'selected' ? userVoomTargetCharacterIds.value : []
    });
    if (post) {
      showUserVoomPublisher.value = false;
      resetUserVoomDraft(selectedUserVoomAccount.value?.id);
    }
  } catch (error) {
    store.showConfigAlert(error instanceof Error ? error.message : '用户 VOOM 发布失败。', '无法发布 VOOM');
  } finally {
    creatingUserVoomPost.value = false;
  }
}
</script>

<style scoped>
.voom-page {
  background: #ffffff;
}

.story-strip {
  padding: 8px 16px 18px;
}

.story-button {
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #222222;
  font-size: 12px;
}

.story-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #cfedfb;
  color: #ffffff;
}

.story-avatar > svg {
  width: 26px;
  height: 26px;
}

.story-avatar i {
  position: absolute;
  right: -2px;
  bottom: 5px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #35cf64;
  color: #ffffff;
  font-style: normal;
}

.story-avatar i svg {
  width: 14px;
  height: 14px;
}

.empty-state h2 {
  margin: 0 0 6px;
  color: #222222;
  font-size: 18px;
}

.empty-state p {
  margin: 0;
  line-height: 1.55;
}

.model-picker {
  display: grid;
  gap: 14px;
}

.voom-publisher {
  display: grid;
  gap: 14px;
}

.user-voom-publisher {
  display: grid;
  gap: 14px;
}

.manual-section {
  display: grid;
  gap: 10px;
}

.compact-copy strong {
  font-size: 15px;
}

.account-list,
.target-list {
  display: grid;
  gap: 8px;
}

.account-option,
.target-option {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 10px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
  text-align: left;
}

.target-option {
  grid-template-columns: 20px 38px minmax(0, 1fr);
}

.account-option.active,
.target-option:has(input:checked) {
  border-color: rgba(6, 199, 85, 0.54);
  background: #effbf4;
}

.account-option img,
.target-option img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--soft);
}

.account-option span,
.target-option span {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.account-option strong,
.account-option small,
.target-option strong,
.target-option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-option strong,
.target-option strong {
  font-size: 13px;
  font-weight: 850;
}

.account-option small,
.target-option small {
  color: #858a91;
  font-size: 11px;
}

.target-option input {
  width: 17px;
  height: 17px;
  accent-color: var(--link-green);
}

.manual-field {
  display: grid;
  gap: 6px;
}

.manual-field > span {
  color: #686b70;
  font-size: 12px;
  font-weight: 800;
}

.manual-field textarea {
  min-height: 86px;
  padding: 10px;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
  line-height: 1.5;
  resize: vertical;
}

.compact-field textarea {
  min-height: 62px;
}

.media-tabs,
.visibility-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.visibility-tabs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.media-tabs button,
.visibility-tabs button {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 8px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #ffffff;
  color: #4f555c;
  font-weight: 850;
}

.media-tabs button.active,
.visibility-tabs button.active {
  border-color: rgba(6, 199, 85, 0.54);
  background: #effbf4;
  color: #12853f;
}

.image-compose {
  display: grid;
  gap: 10px;
}

.image-upload {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 136px;
  overflow: hidden;
  border: 1px dashed #d7dde2;
  border-radius: 8px;
  background: #ffffff;
  color: #697079;
  font-weight: 850;
}

.image-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.image-upload img {
  width: 100%;
  height: 100%;
  max-height: 220px;
  object-fit: cover;
}

.image-upload span {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 6px;
}

.publisher-copy {
  display: grid;
  gap: 5px;
}

.publisher-copy strong {
  color: #151515;
  font-size: 18px;
  font-weight: 900;
}

.publisher-copy span {
  color: #767b82;
  font-size: 12px;
  line-height: 1.45;
}

.publisher-list {
  display: grid;
  gap: 10px;
}

.publisher-option {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
  padding: 8px 10px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
  text-align: left;
}

.publisher-option.active {
  border-color: rgba(6, 199, 85, 0.54);
  background: #effbf4;
}

.publisher-option:disabled {
  cursor: progress;
  opacity: 0.72;
}

.publisher-option img,
.random-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
}

.publisher-option img {
  object-fit: cover;
}

.random-avatar {
  display: grid;
  place-items: center;
  background: #141414;
  color: #ffffff;
}

.publisher-option span:not(.random-avatar) {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.publisher-option strong,
.publisher-option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publisher-option strong {
  font-size: 14px;
  font-weight: 850;
}

.publisher-option small {
  color: #858a91;
  font-size: 11px;
}

.publisher-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.user-voom-publisher > .publisher-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin: 2px -13px -13px;
  padding: 10px 13px calc(12px + var(--safe-bottom));
  border-top: 1px solid rgba(236, 239, 241, 0.8);
  background: rgba(248, 249, 252, 0.96);
  backdrop-filter: blur(16px);
}

.publisher-secondary,
.publisher-primary {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border-radius: 8px;
  font-weight: 900;
}

.publisher-secondary {
  background: #f1f3f5;
  color: #4f555c;
}

.publisher-primary {
  background: #171717;
  color: #ffffff;
}

.publisher-secondary:disabled,
.publisher-primary:disabled {
  cursor: progress;
  opacity: 0.7;
}

.publisher-loading {
  animation: publisher-spin 0.8s linear infinite;
}

@keyframes publisher-spin {
  to {
    transform: rotate(360deg);
  }
}

.picker-copy {
  display: grid;
  gap: 5px;
}

.picker-copy strong {
  color: #151515;
  font-size: 18px;
  font-weight: 900;
}

.picker-copy span {
  color: #767b82;
  font-size: 12px;
  line-height: 1.45;
}

.model-list {
  display: grid;
  gap: 10px;
}

.model-option {
  display: grid;
  gap: 5px;
  width: 100%;
  padding: 12px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #ffffff;
  color: #171717;
  text-align: left;
}

.model-option.active {
  border-color: rgba(6, 199, 85, 0.54);
  background: #effbf4;
}

.model-provider {
  color: var(--link-green);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.model-option strong {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.model-option small {
  overflow-wrap: anywhere;
  color: #858a91;
  font-size: 11px;
  line-height: 1.35;
}

.picker-empty {
  display: grid;
  gap: 7px;
  padding: 14px;
  border-radius: 8px;
  background: var(--soft);
}

.picker-empty strong {
  color: #222222;
}

.picker-empty p {
  margin: 0;
  color: #6e747b;
  font-size: 12px;
  line-height: 1.55;
}
</style>
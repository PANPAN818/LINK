<template>
  <section v-if="conversation && character" class="screen no-tabs offline-room" :style="chatSurfaceStyle">
    <ChatHeader
      :character="character"
      mode="offline"
      @online="exitOffline"
      @open-menu="openChatSettings"
    />

    <main ref="offlineScrollRef" class="offline-scroll" :style="scrollStyle">
      <section class="story-head">
        <button class="story-avatar-button" type="button" @click="openCharacterProfile">
          <img class="avatar" :src="character.avatar" :alt="characterDisplayName" />
        </button>
        <div>
          <h1>{{ characterDisplayName }}</h1>
          <p>{{ conversation.summary }}</p>
        </div>
      </section>

      <article v-for="message in offlineMessages" :key="message.id" :class="['story-block', message.sender]">
        <time>{{ formatChatTime(message.createdAt) }}</time>
        <p :class="{ narration: message.displayStyle === 'narration' }">{{ message.content }}</p>
      </article>

      <div v-if="!offlineMessages.length" class="empty-offline">
        <BookOpenText :size="38" />
        <span>线下模式会把同一段对话渲染成长文本 RP。</span>
      </div>
    </main>

    <MessageComposer
      :disabled="currentConversationReplying"
      placeholder="输入行动或对白"
      @prepare-focus="captureKeyboardScrollAnchor"
      @focus="startKeyboardScrollGuard"
      @blur="stopKeyboardScrollGuard"
      @open-stickers="showStickers = true"
      @send="send"
    />

    <AppModal v-model="showProfile" title="角色主页" :show-header="false" variant="profile-ins">
      <CharacterProfileSheet v-if="character" :character="character" :posts="store.sortedVoomPosts" @save="saveCharacterProfile" />
    </AppModal>
    <StickerLibraryModal v-model="showStickers" :conversation-id="props.id" :disabled="currentConversationReplying" />
  </section>
  <section v-else class="screen no-tabs empty-state">会话不存在</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BookOpenText } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import CharacterProfileSheet from '@/components/chat/CharacterProfileSheet.vue';
import ChatHeader from '@/components/chat/ChatHeader.vue';
import MessageComposer from '@/components/chat/MessageComposer.vue';
import StickerLibraryModal from '@/components/stickers/StickerLibraryModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { CharacterProfile } from '@/types/domain';
import { getCharacterDisplayName } from '@/utils/character';
import { useKeyboardScrollGuard } from '@/utils/keyboardScrollGuard';
import { formatChatTime } from '@/utils/time';
import { isVoomNarrationMessage, mergeVoomLikeMessages } from '@/utils/voomMessages';

const props = defineProps<{
  id: string;
}>();

const store = useAppStore();
const router = useRouter();
const showProfile = ref(false);
const showStickers = ref(false);
const offlineScrollRef = ref<HTMLElement | null>(null);
let proactiveReplyTimer: number | undefined;
const conversation = computed(() => store.conversationById(props.id));
const character = computed(() => (conversation.value ? store.characterById(conversation.value.charId) : undefined));
const characterDisplayName = computed(() => (character.value ? getCharacterDisplayName(character.value) : ''));
const chatSettings = computed(() => store.settingsForConversation(props.id));
const currentConversationReplying = computed(() => store.isConversationReplying(props.id));
const offlineMessages = computed(() => {
  const messages = store.visibleMessagesForConversation(props.id).filter((message) => message.mode === 'offline');
  const displayMessages = chatSettings.value.appearance.hideVoomNarration
    ? messages.filter((message) => !isVoomNarrationMessage(message))
    : messages;
  return mergeVoomLikeMessages(displayMessages);
});
const chatSurfaceStyle = computed(() => ({
  backgroundColor: chatSettings.value.appearance.backgroundColor,
  backgroundImage: chatSettings.value.appearance.backgroundImage ? `url(${chatSettings.value.appearance.backgroundImage})` : 'none'
}));
const scrollStyle = computed(() => ({
  backgroundColor: 'transparent',
  backgroundImage: 'none'
}));
const { captureKeyboardScrollAnchor, releaseKeyboardScrollGuard, startKeyboardScrollGuard, stopKeyboardScrollGuard } = useKeyboardScrollGuard(offlineScrollRef);

async function syncConversationState(id: string) {
  await store.markConversationRead(id);
  const currentConversation = store.conversationById(id);
  if (currentConversation?.activeMode !== 'offline') {
    await store.updateConversationMode(id, 'offline');
  }
}

onMounted(async () => {
  await store.hydrate();
  await syncConversationState(props.id);
  void store.maybeRequestProactiveReply(props.id);
  proactiveReplyTimer = window.setInterval(() => {
    void store.maybeRequestProactiveReply(props.id);
  }, 60_000);
});

watch(() => props.id, (id) => {
  void (async () => {
    await syncConversationState(id);
    void store.maybeRequestProactiveReply(id);
  })();
});

async function send(content: string) {
  releaseKeyboardScrollGuard();
  await store.sendMessage(props.id, content);
}

async function saveCharacterProfile(nextCharacter: CharacterProfile) {
  await store.saveCharacter(nextCharacter);
}

async function openCharacterProfile() {
  showProfile.value = true;
  if (character.value) await store.markCharacterMindStateRead(character.value.id);
}

function openChatSettings() {
  void router.push({ name: 'offline-chat-settings', params: { id: props.id } });
}

async function exitOffline() {
  await store.updateConversationMode(props.id, 'online');
  await router.push(`/chats/${props.id}`);
}

onBeforeUnmount(() => {
  if (proactiveReplyTimer !== undefined) window.clearInterval(proactiveReplyTimer);
});
</script>

<style scoped>
.offline-room {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
  background-position: center;
  background-size: cover;
}

.offline-room :deep(.chat-header),
.offline-room :deep(.composer) {
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

.offline-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 15px calc(16px + var(--keyboard-inset));
  -webkit-overflow-scrolling: touch;
  overflow-anchor: none;
  scroll-padding-bottom: calc(16px + var(--keyboard-inset));
}

.story-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 0 18px;
  border-bottom: 1px solid #ebe7df;
}

.story-head h1 {
  margin: 0;
  font-size: 20px;
}

.story-avatar-button {
  width: 46px;
  height: 46px;
}

.story-head p {
  margin: 4px 0 0;
  color: #7d766e;
  font-size: 13px;
  line-height: 1.5;
}

.story-block {
  padding: 14px 0;
  border-bottom: 1px solid #eee9df;
}

.story-block time {
  display: block;
  margin-bottom: 6px;
  color: #a09a92;
  font-size: 11px;
}

.story-block p {
  margin: 0;
  color: #252321;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.story-block.user p {
  font-weight: 700;
}

.story-block p.narration {
  color: #6f7a84;
  font-style: italic;
}

.empty-offline {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 40vh;
  color: #9f978e;
  text-align: center;
}

.empty-offline svg {
  width: 32px;
  height: 32px;
}
</style>
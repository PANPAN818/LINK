<template>
  <section v-if="conversation && character" class="screen no-tabs offline-room">
    <header class="offline-topbar">
      <button class="offline-icon-button" type="button" aria-label="返回线上聊天" @click="exitOffline">
        <ArrowLeft :size="21" />
      </button>
      <div class="offline-title-block">
        <span>offline chapter</span>
        <strong>{{ characterDisplayName }}</strong>
      </div>
      <button class="offline-icon-button" type="button" aria-label="线下设置" @click="openOfflineSettings">
        <Settings2 :size="20" />
      </button>
    </header>

    <main ref="offlineScrollRef" class="offline-scroll">
      <section class="chapter-stream" aria-label="线下章节记录">
        <article
          v-for="floor in chapterFloors"
          :key="floor.id"
          :data-floor-id="floor.id"
          :class="['chapter-entry', `chapter-entry--${floor.sender}`, { 'chapter-entry--delete-target': truncateDeleteMode, 'chapter-entry--editing': isEditingFloor(floor) }]"
          @click="handleFloorClick(floor)"
        >
          <div class="chapter-entry-meta">
            <span>{{ floor.floorNumber }}F {{ floorSenderName(floor) }}</span>
            <div class="chapter-entry-tools">
              <time>{{ formatChatTime(floor.createdAt) }}</time>
              <button type="button" aria-label="编辑该楼层" @click.stop="startEditFloor(floor)">
                <PencilLine :size="14" />
              </button>
            </div>
          </div>

          <div v-if="isEditingFloor(floor)" class="floor-edit-panel" @click.stop>
            <textarea v-model="floorEditDraft" rows="5" placeholder="编辑该楼层文字" />
            <div class="floor-edit-actions">
              <button type="button" @click="copyEditingFloor">复制</button>
              <button type="button" :disabled="!floorEditDraft.trim()" @click="confirmFloorEdit(floor)">确认</button>
              <button type="button" @click="cancelFloorEdit">取消</button>
              <button type="button" class="danger" @click="requestDeleteSingleFloor(floor)">删除</button>
            </div>
          </div>

          <template v-else>
            <p>
              <template v-for="(segment, index) in contentSegmentsForFloor(floor)" :key="`${floor.id}-${index}`">
                <span :class="{ 'inner-voice-segment': segment.innerVoice, 'dialogue-segment': segment.dialogue }">{{ segment.text }}</span>
              </template>
            </p>

            <div v-if="replyOptionsForFloor(floor).length" class="reply-variant-switcher" @click.stop>
              <button type="button" aria-label="上一条回复" @click="moveReplyOption(floor, -1)">
                <ChevronLeft :size="15" />
              </button>
              <span>{{ replyOptionPositionLabel(floor) }}</span>
              <button type="button" aria-label="下一条回复" @click="moveReplyOption(floor, 1)">
                <ChevronRight :size="15" />
              </button>
            </div>

            <div v-if="plotChoicesForFloor(floor).length" class="plot-choice-panel" :class="{ expanded: plotChoicesExpanded(floor) }" @click.stop>
              <button class="plot-choice-toggle" type="button" @click="togglePlotChoices(floor)">
                <span>剧情走向</span>
                <strong>{{ plotChoicesForFloor(floor).length }} 条</strong>
                <ChevronDown :size="13" />
              </button>
              <div v-if="plotChoicesExpanded(floor)" class="plot-choice-list">
                <button
                  v-for="(choice, index) in plotChoicesForFloor(floor)"
                  :key="`${floor.id}-${index}`"
                  type="button"
                  :class="{ active: selectedPlotChoiceKey === `${floor.id}-${index}` }"
                  @click="applyPlotChoice(floor, choice, index)"
                >
                  {{ choice }}
                </button>
              </div>
            </div>
          </template>

          <span v-if="truncateDeleteMode" class="delete-floor-hint">点击后确认删除本楼以及以下楼层</span>
        </article>

        <section v-if="currentConversationReplying" class="typing-card" aria-live="polite">
          <span class="typing-dots"><i></i><i></i><i></i></span>
          <strong>{{ characterDisplayName }} 正在回复中</strong>
        </section>

        <section v-if="!chapterFloors.length && !currentConversationReplying" class="offline-empty">
          <BookOpenText :size="32" />
          <strong>还没有章节</strong>
          <span>输入一句行动、对白或场景，开始这一幕。</span>
        </section>
      </section>
    </main>

    <footer class="offline-dock">
      <div class="offline-toolbar">
        <button class="tool-button" type="button" :disabled="!canRegenerate || currentConversationReplying" @click="regenerateLatestReply">
          <span>重回</span>
        </button>
        <button class="tool-button tool-button--danger" type="button" :class="{ active: truncateDeleteMode }" :disabled="!chapterFloors.length" @click="toggleTruncateDeleteMode">
          <span>删除</span>
        </button>
        <button class="icon-tool-button" type="button" :disabled="!chapterFloors.length" aria-label="回到顶部" @click="scrollToTop">
          <ChevronUp :size="17" />
        </button>
        <button class="icon-tool-button" type="button" :class="{ active: showJumpPanel }" :disabled="!chapterFloors.length" aria-label="选择楼层跳转" @click="showJumpPanel = !showJumpPanel">
          <ListTree :size="17" />
        </button>
        <button class="icon-tool-button" type="button" :disabled="!chapterFloors.length" aria-label="回到底部" @click="scrollToBottom">
          <ChevronDown :size="17" />
        </button>
      </div>

      <div v-if="showJumpPanel" class="floor-jump-panel">
        <button v-for="floor in chapterFloors" :key="floor.id" type="button" @click="jumpToFloor(floor)">
          <span>{{ floor.floorNumber }}F</span>
          <strong>{{ floorSenderName(floor) }}</strong>
        </button>
      </div>

      <form class="offline-composer" @submit.prevent="send">
        <textarea
          ref="composerRef"
          v-model="draft"
          rows="1"
          :disabled="currentConversationReplying"
          placeholder="输入行动或对白"
          @pointerdown="captureKeyboardScrollAnchor"
          @touchstart.passive="captureKeyboardScrollAnchor"
          @focus="startKeyboardScrollGuard"
          @blur="stopKeyboardScrollGuard"
        />
        <button class="send-button" type="submit" :disabled="currentConversationReplying || !draft.trim()" aria-label="发送">
          <SendHorizontal :size="18" />
        </button>
      </form>
    </footer>

    <div v-if="voomNotice" class="voom-notice-backdrop" role="dialog" aria-modal="true" @click.self="closeVoomNotice">
      <section class="voom-notice-sheet">
        <button class="voom-notice-close" type="button" aria-label="关闭 VOOM 提醒" @click="closeVoomNotice">
          <X :size="18" />
        </button>
        <span>VOOM notice</span>
        <h2>{{ voomNoticeTitle }}</h2>
        <p class="voom-notice-body">{{ voomNoticeBody }}</p>
        <figure v-if="voomNoticePost" class="voom-notice-visual" :class="{ mock: !voomNoticeImage }">
          <img v-if="voomNoticeImage" :src="voomNoticeImage" :alt="voomNoticeImageDescription" />
          <figcaption v-else>{{ voomNoticeImageDescription }}</figcaption>
        </figure>
        <section v-if="voomNoticeComments.length" class="voom-notice-comments" aria-label="VOOM 全部评论">
          <p v-for="comment in voomNoticeComments" :key="comment.id">
            <strong>{{ comment.authorName }}</strong>
            <template v-if="voomNoticeReplyTargetName(comment.parentId)">
              <em>回复</em>
              <strong>{{ voomNoticeReplyTargetName(comment.parentId) }}</strong>
            </template>
            <span>{{ voomCommentDisplayContent(comment) }}</span>
          </p>
        </section>
        <section v-else-if="voomNoticePost" class="voom-notice-comments empty" aria-label="VOOM 全部评论">
          <p><span>还没有评论</span></p>
        </section>
        <button type="button" @click="openVoomPage">去 VOOM 看看</button>
      </section>
    </div>

    <div v-if="pendingDelete" class="delete-confirm-backdrop" role="dialog" aria-modal="true" @click.self="cancelPendingDelete">
      <section class="delete-confirm-sheet">
        <span>删除确认</span>
        <h2>{{ pendingDelete.title }}</h2>
        <p>{{ pendingDelete.message }}</p>
        <div class="delete-confirm-actions">
          <button type="button" @click="cancelPendingDelete">取消</button>
          <button type="button" @click="confirmPendingDelete">确认删除</button>
        </div>
      </section>
    </div>
  </section>
  <section v-else class="screen no-tabs empty-state">会话不存在</section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, BookOpenText, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ListTree, PencilLine, SendHorizontal, Settings2, X } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';
import type { ChatMessage, VoomComment } from '@/types/domain';
import { getCharacterDisplayName } from '@/utils/character';
import { useKeyboardScrollGuard } from '@/utils/keyboardScrollGuard';
import { getConversationFloors } from '@/utils/memory';
import { formatChatTime } from '@/utils/time';
import { formatContentWithChineseTranslation } from '@/utils/translation';
import { isVoomNarrationMessage } from '@/utils/voomMessages';

const props = defineProps<{
  id: string;
}>();

const store = useAppStore();
const router = useRouter();
const draft = ref('');
const truncateDeleteMode = ref(false);
const showJumpPanel = ref(false);
const selectedReplyOptionIds = ref<Record<string, string>>({});
const selectedPlotChoiceKey = ref('');
const expandedPlotChoiceFloorIds = ref<Set<string>>(new Set());
const editingFloorId = ref('');
const floorEditDraft = ref('');
const voomNotice = ref<ChatMessage | null>(null);
const seenVoomNoticeIds = ref<Set<string>>(new Set());
const offlineScrollRef = ref<HTMLElement | null>(null);
const composerRef = ref<HTMLTextAreaElement | null>(null);
const conversation = computed(() => store.conversationById(props.id));
const character = computed(() => (conversation.value ? store.characterById(conversation.value.charId) : undefined));
const conversationUser = computed(() => (conversation.value ? store.userById(conversation.value.userId) : undefined));
const characterDisplayName = computed(() => (character.value ? getCharacterDisplayName(character.value) : ''));
const characterTrueName = computed(() => character.value?.name.trim() || characterDisplayName.value || '角色');
const userTrueName = computed(() => conversationUser.value?.name.trim() || conversationUser.value?.nickname.trim() || '用户');
const currentConversationReplying = computed(() => store.isConversationReplying(props.id));
const offlineAllMessages = computed(() => store.messagesForConversation(props.id).filter((message) => message.mode === 'offline' && !isVoomNarrationMessage(message)));
const offlineMessages = computed(() => store.visibleMessagesForConversation(props.id).filter((message) => message.mode === 'offline' && !isVoomNarrationMessage(message)));
const offlineVoomMessages = computed(() => store.messagesForConversation(props.id).filter((message) => message.mode === 'offline' && isVoomNarrationMessage(message)));
const chapterFloors = computed(() => getConversationFloors(offlineMessages.value).map((messages, index) => createChapterFloor(messages, index)));
const latestOfflineMessage = computed(() => offlineMessages.value.at(-1));
const canRegenerate = computed(() => latestOfflineMessage.value?.sender === 'char');
const voomNoticeStorageKey = computed(() => `link:offline-voom-notices:${props.id}`);
const voomNoticeTitle = computed(() => {
  const post = voomNoticePost.value;
  if (post) return `${post.authorName} 发布了 VOOM`;
  if (!voomNotice.value) return 'VOOM 有新动态';
  return `${characterDisplayName.value || '角色'} 发布了 VOOM`;
});
const voomNoticePost = computed(() => voomNotice.value?.voomPostId ? store.voomPosts.find((post) => post.id === voomNotice.value?.voomPostId) : null);
const voomNoticeBody = computed(() => {
  const post = voomNoticePost.value;
  if (post) return formatContentWithChineseTranslation(post.content, post.contentTranslation);
  const content = voomNotice.value?.content ?? '';
  return content.replace(/^【VOOM(?: 评论)?】/, '').replace(/^.+?发布了动态：/, '').trim() || content;
});
const voomNoticeImage = computed(() => voomNoticePost.value?.image?.trim() || '');
const voomNoticeImageDescription = computed(() => voomNoticePost.value?.imageDescription?.trim() || '配图描述暂未保存。');
const voomNoticeComments = computed(() => voomNoticePost.value?.comments ?? []);
const { captureKeyboardScrollAnchor, releaseKeyboardScrollGuard, startKeyboardScrollGuard, stopKeyboardScrollGuard } = useKeyboardScrollGuard(offlineScrollRef);

interface ChapterFloor {
  id: string;
  floorNumber: number;
  messages: ChatMessage[];
  sender: ChatMessage['sender'];
  createdAt: number;
  content: string;
  replyBatchId: string;
  replyVariantGroupId: string;
}

interface ReplyOption {
  id: string;
  batchId: string;
  messageId: string;
  messageIds: string[];
  label: string;
  content: string;
  plotChoices: string[];
  active: boolean;
}

interface ContentSegment {
  text: string;
  innerVoice: boolean;
  dialogue: boolean;
}

interface PendingDelete {
  type: 'single' | 'following';
  floorId: string;
  floorNumber: number;
  title: string;
  message: string;
}

const pendingDelete = ref<PendingDelete | null>(null);

function createChapterFloor(messages: ChatMessage[], index: number): ChapterFloor {
  const primary = messages[0];
  return {
    id: messages.map((message) => message.id).join('__'),
    floorNumber: index + 1,
    messages,
    sender: primary?.sender ?? 'system',
    createdAt: primary?.createdAt ?? Date.now(),
    content: floorContent(messages),
    replyBatchId: primary?.replyBatchId ?? '',
    replyVariantGroupId: primary?.replyVariantGroupId ?? ''
  };
}

function floorContent(messages: ChatMessage[]) {
  return messages.map((message) => message.content.trim()).filter(Boolean).join('\n\n');
}

function replyOptionKey(floor: ChapterFloor) {
  if (floor.replyVariantGroupId) return `variant:${floor.replyVariantGroupId}`;
  if (floor.replyBatchId) return `batch:${floor.replyBatchId}`;
  return '';
}

function replyOptionsForFloor(floor: ChapterFloor): ReplyOption[] {
  if (floor.sender !== 'char') return [];
  if (floor.replyVariantGroupId) {
    const grouped = new Map<string, ChatMessage[]>();
    offlineAllMessages.value
      .filter((message) => message.replyVariantGroupId === floor.replyVariantGroupId && Boolean(message.replyBatchId))
      .forEach((message) => {
        const batchId = message.replyBatchId ?? '';
        grouped.set(batchId, [...(grouped.get(batchId) ?? []), message]);
      });
    return [...grouped.entries()]
      .map(([batchId, messages], index) => ({
        id: batchId,
        batchId,
        messageId: messages[0]?.id ?? batchId,
        messageIds: messages.map((message) => message.id),
        label: `回复 ${index + 1}`,
        content: floorContent(messages),
        plotChoices: uniquePlotChoices(messages),
        active: messages.some((message) => message.replyVariantState !== 'inactive')
      }))
      .sort((first, second) => {
        const firstMessage = grouped.get(first.batchId)?.[0];
        const secondMessage = grouped.get(second.batchId)?.[0];
        return (firstMessage?.replyVariantIndex ?? 0) - (secondMessage?.replyVariantIndex ?? 0)
          || (firstMessage?.createdAt ?? 0) - (secondMessage?.createdAt ?? 0);
      });
  }
  if (!floor.replyBatchId) return [];
  const batchMessages = offlineAllMessages.value.filter((message) => message.replyBatchId === floor.replyBatchId && message.sender === 'char');
  if (batchMessages.length <= 1) return [];
  return batchMessages.map((message, index) => ({
    id: message.id,
    batchId: floor.replyBatchId,
    messageId: message.id,
    messageIds: [message.id],
    label: `回复 ${index + 1}`,
    content: message.content,
    plotChoices: uniquePlotChoices([message]),
    active: floor.messages.some((floorMessage) => floorMessage.id === message.id)
  }));
}

function uniquePlotChoices(messages: ChatMessage[]) {
  return [...new Set(messages.flatMap((message) => message.plotChoices ?? []).map((choice) => choice.trim()).filter(Boolean))].slice(0, 6);
}

function plotChoicesForFloor(floor: ChapterFloor) {
  return selectedReplyOption(floor)?.plotChoices ?? uniquePlotChoices(floor.messages);
}

function plotChoicesExpanded(floor: ChapterFloor) {
  return expandedPlotChoiceFloorIds.value.has(floor.id);
}

function togglePlotChoices(floor: ChapterFloor) {
  const nextIds = new Set(expandedPlotChoiceFloorIds.value);
  if (nextIds.has(floor.id)) {
    nextIds.delete(floor.id);
  } else {
    nextIds.add(floor.id);
  }
  expandedPlotChoiceFloorIds.value = nextIds;
}

function selectedReplyOption(floor: ChapterFloor) {
  const options = replyOptionsForFloor(floor);
  if (!options.length) return null;
  const key = replyOptionKey(floor);
  return options.find((option) => option.id === selectedReplyOptionIds.value[key]) ?? options.find((option) => option.active) ?? options[0];
}

function selectReplyOption(floor: ChapterFloor, optionId: string) {
  const key = replyOptionKey(floor);
  if (!key) return;
  selectedReplyOptionIds.value = { ...selectedReplyOptionIds.value, [key]: optionId };
}

function selectedReplyOptionIndex(floor: ChapterFloor) {
  const options = replyOptionsForFloor(floor);
  const selected = selectedReplyOption(floor);
  if (!options.length || !selected) return 0;
  return Math.max(0, options.findIndex((option) => option.id === selected.id));
}

function replyOptionPositionLabel(floor: ChapterFloor) {
  const options = replyOptionsForFloor(floor);
  if (!options.length) return '';
  return `${selectedReplyOptionIndex(floor) + 1} / ${options.length}`;
}

async function moveReplyOption(floor: ChapterFloor, direction: -1 | 1) {
  const options = replyOptionsForFloor(floor);
  if (options.length <= 1) return;
  const nextIndex = (selectedReplyOptionIndex(floor) + direction + options.length) % options.length;
  selectReplyOption(floor, options[nextIndex].id);
  await applySelectedReplyOption(floor);
}

function hasPendingReplyOption(floor: ChapterFloor) {
  const option = selectedReplyOption(floor);
  return Boolean(option && !option.active);
}

function displayContentForFloor(floor: ChapterFloor) {
  return selectedReplyOption(floor)?.content || floor.content;
}

function floorSenderName(floor: ChapterFloor) {
  if (floor.sender === 'user') return userTrueName.value;
  if (floor.sender === 'char') return characterTrueName.value;
  return '事件';
}

function parseStyledContentSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const pattern = /(\*([^*]+)\*|“[^”]+”)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content))) {
    if (match.index > cursor) {
      segments.push({ text: content.slice(cursor, match.index), innerVoice: false, dialogue: false });
    }
    const isInnerVoice = match[0].startsWith('*');
    segments.push({
      text: isInnerVoice ? match[2] : match[0],
      innerVoice: isInnerVoice,
      dialogue: !isInnerVoice
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), innerVoice: false, dialogue: false });
  }

  return segments.length ? segments : [{ text: content, innerVoice: false, dialogue: false }];
}

function contentSegmentsForFloor(floor: ChapterFloor) {
  return parseStyledContentSegments(displayContentForFloor(floor));
}

function isEditingFloor(floor: ChapterFloor) {
  return editingFloorId.value === floor.id;
}

function editableMessageIdsForFloor(floor: ChapterFloor) {
  const selectedOption = selectedReplyOption(floor);
  if (selectedOption?.messageIds.length) return selectedOption.messageIds;
  return floor.messages.map((message) => message.id);
}

function startEditFloor(floor: ChapterFloor) {
  editingFloorId.value = floor.id;
  floorEditDraft.value = displayContentForFloor(floor);
  truncateDeleteMode.value = false;
  showJumpPanel.value = false;
}

function cancelFloorEdit() {
  editingFloorId.value = '';
  floorEditDraft.value = '';
}

async function copyEditingFloor() {
  const content = floorEditDraft.value.trim();
  if (!content) return;
  try {
    await navigator.clipboard.writeText(content);
    store.showConfigAlert('已复制该楼层文字。', '已复制');
  } catch {
    store.showConfigAlert('当前浏览器不允许写入剪贴板。', '复制失败');
  }
}

async function confirmFloorEdit(floor: ChapterFloor) {
  const content = floorEditDraft.value.trim();
  if (!content) return;
  const selectedOption = selectedReplyOption(floor);
  if (selectedOption && !selectedOption.active && floor.replyVariantGroupId) {
    await store.applyReplyVariant(props.id, floor.replyVariantGroupId, selectedOption.batchId);
  }
  const [primaryMessageId, ...extraMessageIds] = editableMessageIdsForFloor(floor);
  if (!primaryMessageId) return;
  await store.updateMessageContent(primaryMessageId, content);
  if (extraMessageIds.length) await store.deleteMessages(extraMessageIds);
  cancelFloorEdit();
}

function applyPlotChoice(floor: ChapterFloor, choice: string, index: number) {
  draft.value = choice;
  selectedPlotChoiceKey.value = `${floor.id}-${index}`;
  void nextTick(() => composerRef.value?.focus());
}

async function syncConversationState(id: string) {
  await store.markConversationRead(id);
  const currentConversation = store.conversationById(id);
  if (currentConversation?.activeMode !== 'offline') {
    await store.updateConversationMode(id, 'offline');
  }
}

function loadSeenVoomNoticeIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(voomNoticeStorageKey.value) || '[]');
    seenVoomNoticeIds.value = new Set(Array.isArray(parsed) ? parsed.map((id) => String(id)) : []);
  } catch {
    seenVoomNoticeIds.value = new Set();
  }
}

function persistSeenVoomNoticeIds() {
  localStorage.setItem(voomNoticeStorageKey.value, JSON.stringify([...seenVoomNoticeIds.value]));
}

function showLatestVoomNotice() {
  if (voomNotice.value) return;
  const notice = [...offlineVoomMessages.value].reverse().find((message) => !seenVoomNoticeIds.value.has(message.id));
  if (notice) voomNotice.value = notice;
}

function closeVoomNotice() {
  offlineVoomMessages.value.forEach((message) => seenVoomNoticeIds.value.add(message.id));
  persistSeenVoomNoticeIds();
  voomNotice.value = null;
}

function openVoomPage() {
  closeVoomNotice();
  void router.push('/voom');
}

function voomNoticeReplyTargetName(parentId?: string) {
  if (!parentId) return '';
  return voomNoticeComments.value.find((comment) => comment.id === parentId)?.authorName ?? '';
}

function voomCommentDisplayContent(comment: VoomComment) {
  return formatContentWithChineseTranslation(comment.content, comment.contentTranslation);
}

function messageIdsForFloor(floor: ChapterFloor) {
  const ids = new Set(floor.messages.map((message) => message.id));
  floor.messages.forEach((message) => {
    if (!message.replyVariantGroupId) return;
    offlineAllMessages.value
      .filter((candidate) => candidate.replyVariantGroupId === message.replyVariantGroupId)
      .forEach((candidate) => ids.add(candidate.id));
  });
  return [...ids];
}

function requestDeleteSingleFloor(floor: ChapterFloor) {
  pendingDelete.value = {
    type: 'single',
    floorId: floor.id,
    floorNumber: floor.floorNumber,
    title: `删除 ${floor.floorNumber}F？`,
    message: `将删除这一楼 ${floorSenderName(floor)} 的内容，删除后不可恢复。`
  };
}

function requestDeleteFloorAndFollowing(floor: ChapterFloor) {
  pendingDelete.value = {
    type: 'following',
    floorId: floor.id,
    floorNumber: floor.floorNumber,
    title: `删除 ${floor.floorNumber}F 及以下？`,
    message: `将从 ${floor.floorNumber}F 开始删除本楼以及以下楼层，删除后不可恢复。`
  };
}

function cancelPendingDelete() {
  pendingDelete.value = null;
}

async function performSingleFloorDelete(floor: ChapterFloor) {
  await store.deleteMessages(messageIdsForFloor(floor));
}

async function performFloorAndFollowingDelete(floor: ChapterFloor) {
  const startIndex = chapterFloors.value.findIndex((entry) => entry.id === floor.id);
  if (startIndex < 0) return;
  const ids = chapterFloors.value.slice(startIndex).flatMap((entry) => messageIdsForFloor(entry));
  await store.deleteMessages([...new Set(ids)]);
  truncateDeleteMode.value = false;
}

async function confirmPendingDelete() {
  const target = pendingDelete.value;
  if (!target) return;
  const floor = chapterFloors.value.find((entry) => entry.id === target.floorId);
  pendingDelete.value = null;
  if (editingFloorId.value === target.floorId) cancelFloorEdit();
  if (!floor) return;
  if (target.type === 'single') {
    await performSingleFloorDelete(floor);
    return;
  }
  await performFloorAndFollowingDelete(floor);
}

function handleFloorClick(floor: ChapterFloor) {
  if (!truncateDeleteMode.value) return;
  requestDeleteFloorAndFollowing(floor);
}

function toggleTruncateDeleteMode() {
  truncateDeleteMode.value = !truncateDeleteMode.value;
  showJumpPanel.value = false;
  cancelFloorEdit();
}

function scrollToTop() {
  offlineScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
  const scrollElement = offlineScrollRef.value;
  if (!scrollElement) return;
  scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
}

function jumpToFloor(floor: ChapterFloor) {
  const target = offlineScrollRef.value?.querySelector<HTMLElement>(`[data-floor-id="${floor.id}"]`);
  target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  showJumpPanel.value = false;
}

async function applySelectedReplyOption(floor: ChapterFloor) {
  const option = selectedReplyOption(floor);
  if (!option || option.active) return;
  if (floor.replyVariantGroupId) {
    await store.applyReplyVariant(props.id, floor.replyVariantGroupId, option.batchId);
    return;
  }
  const siblingIds = offlineAllMessages.value
    .filter((message) => message.replyBatchId === option.batchId && message.sender === 'char' && message.id !== option.messageId)
    .map((message) => message.id);
  if (siblingIds.length) await store.deleteMessages(siblingIds);
}

onMounted(async () => {
  await store.hydrate();
  await syncConversationState(props.id);
  loadSeenVoomNoticeIds();
  showLatestVoomNotice();
});

watch(() => props.id, (id) => {
  draft.value = '';
  selectedPlotChoiceKey.value = '';
  expandedPlotChoiceFloorIds.value = new Set();
  truncateDeleteMode.value = false;
  showJumpPanel.value = false;
  selectedReplyOptionIds.value = {};
  cancelFloorEdit();
  voomNotice.value = null;
  pendingDelete.value = null;
  loadSeenVoomNoticeIds();
  void syncConversationState(id);
});

watch(offlineVoomMessages, () => showLatestVoomNotice());

watch(chapterFloors, () => {
  void nextTick(() => {
    if (currentConversationReplying.value) scrollToBottom();
  });
});

async function send() {
  const content = draft.value.trim();
  if (!content) return;
  releaseKeyboardScrollGuard();
  draft.value = '';
  await store.sendMessage(props.id, content);
}

async function regenerateLatestReply() {
  if (!canRegenerate.value) return;
  await store.regenerateLatestReply(props.id);
}

function openOfflineSettings() {
  void router.push({ name: 'offline-chat-settings', params: { id: props.id } });
}

async function exitOffline() {
  await store.updateConversationMode(props.id, 'online');
  await router.replace(`/chats/${props.id}`);
}
</script>

<style scoped>
.offline-room {
  --offline-ink: #252226;
  --offline-muted: #8f858c;
  --offline-line: rgba(46, 37, 43, 0.09);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
  color: var(--offline-ink);
  background:
    linear-gradient(135deg, rgba(255, 229, 237, 0.74) 0%, rgba(247, 242, 255, 0.58) 38%, rgba(237, 250, 244, 0.74) 100%),
    #fbf8fa;
}

.offline-topbar {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 38px;
  align-items: center;
  gap: 8px;
  padding: calc(10px + var(--safe-top)) calc(14px + var(--safe-right)) 10px calc(14px + var(--safe-left));
  border-bottom: 1px solid rgba(255, 255, 255, 0.56);
  background: rgba(255, 255, 255, 0.62);
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
}

.offline-icon-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  color: #2d282d;
  box-shadow: 0 10px 24px rgba(77, 58, 71, 0.08);
}

.offline-icon-button:active {
  transform: translateY(1px);
}

.offline-title-block {
  display: grid;
  justify-items: center;
  min-width: 0;
  gap: 2px;
}

.offline-title-block span {
  color: #b28b99;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.offline-title-block strong {
  max-width: 100%;
  overflow: hidden;
  color: #211d21;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px calc(14px + var(--safe-right)) 18px calc(14px + var(--safe-left));
  -webkit-overflow-scrolling: touch;
  overflow-anchor: none;
  scroll-padding-bottom: calc(112px + var(--keyboard-inset));
}

.chapter-stream {
  display: grid;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
}

.chapter-entry {
  display: grid;
  gap: 9px;
  padding: 15px;
  border: 1px solid var(--offline-line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 14px 34px rgba(96, 74, 88, 0.08);
}

.chapter-entry--delete-target {
  cursor: pointer;
  outline: 1px dashed rgba(166, 77, 91, 0.44);
  outline-offset: -5px;
}

.chapter-entry--user {
  background: rgba(255, 250, 252, 0.82);
}

.chapter-entry--char {
  background: rgba(255, 255, 255, 0.78);
}

.chapter-entry--editing {
  border-color: rgba(38, 33, 38, 0.18);
  background: rgba(255, 255, 255, 0.86);
}

.chapter-entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #a59aa1;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;
  text-transform: none;
}

.chapter-entry-meta > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-entry-tools {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.chapter-entry-tools button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #6d6269;
}

.floor-edit-panel {
  display: grid;
  gap: 7px;
}

.floor-edit-panel textarea {
  min-height: 128px;
  resize: vertical;
  padding: 10px 11px;
  border: 1px solid rgba(182, 154, 166, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #282328;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.65;
}

.floor-edit-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.floor-edit-actions button {
  min-height: 30px;
  padding: 0 6px;
  border: 1px solid rgba(182, 154, 166, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #695d65;
  font-size: 11px;
  font-weight: 900;
}

.floor-edit-actions button:nth-child(2) {
  background: #262126;
  color: #ffffff;
}

.floor-edit-actions button.danger {
  background: rgba(166, 77, 91, 0.1);
  color: #a64d5b;
}

.floor-edit-actions button:disabled {
  opacity: 0.42;
}

.reply-variant-switcher {
  display: inline-flex;
  align-items: center;
  justify-self: center;
  gap: 8px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.reply-variant-switcher > button:not(.apply-reply-button) {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 0;
  background: transparent;
  color: #322d32;
}

.reply-variant-switcher > span {
  min-width: 38px;
  color: #5f555d;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
}

.chapter-entry p {
  margin: 0;
  color: #282328;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.inner-voice-segment {
  padding: 0 0.28em;
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(255, 236, 244, 0.12) 18%, rgba(214, 155, 178, 0.28) 100%);
  color: #7e4d5f;
  font-style: italic;
  font-weight: 800;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.dialogue-segment {
  padding: 0.02em 0.38em 0.08em;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 15%, rgba(171, 143, 158, 0.2) 100%);
  color: #241f24;
  font-weight: 850;
  box-shadow: inset 0 -1px 0 rgba(38, 33, 38, 0.12);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.plot-choice-panel {
  display: grid;
  gap: 5px;
  padding: 6px;
  border: 1px solid rgba(182, 154, 166, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.42);
}

.plot-choice-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0 7px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.58);
  color: #9d7382;
  text-align: left;
}

.plot-choice-toggle span,
.plot-choice-toggle strong {
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.plot-choice-toggle svg {
  justify-self: center;
  transition: transform 0.16s ease;
}

.plot-choice-panel.expanded .plot-choice-toggle svg {
  transform: rotate(180deg);
}

.plot-choice-list {
  display: grid;
  gap: 5px;
}

.plot-choice-list button {
  min-height: 28px;
  padding: 6px 7px;
  border: 1px solid rgba(182, 154, 166, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.64);
  color: #4d454c;
  font-size: 10px;
  font-weight: 760;
  line-height: 1.35;
  text-align: left;
}

.plot-choice-list button.active {
  border-color: #262126;
  background: #262126;
  color: #ffffff;
}

.delete-floor-hint {
  justify-self: start;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(166, 77, 91, 0.1);
  color: #a64d5b;
  font-size: 11px;
  font-weight: 900;
}

.chapter-entry--user p {
  font-weight: 800;
}

.offline-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 38vh;
  padding: 28px 18px;
  color: #a09299;
  text-align: center;
}

.offline-empty strong {
  color: #383139;
  font-size: 16px;
}

.offline-empty span {
  font-size: 12px;
  line-height: 1.45;
}

.typing-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 13px 15px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  color: #695d65;
  box-shadow: 0 14px 34px rgba(96, 74, 88, 0.08);
}

.typing-card strong {
  font-size: 12px;
  font-weight: 900;
}

.typing-dots {
  display: inline-flex;
  gap: 4px;
}

.typing-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b28b99;
  animation: typing-bounce 0.9s ease-in-out infinite;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.14s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.28s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.offline-dock {
  position: relative;
  z-index: 12;
  display: grid;
  gap: 8px;
  padding: 10px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(255, 255, 255, 0.62);
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  transform: translate3d(0, calc(0px - var(--keyboard-inset)), 0);
  will-change: transform;
}

.offline-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) 36px 36px 36px;
  gap: 7px;
}

.tool-button,
.icon-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 34px;
  padding: 0 9px;
  border: 1px solid rgba(182, 154, 166, 0.26);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #685b63;
  font-size: 12px;
  font-weight: 900;
}

.tool-button {
  width: 100%;
}

.icon-tool-button {
  width: 36px;
  padding: 0;
}

.tool-button.active,
.icon-tool-button.active {
  border-color: #262126;
  background: #262126;
  color: #ffffff;
}

.tool-button--danger.active {
  border-color: #a64d5b;
  background: #a64d5b;
}

.tool-button:disabled,
.icon-tool-button:disabled {
  opacity: 0.42;
  cursor: default;
}

.floor-jump-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  max-height: 104px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgba(182, 154, 166, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
}

.floor-jump-panel button {
  display: grid;
  gap: 2px;
  min-height: 38px;
  padding: 5px 6px;
  border: 1px solid rgba(182, 154, 166, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #695d65;
}

.floor-jump-panel span {
  font-size: 11px;
  font-weight: 900;
}

.floor-jump-panel strong {
  overflow: hidden;
  font-size: 10px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  align-items: end;
  gap: 8px;
}

.offline-composer textarea {
  min-height: 42px;
  max-height: 118px;
  resize: none;
  padding: 11px 12px;
  border: 1px solid rgba(182, 154, 166, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #262126;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.offline-composer textarea::placeholder {
  color: #aaa0a7;
}

.send-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #222026;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(34, 32, 38, 0.18);
}

.send-button:disabled {
  background: rgba(34, 32, 38, 0.24);
  box-shadow: none;
  cursor: default;
}

.voom-notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: end center;
  padding: 18px calc(14px + var(--safe-right)) calc(18px + var(--safe-bottom)) calc(14px + var(--safe-left));
  background: rgba(37, 34, 38, 0.22);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.delete-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 18px calc(16px + var(--safe-right)) calc(18px + var(--safe-bottom)) calc(16px + var(--safe-left));
  background: rgba(37, 34, 38, 0.28);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.delete-confirm-sheet {
  display: grid;
  gap: 9px;
  width: min(100%, 360px);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 64px rgba(49, 35, 46, 0.22);
}

.delete-confirm-sheet > span {
  color: #b28b99;
  font-size: 10px;
  font-weight: 900;
}

.delete-confirm-sheet h2 {
  margin: 0;
  color: #211d21;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.25;
}

.delete-confirm-sheet p {
  margin: 0;
  color: #5d535b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
}

.delete-confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 3px;
}

.delete-confirm-actions button {
  min-height: 38px;
  border-radius: 8px;
  background: rgba(38, 33, 38, 0.07);
  color: #302a30;
  font-size: 13px;
  font-weight: 900;
}

.delete-confirm-actions button:last-child {
  background: #a64d5b;
  color: #ffffff;
}

.voom-notice-sheet {
  position: relative;
  display: grid;
  gap: 8px;
  width: min(100%, 440px);
  max-height: min(82vh, 640px);
  overflow-y: auto;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 64px rgba(49, 35, 46, 0.2);
}

.voom-notice-close {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  color: #302a30;
}

.voom-notice-sheet > span {
  color: #b28b99;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.voom-notice-sheet h2 {
  margin: 0;
  padding-right: 34px;
  color: #211d21;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.25;
}

.voom-notice-body {
  max-height: 180px;
  margin: 0;
  overflow-y: auto;
  color: #4d454c;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.voom-notice-visual {
  width: min(56vw, 216px);
  max-width: 100%;
  margin: 2px 0 4px;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 8px;
  background: #eff1f3;
}

.voom-notice-visual img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voom-notice-visual.mock {
  display: grid;
  place-items: center;
  padding: 16px;
  border: 1px solid #eef0f2;
  background: #ffffff;
}

.voom-notice-visual figcaption {
  margin: 0;
  color: #222222;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.55;
  text-align: center;
  white-space: pre-wrap;
}

.voom-notice-comments {
  display: grid;
  gap: 7px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(38, 33, 38, 0.04);
}

.voom-notice-comments p {
  margin: 0;
  color: #4d454c;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.voom-notice-comments strong {
  margin-right: 4px;
  color: #211d21;
  font-weight: 900;
}

.voom-notice-comments em {
  margin-right: 4px;
  color: #9b8f97;
  font-style: normal;
  font-weight: 800;
}

.voom-notice-comments.empty p {
  color: #91878f;
  font-weight: 800;
}

.voom-notice-sheet > button:last-child {
  min-height: 38px;
  border-radius: 8px;
  background: #262126;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
}
</style>
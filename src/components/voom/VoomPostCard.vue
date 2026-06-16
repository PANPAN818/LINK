<template>
  <article class="voom-post">
    <header>
      <div class="author-row">
        <img class="avatar" :src="post.authorAvatar" :alt="resolvedAuthorName" />
        <div>
          <strong>{{ resolvedAuthorName }}</strong>
          <time>{{ formatRelativeDate(post.createdAt) }}</time>
        </div>
      </div>
      <button
        class="header-action"
        type="button"
        :aria-label="replyingThread ? '正在生成评论回复' : 'AI 回复评论区'"
        :title="replyingThread ? '正在生成评论回复' : 'AI 回复评论区'"
        :disabled="replyingThread"
        @click="emit('reply-thread', post.id)"
      >
        <LoaderCircle v-if="replyingThread" class="loading-icon" :size="18" />
        <BotMessageSquare v-else :size="18" />
      </button>
    </header>
    <p>{{ postDisplayContent }}</p>
    <figure class="post-visual" :class="{ mock: !post.image }">
      <img v-if="post.image" :src="post.image" :alt="post.imageDescription || post.content" />
      <figcaption v-else>{{ visualDescription }}</figcaption>
    </figure>
    <footer>
      <span v-if="post.likes.length" ref="likeSummaryRef" class="likes-summary">{{ displayedLikeSummary }}</span>
      <span v-else class="likes-summary">还没有点赞</span>
      <span v-if="post.likes.length" ref="likeMeasureRef" class="likes-measure" aria-hidden="true">{{ fullLikeSummary }}</span>
      <div class="post-actions">
        <button class="action-button" :class="{ active: likedByMe }" type="button" aria-label="点赞" @click="emit('toggle-like', post.id)">
          <Heart :size="17" />
        </button>
        <button class="action-button" type="button" aria-label="评论" @click="openCommentComposer()">
          <MessageCircle :size="17" />
        </button>
      </div>
    </footer>
    <div v-if="post.comments.length" class="comments">
      <p v-for="comment in post.comments" :key="comment.id">
        <button class="comment-line" type="button" @click="openCommentComposer(comment.id)">
          <strong>{{ comment.authorName }}</strong>
          <template v-if="replyTargetName(comment.parentId)">
            <em>回复</em>
            <strong>{{ replyTargetName(comment.parentId) }}</strong>
          </template>
          <span>{{ commentDisplayContent(comment) }}</span>
        </button>
      </p>
    </div>
    <form v-if="showComposer" ref="composerRef" class="comment-composer" @submit.prevent="submitComment">
      <input v-model="commentDraft" :placeholder="commentPlaceholder" />
      <button type="submit" :disabled="!commentDraft.trim()">发送</button>
    </form>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BotMessageSquare, Heart, LoaderCircle, MessageCircle } from 'lucide-vue-next';
import type { VoomPost } from '@/types/domain';
import { formatRelativeDate } from '@/utils/time';
import { formatContentWithChineseTranslation } from '@/utils/translation';

const props = defineProps<{
  post: VoomPost;
  authorName?: string;
  currentUserName?: string;
  replyingThread?: boolean;
}>();

const emit = defineEmits<{
  'toggle-like': [postId: string];
  comment: [postId: string, content: string, parentId?: string];
  'reply-thread': [postId: string];
}>();

const showComposer = ref(false);
const commentDraft = ref('');
const replyParentId = ref('');
const composerRef = ref<HTMLElement | null>(null);
const likeSummaryRef = ref<HTMLElement | null>(null);
const likeMeasureRef = ref<HTMLElement | null>(null);
const compactLikeSummary = ref(false);
let likeResizeObserver: ResizeObserver | undefined;
let likeMeasureFrame = 0;

const resolvedAuthorName = computed(() => props.authorName || props.post.authorName);
const likedByMe = computed(() => Boolean(props.currentUserName && props.post.likes.includes(props.currentUserName)));
const replyTarget = computed(() => props.post.comments.find((comment) => comment.id === replyParentId.value));
const commentPlaceholder = computed(() => replyTarget.value ? `回复 ${replyTarget.value.authorName}` : '评论这条 VOOM');
const visualDescription = computed(() => props.post.imageDescription || '配图描述暂未保存。');
const postDisplayContent = computed(() => formatContentWithChineseTranslation(props.post.content, props.post.contentTranslation));
const fullLikeSummary = computed(() => props.post.likes.length ? `${props.post.likes.join('、')} 赞了` : '还没有点赞');
const shortLikeSummary = computed(() => {
  const firstLike = props.post.likes[0];
  if (!firstLike) return '还没有点赞';
  return props.post.likes.length > 1 ? `${firstLike} 等${props.post.likes.length}人赞过` : `${firstLike} 赞过`;
});
const displayedLikeSummary = computed(() => compactLikeSummary.value ? shortLikeSummary.value : fullLikeSummary.value);

function commentDisplayContent(comment: VoomPost['comments'][number]) {
  return formatContentWithChineseTranslation(comment.content, comment.contentTranslation);
}

function openCommentComposer(parentId = '') {
  replyParentId.value = parentId;
  showComposer.value = true;
  window.setTimeout(() => {
    document.addEventListener('pointerdown', handleOutsidePointerDown);
  });
}

function submitComment() {
  const content = commentDraft.value.trim();
  if (!content) return;
  emit('comment', props.post.id, content, replyParentId.value || undefined);
  commentDraft.value = '';
  replyParentId.value = '';
  showComposer.value = false;
  removeOutsideListener();
}

function replyTargetName(parentId?: string) {
  if (!parentId) return '';
  return props.post.comments.find((comment) => comment.id === parentId)?.authorName ?? '';
}

function closeCommentComposer() {
  showComposer.value = false;
  replyParentId.value = '';
  removeOutsideListener();
}

function handleOutsidePointerDown(event: PointerEvent) {
  const target = event.target;
  if (target instanceof Node && composerRef.value?.contains(target)) return;
  closeCommentComposer();
}

function removeOutsideListener() {
  document.removeEventListener('pointerdown', handleOutsidePointerDown);
}

function scheduleLikeSummaryMeasure() {
  if (likeMeasureFrame) window.cancelAnimationFrame(likeMeasureFrame);
  likeMeasureFrame = window.requestAnimationFrame(() => {
    likeMeasureFrame = 0;
    void nextTick(updateLikeSummaryMode);
  });
}

function updateLikeSummaryMode() {
  const summaryEl = likeSummaryRef.value;
  const measureEl = likeMeasureRef.value;
  if (!summaryEl || !measureEl || !props.post.likes.length) {
    compactLikeSummary.value = false;
    return;
  }

  compactLikeSummary.value = measureEl.scrollWidth > summaryEl.clientWidth;
}

watch(fullLikeSummary, scheduleLikeSummaryMeasure, { immediate: true });

onMounted(() => {
  if (likeSummaryRef.value) {
    likeResizeObserver = new ResizeObserver(scheduleLikeSummaryMeasure);
    likeResizeObserver.observe(likeSummaryRef.value);
  }
  scheduleLikeSummaryMeasure();
});

onBeforeUnmount(() => {
  removeOutsideListener();
  if (likeMeasureFrame) window.cancelAnimationFrame(likeMeasureFrame);
  likeResizeObserver?.disconnect();
});
</script>

<style scoped>
.voom-post {
  padding: 14px 16px;
  border-bottom: 1px solid var(--hairline);
  background: #ffffff;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.author-row div {
  display: grid;
  gap: 2px;
}

.author-row strong {
  font-size: 15px;
}

.header-action,
.action-button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  color: #4b4f55;
}

.header-action:active,
.action-button:active {
  background: transparent;
  color: var(--link-green);
}

.header-action:disabled {
  color: var(--link-green);
  cursor: progress;
}

.loading-icon {
  animation: voom-spin 0.8s linear infinite;
}

@keyframes voom-spin {
  to {
    transform: rotate(360deg);
  }
}

.action-button.active {
  background: transparent;
  color: var(--link-green);
}

time {
  color: var(--muted);
  font-size: 11px;
}

.voom-post > p {
  margin: 10px 0;
  color: #171717;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.post-visual {
  position: relative;
  width: min(56vw, 216px);
  max-width: 100%;
  margin: 10px 0 12px;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 18px;
  background: #eff1f3;
}

.post-visual img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-visual.mock {
  display: grid;
  place-items: center;
  padding: 18px;
  border: 1px solid #eef0f2;
  background: #ffffff;
}

.post-visual figcaption {
  max-width: 100%;
  margin: 0;
  padding: 0;
  color: #222222;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
  text-align: center;
}

footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 12px;
}

.likes-summary {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.likes-measure {
  position: absolute;
  left: 0;
  bottom: 0;
  max-width: none;
  overflow: hidden;
  visibility: hidden;
  white-space: nowrap;
  pointer-events: none;
}

.post-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.post-actions svg,
.header-action svg {
  width: 16px;
  height: 16px;
}

.comments {
  display: grid;
  gap: 3px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: var(--soft);
}

.comments p {
  margin: 0;
  color: #4b4f55;
  font-size: 12px;
  line-height: 1.45;
}

.comment-line {
  display: inline;
  padding: 0;
  color: inherit;
  text-align: left;
}

.comment-line strong {
  margin-right: 4px;
  color: #30343a;
}

.comment-line em {
  margin-right: 4px;
  color: #7b8087;
  font-style: normal;
}

.comment-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.comment-composer input {
  height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  background: var(--soft);
  color: #222222;
}

.comment-composer button {
  flex: 0 0 auto;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--link-green);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.comment-composer button:disabled {
  background: #d6d8db;
}
</style>
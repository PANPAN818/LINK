<template>
  <article :class="['message-row', message.sender, { selecting: selectionMode, selected }]">
    <button v-if="selectionMode" class="selection-dot" type="button" :aria-pressed="selected" @click.stop="emit('toggle-select')">
      <span></span>
    </button>
    <button v-if="message.sender === 'char'" class="avatar-button" type="button" @click.stop="selectionMode ? emit('toggle-select') : emit('open-profile')">
      <img class="avatar mini" :src="character.avatar" :alt="characterDisplayName" />
    </button>
    <div class="bubble-wrap">
      <div
        class="bubble-stack"
        @click="handleBubbleClick"
        @contextmenu.prevent="emitLongPress"
        @pointercancel="cancelLongPress"
        @pointerdown="startLongPress"
        @pointerleave="cancelLongPress"
        @pointermove="trackPointerMove"
        @pointerup="cancelLongPress"
      >
        <div class="bubble" :class="{ narration: message.displayStyle === 'narration', sticker: message.sticker }" :style="bubbleStyle">
          <template v-if="message.sticker">
            <img class="sticker-image" :src="message.sticker.imageUrl" :alt="message.sticker.description" />
          </template>
          <template v-else>
            <span>{{ displayContent }}</span>
            <template v-if="showInlineTranslation">
              <span class="translation-divider" aria-hidden="true"></span>
              <span class="translation-copy">{{ displayTranslation }}</span>
            </template>
          </template>
        </div>
        <div v-if="message.quote" class="quote-card">
          <p>
            <strong>{{ quoteAuthorLabel }}</strong>
            <span>{{ quoteText }}</span>
          </p>
          <img v-if="message.quote.sticker" class="quote-thumbnail" :src="message.quote.sticker.imageUrl" :alt="message.quote.sticker.description" />
        </div>
      </div>
        <div v-if="showMessageMeta" class="message-meta">
          <span v-if="showReadState" class="read-state">{{ statusLabel }}</span>
          <time v-if="showMessageTime">{{ formatChatTime(message.createdAt) }}</time>
        </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CharacterProfile, ChatAppearanceSettings, ChatMessage } from '@/types/domain';
import { getCharacterDisplayName } from '@/utils/character';
import { formatChatTime } from '@/utils/time';
import { defaultConversationSettings } from '@/utils/memory';
import { normalizeTranslationText, shouldShowChineseTranslation } from '@/utils/translation';

const props = withDefaults(defineProps<{
  message: ChatMessage;
  character: CharacterProfile;
  appearance?: ChatAppearanceSettings;
  selectionMode?: boolean;
  selected?: boolean;
}>(), {
  appearance: () => defaultConversationSettings.appearance,
  selectionMode: false,
  selected: false
});

const emit = defineEmits<{
  'open-profile': [];
  'long-press': [message: ChatMessage];
  'toggle-select': [];
}>();

let longPressTimer: number | undefined;
let longPressStart: { x: number; y: number } | null = null;
let longPressTriggered = false;

function extractJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return trimmed;
}

function normalizeTextFragments(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => normalizeTextFragments(item));
  if (typeof value === 'string' || typeof value === 'number') {
    const content = String(value).trim();
    return content ? [content] : [];
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidates = [record.content, record.text, record.message, record.reply];
    for (const candidate of candidates) {
      const fragments = normalizeTextFragments(candidate);
      if (fragments.length) return fragments;
    }
  }
  return [];
}

const displayContent = computed(() => {
  if (props.message.sender !== 'char') return props.message.content;
  try {
    const parsed = JSON.parse(extractJsonContent(props.message.content)) as Record<string, unknown>;
    const fragments = normalizeTextFragments(parsed.replies ?? parsed.reply ?? parsed.content ?? parsed.message ?? parsed.text);
    return fragments.length ? fragments.join('\n') : props.message.content;
  } catch {
    return props.message.content;
  }
});

function normalizeTranslationFragments(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => normalizeTranslationFragments(item));
  if (typeof value === 'string' || typeof value === 'number') {
    const content = normalizeTranslationText(value);
    return content ? [content] : [];
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidates = [record.contentTranslation, record.translation, record.translationZh, record.chineseTranslation, record.chinese, record.zh, record.cn, record.translatedContent];
    for (const candidate of candidates) {
      const fragments = normalizeTranslationFragments(candidate);
      if (fragments.length) return fragments;
    }
  }
  return [];
}

const parsedTranslation = computed(() => {
  if (props.message.sender !== 'char') return '';
  try {
    const parsed = JSON.parse(extractJsonContent(props.message.content)) as Record<string, unknown>;
    const topLevelTranslations = normalizeTranslationFragments(
      parsed.replyTranslations
      ?? parsed.translations
      ?? parsed.translationTexts
      ?? parsed.chineseTranslations
      ?? parsed.translation
      ?? parsed.contentTranslation
    );
    if (topLevelTranslations.length) return topLevelTranslations.join('\n');
    return normalizeTranslationFragments(parsed.replies ?? parsed.reply ?? parsed.content ?? parsed.message ?? parsed.text).join('\n');
  } catch {
    return '';
  }
});

const displayTranslation = computed(() => normalizeTranslationText(props.message.translation) || parsedTranslation.value);
const showInlineTranslation = computed(() => props.message.sender === 'char'
  && props.message.mode === 'online'
  && !props.message.sticker
  && shouldShowChineseTranslation(displayContent.value, displayTranslation.value));

const characterDisplayName = computed(() => getCharacterDisplayName(props.character));
const quoteText = computed(() => props.message.quote?.sticker
  ? props.message.quote.sticker.description
  : props.message.quote?.content ?? '');
const quoteAuthorLabel = computed(() => (props.message.quote?.authorName ? `${props.message.quote.authorName}：` : ''));

const bubbleStyle = computed(() => {
  if (props.message.sticker) return {};
  if (props.message.sender === 'user') {
    return {
      background: props.appearance.userBubbleColor,
      color: props.appearance.userTextColor
    };
  }
  if (props.message.sender === 'char') {
    return {
      background: props.appearance.characterBubbleColor,
      color: props.appearance.characterTextColor
    };
  }
  return {};
});

const isSystemNarration = computed(() => props.message.sender === 'system' && props.message.displayStyle === 'narration');
const showMessageTime = computed(() => props.appearance.showMessageTime && !isSystemNarration.value && !props.message.voomEventType && !props.message.voomPostId);
const showReadState = computed(() => props.appearance.showReadStatus && props.message.sender !== 'system' && !props.message.voomEventType && !props.message.voomPostId);
const showMessageMeta = computed(() => showMessageTime.value || showReadState.value);

const statusLabel = computed(() => ({
  sending: '发送中',
  sent: '已读',
  failed: '未送达'
}[props.message.status ?? 'sent']));

function clearLongPressTimer() {
  if (longPressTimer === undefined) return;
  window.clearTimeout(longPressTimer);
  longPressTimer = undefined;
}

function startLongPress(event: PointerEvent) {
  if (props.selectionMode || event.button !== 0) return;
  longPressStart = { x: event.clientX, y: event.clientY };
  longPressTriggered = false;
  clearLongPressTimer();
  longPressTimer = window.setTimeout(() => {
    longPressTriggered = true;
    emit('long-press', props.message);
  }, 520);
}

function trackPointerMove(event: PointerEvent) {
  if (!longPressStart) return;
  const moved = Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y);
  if (moved > 10) cancelLongPress();
}

function cancelLongPress() {
  clearLongPressTimer();
  longPressStart = null;
}

function emitLongPress() {
  if (props.selectionMode) return;
  clearLongPressTimer();
  emit('long-press', props.message);
}

function handleBubbleClick(event: MouseEvent) {
  if (longPressTriggered) {
    longPressTriggered = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (props.selectionMode) emit('toggle-select');
}
</script>

<style scoped>
.message-row {
  position: relative;
  display: flex;
  gap: 6px;
  margin: 7px 0;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.system {
  justify-content: center;
}

.message-row.selecting {
  padding-left: 30px;
}

.message-row.user.selecting {
  padding-right: 30px;
  padding-left: 0;
}

.selection-dot {
  position: absolute;
  left: 2px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(20, 20, 20, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
}

.message-row.user .selection-dot {
  right: 2px;
  left: auto;
}

.selection-dot span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
}

.message-row.selected .selection-dot span {
  background: var(--link-green);
}

.avatar-button {
  width: 32px;
  height: 32px;
}

.mini {
  width: 32px;
  height: 32px;
}

.bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  max-width: min(80%, 300px);
}

.message-row.user .bubble-wrap {
  flex-direction: row-reverse;
}

.bubble-stack {
  display: grid;
  gap: 6px;
  justify-items: start;
  max-width: 100%;
  min-width: 0;
  cursor: default;
  touch-action: pan-y;
  user-select: text;
}

.message-row.user .bubble-stack {
  justify-items: end;
}

.message-row.selected .bubble-stack {
  border-radius: 16px;
  outline: 2px solid rgba(6, 199, 85, 0.38);
  outline-offset: 2px;
}

.bubble {
  min-width: 32px;
  max-width: 100%;
  padding: 7px 11px;
  border-radius: 15px;
  background: #ffffff;
  color: #111111;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.4;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.message-row.user .bubble {
  background: #5ce46f;
}

.message-row.system .bubble {
  background: rgba(0, 0, 0, 0.08);
  color: #ffffff;
  font-size: 11px;
}

.message-row.system .bubble.narration {
  background: rgba(17, 17, 17, 0.06);
  color: #5f6872;
}

.bubble.narration {
  background: rgba(255, 255, 255, 0.7);
  color: #47515a;
  font-style: italic;
}

.bubble.sticker {
  min-width: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.quote-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  width: fit-content;
  max-width: 100%;
  min-height: 26px;
  padding: 5px 8px;
  border-radius: 8px;
  background: #f7f8f9;
  color: #a9afb6;
  box-shadow: none;
}

.quote-card p {
  min-width: 0;
  margin: 0;
  overflow: visible;
  overflow-wrap: break-word;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: clip;
  white-space: pre-wrap;
}

.quote-card strong {
  color: #9ba2aa;
  font-weight: 760;
}

.quote-card span {
  color: #aeb4bb;
}

.quote-thumbnail {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.7);
}

.translation-divider {
  display: block;
  width: 100%;
  margin: 7px 0 6px;
  border-top: 1px dashed currentColor;
  opacity: 0.3;
}

.translation-copy {
  display: block;
}

.message-row.user .bubble.sticker {
  background: transparent;
}

.sticker-image {
  display: block;
  width: min(96px, 30vw);
  aspect-ratio: 1;
  border-radius: 10px;
  object-fit: cover;
  background: transparent;
}

.message-meta {
  flex: 0 0 auto;
  display: grid;
  align-content: end;
  justify-items: start;
  gap: 2px;
  min-width: 32px;
  color: rgba(20, 20, 20, 0.45);
  font-size: 10px;
  line-height: 1.15;
}

.message-row.user .message-meta {
  justify-items: end;
}

time,
.read-state {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: nowrap;
}
</style>
import type { ChatMemorySettings, ChatMessage, ChatMode, ConversationMemoryRecord, ConversationSettings, SummaryPerspective } from '@/types/domain';
import { createId } from './id';
import { defaultTimeAwarenessSettings, normalizeTimeAwarenessSettings } from './timeAwareness';

export const summaryPerspectiveOptions: Array<{
  value: SummaryPerspective;
  target: '{{user}}' | '{{char}}' | '上帝';
  label: string;
  description: string;
}> = [
  { value: 'user-first', target: '{{user}}', label: '第一人称', description: '用“我”记录用户经历。' },
  { value: 'user-second', target: '{{user}}', label: '第二人称', description: '用“你”称呼用户。' },
  { value: 'user-third', target: '{{user}}', label: '第三人称', description: '用第三人称记录用户。' },
  { value: 'char-first', target: '{{char}}', label: '第一人称', description: '用“我”记录角色经历。' },
  { value: 'char-second', target: '{{char}}', label: '第二人称', description: '用“你”称呼角色。' },
  { value: 'char-third', target: '{{char}}', label: '第三人称', description: '用第三人称记录角色。' },
  { value: 'omniscient-third', target: '上帝', label: '第三人称', description: '旁观双方并保留全局事实。' }
];

export const defaultChatMemorySettings: ChatMemorySettings = {
  enabled: true,
  autoSummarize: true,
  summarizeEvery: 100,
  summaryModel: '',
  summaryPerspective: 'omniscient-third',
  summaryPrompt: '请把下面聊天楼层总结成可供角色扮演继续读取的记忆手册。保留人物关系变化、承诺、偏好、冲突、时间顺序和未解决事项；不要评价用户；用中文输出。',
  mergeSummaryPrompt: '请把下面多段已总结记忆合并成一份更高层级的大总结。保留稳定事实、长期关系变化、重要承诺、偏好、冲突和未解决事项；去除重复内容；用中文输出。',
  vectorMemoryEnabled: true,
  hideSummarizedMessages: true
};

export function normalizeSummaryPerspective(value: unknown): SummaryPerspective {
  const perspective = String(value ?? '').trim();
  return summaryPerspectiveOptions.some((option) => option.value === perspective)
    ? perspective as SummaryPerspective
    : defaultChatMemorySettings.summaryPerspective;
}

export function renderSummaryPerspectiveInstruction(perspective: SummaryPerspective, context: { userName: string; characterName: string }) {
  const userName = context.userName.trim() || '{{user}}';
  const characterName = context.characterName.trim() || '{{char}}';
  const subjectMap: Record<Exclude<SummaryPerspective, 'omniscient-third'>, { targetName: string; token: '{{user}}' | '{{char}}'; counterpartName: string; viewpoint: string }> = {
    'user-first': { targetName: userName, token: '{{user}}', counterpartName: characterName, viewpoint: '第一人称' },
    'user-second': { targetName: userName, token: '{{user}}', counterpartName: characterName, viewpoint: '第二人称' },
    'user-third': { targetName: userName, token: '{{user}}', counterpartName: characterName, viewpoint: '第三人称' },
    'char-first': { targetName: characterName, token: '{{char}}', counterpartName: userName, viewpoint: '第一人称' },
    'char-second': { targetName: characterName, token: '{{char}}', counterpartName: userName, viewpoint: '第二人称' },
    'char-third': { targetName: characterName, token: '{{char}}', counterpartName: userName, viewpoint: '第三人称' }
  };

  if (perspective === 'omniscient-third') {
    return `总结视角：使用上帝第三人称视角，不代入{{user}}或{{char}}任一方；把${userName}和${characterName}都作为叙事对象记录。`;
  }

  const subject = subjectMap[perspective];
  if (subject.viewpoint === '第一人称') {
    return `总结视角：以${subject.token}（${subject.targetName}）的第一人称记录，使用“我”指代${subject.targetName}，用姓名或“对方”指代${subject.counterpartName}。`;
  }
  if (subject.viewpoint === '第二人称') {
    return `总结视角：以面向${subject.token}（${subject.targetName}）的第二人称记录，使用“你”称呼${subject.targetName}，用姓名或“对方”指代${subject.counterpartName}。`;
  }
  return `总结视角：以${subject.token}（${subject.targetName}）为叙事中心的第三人称记录，使用姓名或第三人称称呼${subject.targetName}，不要写成第一人称。`;
}

export const defaultCharacterStickerGroupIds = ['sticker_group_default'];
const legacyDefaultBackgroundColor = '#8fa2af';
const defaultBackgroundColor = '#ffffff';

export const defaultConversationSettings: Omit<ConversationSettings, 'conversationId'> = {
  memory: defaultChatMemorySettings,
  modelOverrides: {
    online: '',
    offline: '',
    voom: ''
  },
  appearance: {
    backgroundImage: '',
    backgroundImages: [],
    backgroundColor: defaultBackgroundColor,
    userBubbleColor: '#5ce46f',
    userTextColor: '#111111',
    characterBubbleColor: '#ffffff',
    characterTextColor: '#111111',
    showMessageTime: true,
    showReadStatus: false
  },
  autoGenerateVoom: true,
  voomFrequency: 'medium',
  stickerVisionEnabled: true,
  characterStickerGroupIds: defaultCharacterStickerGroupIds,
  timeAwareness: defaultTimeAwarenessSettings
};

export function normalizeConversationSettings(settings: Partial<ConversationSettings> | null | undefined, conversationId: string): ConversationSettings {
  const memory = settings?.memory ?? defaultChatMemorySettings;
  const appearance = settings?.appearance ?? defaultConversationSettings.appearance;
  const modelOverrides = settings?.modelOverrides ?? defaultConversationSettings.modelOverrides;
  const rawBackgroundColor = String(appearance.backgroundColor ?? defaultConversationSettings.appearance.backgroundColor).trim();
  const backgroundColor = !rawBackgroundColor || rawBackgroundColor.toLowerCase() === legacyDefaultBackgroundColor
    ? defaultBackgroundColor
    : rawBackgroundColor;
  const activeBackgroundImage = String(appearance.backgroundImage ?? '').trim();
  const backgroundImages = [
    activeBackgroundImage,
    ...(Array.isArray(appearance.backgroundImages) ? appearance.backgroundImages : [])
  ].map((image) => String(image ?? '').trim()).filter(Boolean);
  const voomFrequency = settings?.voomFrequency === 'low' || settings?.voomFrequency === 'high' || settings?.voomFrequency === 'medium'
    ? settings.voomFrequency
    : defaultConversationSettings.voomFrequency;

  return {
    conversationId,
    memory: {
      enabled: true,
      autoSummarize: memory.autoSummarize ?? defaultChatMemorySettings.autoSummarize,
      summarizeEvery: Math.max(10, Math.round(Number(memory.summarizeEvery) || defaultChatMemorySettings.summarizeEvery)),
      summaryModel: String(memory.summaryModel ?? '').trim(),
      summaryPerspective: normalizeSummaryPerspective(memory.summaryPerspective),
      summaryPrompt: String(memory.summaryPrompt ?? defaultChatMemorySettings.summaryPrompt).trim() || defaultChatMemorySettings.summaryPrompt,
      mergeSummaryPrompt: String(memory.mergeSummaryPrompt ?? defaultChatMemorySettings.mergeSummaryPrompt).trim() || defaultChatMemorySettings.mergeSummaryPrompt,
      vectorMemoryEnabled: memory.vectorMemoryEnabled ?? defaultChatMemorySettings.vectorMemoryEnabled,
      hideSummarizedMessages: memory.hideSummarizedMessages ?? defaultChatMemorySettings.hideSummarizedMessages
    },
    modelOverrides: {
      online: String(modelOverrides.online ?? '').trim(),
      offline: String(modelOverrides.offline ?? '').trim(),
      voom: String(modelOverrides.voom ?? '').trim()
    },
    appearance: {
      backgroundImage: activeBackgroundImage,
      backgroundImages: [...new Set(backgroundImages)],
      backgroundColor,
      userBubbleColor: String(appearance.userBubbleColor ?? defaultConversationSettings.appearance.userBubbleColor).trim() || defaultConversationSettings.appearance.userBubbleColor,
      userTextColor: String(appearance.userTextColor ?? defaultConversationSettings.appearance.userTextColor).trim() || defaultConversationSettings.appearance.userTextColor,
      characterBubbleColor: String(appearance.characterBubbleColor ?? defaultConversationSettings.appearance.characterBubbleColor).trim() || defaultConversationSettings.appearance.characterBubbleColor,
      characterTextColor: String(appearance.characterTextColor ?? defaultConversationSettings.appearance.characterTextColor).trim() || defaultConversationSettings.appearance.characterTextColor,
      showMessageTime: appearance.showMessageTime ?? defaultConversationSettings.appearance.showMessageTime,
      showReadStatus: appearance.showReadStatus ?? defaultConversationSettings.appearance.showReadStatus
    },
    autoGenerateVoom: settings?.autoGenerateVoom ?? defaultConversationSettings.autoGenerateVoom,
    voomFrequency,
    stickerVisionEnabled: settings?.stickerVisionEnabled ?? defaultConversationSettings.stickerVisionEnabled,
    characterStickerGroupIds: Array.isArray(settings?.characterStickerGroupIds)
      ? [...new Set(settings.characterStickerGroupIds.map((item) => String(item).trim()).filter(Boolean))]
      : [...defaultConversationSettings.characterStickerGroupIds],
    timeAwareness: normalizeTimeAwarenessSettings(settings?.timeAwareness)
  };
}

export function estimateTokenCount(text: string) {
  const normalized = text.trim();
  if (!normalized) return 0;
  const cjkCount = (normalized.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = normalized.replace(/[\u3400-\u9fff]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(cjkCount * 1.1 + latinWords * 1.35));
}

export function vectorizeText(text: string, dimensions = 16) {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const char of text.toLowerCase()) {
    const code = char.codePointAt(0) ?? 0;
    vector[code % dimensions] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function getMessageFloorMap(messages: ChatMessage[]) {
  return new Map(messages.map((message, index) => [message.id, index + 1]));
}

export function getHiddenMessageIds(messages: ChatMessage[], memories: ConversationMemoryRecord[], settings: ConversationSettings) {
  if (!settings.memory.hideSummarizedMessages) return new Set<string>();
  const hiddenRanges = memories
    .filter((memory) => memory.hiddenStartFloor > 0 && memory.hiddenEndFloor >= memory.hiddenStartFloor)
    .map((memory) => ({ start: memory.hiddenStartFloor, end: memory.hiddenEndFloor }));

  return new Set(messages
    .filter((message, index) => hiddenRanges.some((range) => index + 1 >= range.start && index + 1 <= range.end))
    .map((message) => message.id));
}

export function getVisibleMessages(messages: ChatMessage[], memories: ConversationMemoryRecord[], settings: ConversationSettings) {
  const hiddenIds = getHiddenMessageIds(messages, memories, settings);
  return messages.filter((message) => !hiddenIds.has(message.id));
}

export function getMemoryContext(memories: ConversationMemoryRecord[]) {
  const sorted = [...memories].sort((a, b) => a.startFloor - b.startFloor);
  if (!sorted.length) return '';
  return sorted.map((memory) => {
    const stage = memory.kind === 'short-term' ? '短期记忆' : '长期记忆';
    return `【${stage} ${memory.startFloor}-${memory.endFloor}楼，隐藏${memory.hiddenStartFloor || '-'}-${memory.hiddenEndFloor || '-'}楼】\n${memory.summary}`;
  }).join('\n\n');
}

export function getNextSummaryRange(messages: ChatMessage[], memories: ConversationMemoryRecord[], settings: ConversationSettings, mode: ChatMode) {
  if (!settings.memory.autoSummarize) return null;
  const step = settings.memory.summarizeEvery;
  const completedEndFloor = memories
    .reduce((max, memory) => Math.max(max, memory.endFloor), 0);
  const startFloor = completedEndFloor + 1;
  const endFloor = completedEndFloor + step;
  if (messages.length < endFloor) return null;
  const sourceMessages = messages.slice(startFloor - 1, endFloor);
  const keepTail = Math.min(10, Math.max(1, Math.ceil(step * 0.1)));
  return {
    startFloor,
    endFloor,
    hiddenStartFloor: startFloor,
    hiddenEndFloor: Math.max(startFloor - 1, endFloor - keepTail),
    sourceMessages
  };
}

export function createMemoryRecord(input: {
  conversationId: string;
  mode: ChatMode;
  startFloor: number;
  endFloor: number;
  hiddenStartFloor: number;
  hiddenEndFloor: number;
  summary: string;
  sourceMessages: ChatMessage[];
  model: string;
  vector?: number[];
  now?: number;
}): ConversationMemoryRecord {
  const now = input.now ?? Date.now();
  return {
    id: createId('memory'),
    conversationId: input.conversationId,
    mode: input.mode,
    kind: 'short-term',
    startFloor: input.startFloor,
    endFloor: input.endFloor,
    hiddenStartFloor: input.hiddenStartFloor,
    hiddenEndFloor: input.hiddenEndFloor,
    summary: input.summary,
    tokenCount: estimateTokenCount(input.summary),
    vector: [...(input.vector ?? [])],
    sourceMessageIds: input.sourceMessages.map((message) => message.id),
    model: input.model,
    createdAt: now,
    updatedAt: now
  };
}

export function ageMemoryKind(createdAt: number, now = Date.now()): ConversationMemoryRecord['kind'] {
  return now - createdAt > 24 * 60 * 60 * 1000 ? 'long-term' : 'short-term';
}

export function shouldCompressMemory(memory: ConversationMemoryRecord, now = Date.now()) {
  return !memory.compressedAt && now - memory.createdAt > 7 * 24 * 60 * 60 * 1000;
}

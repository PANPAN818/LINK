<template>
  <section class="control-panel">
      <section v-if="activeTab === 'memory'" class="panel-section memory-panel">
        <section class="memory-hero">
          <div>
            <span>Hippocampus Memory</span>
            <strong>{{ totalMemoryTokens }} tokens</strong>
            <p>{{ hiddenFloorStatus }}</p>
          </div>
          <button class="manual-summary-button" type="button" :disabled="summarizing" @click="showManualSummary = !showManualSummary">
            {{ summarizing ? '总结中' : '手动总结' }}
          </button>
        </section>

        <form v-if="showManualSummary" class="manual-summary-card settings-block" @submit.prevent="manualSummarize">
          <header class="section-header compact-header">
            <div>
              <span>Manual range</span>
              <strong>手动总结范围</strong>
            </div>
          </header>
          <div class="range-grid">
            <label class="field">
              <span>总结开始楼层</span>
              <input v-model.number="manualSummary.startFloor" min="1" type="number" />
            </label>
            <label class="field">
              <span>总结结束楼层</span>
              <input v-model.number="manualSummary.endFloor" :max="messageCount" min="1" type="number" />
            </label>
            <label class="field">
              <span>隐藏开始楼层</span>
              <input v-model.number="manualSummary.hiddenStartFloor" min="0" type="number" />
            </label>
            <label class="field">
              <span>隐藏结束楼层</span>
              <input v-model.number="manualSummary.hiddenEndFloor" :max="messageCount" min="0" type="number" />
            </label>
          </div>
          <p>当前会话共 {{ messageCount }} 楼。隐藏范围填 0 表示不隐藏；隐藏范围必须在总结范围内。</p>
          <div class="manual-summary-actions">
            <button class="summary-submit" type="submit" :disabled="summarizing || !canManualSummarize">生成总结</button>
            <button class="secondary-action" type="button" @click="fillLatestRange">填入未总结楼层</button>
          </div>
        </form>

        <section class="settings-block memory-strategy-block">
          <header class="section-header">
            <div>
              <span>Automation</span>
              <strong>记忆策略</strong>
            </div>
          </header>
          <div class="memory-toggle-grid">
            <label class="switch-card">
              <input v-model="draft.memory.autoSummarize" type="checkbox" @change="saveDraft" />
              <span class="switch-track"></span>
              <div>
                <strong>自动总结</strong>
              </div>
            </label>
            <label class="field compact-field">
              <span>每多少楼总结</span>
              <input v-model.number="draft.memory.summarizeEvery" min="10" step="10" type="number" @change="saveDraft" />
            </label>
          </div>
          <div class="memory-toggle-grid">
            <label class="switch-card">
              <input v-model="draft.memory.hideSummarizedMessages" type="checkbox" @change="saveDraft" />
              <span class="switch-track"></span>
              <div>
                <strong>自动隐藏楼层</strong>
              </div>
            </label>
            <label class="switch-card">
              <input v-model="draft.memory.vectorMemoryEnabled" type="checkbox" @change="saveDraft" />
              <span class="switch-track"></span>
              <div>
                <strong>向量化记忆</strong>
              </div>
            </label>
          </div>
          <label class="field model-select-field">
            <span>自动总结模型</span>
            <div class="model-select-shell">
              <img v-if="selectedModelMeta(draft.memory.summaryModel)" :src="selectedModelMeta(draft.memory.summaryModel)?.avatar" :alt="selectedModelMeta(draft.memory.summaryModel)?.vendorName" />
              <span v-if="selectedModelMeta(draft.memory.summaryModel)" class="model-select-vendor">{{ selectedModelMeta(draft.memory.summaryModel)?.vendorName }}</span>
              <select v-model="draft.memory.summaryModel" :class="{ 'with-provider': selectedModelMeta(draft.memory.summaryModel) }" @change="saveDraft">
                <option value="">跟随当前模式模型</option>
                <optgroup v-for="vendor in groupedModels" :key="vendor.id" :label="vendorSelectLabel(vendor)">
                  <option v-for="model in vendor.models" :key="model.value" :value="model.value">
                    {{ model.label }}
                  </option>
                </optgroup>
              </select>
            </div>
          </label>
        </section>

        <section class="settings-block perspective-block">
          <header class="section-header">
            <div>
              <span>Point of view</span>
              <strong>总结视角</strong>
            </div>
          </header>
          <label class="field perspective-select-field">
            <span>记忆叙述方式</span>
            <div class="perspective-select-shell">
              <strong>{{ selectedSummaryPerspective?.target }}</strong>
              <select v-model="draft.memory.summaryPerspective" @change="saveDraft">
                <option v-for="option in summaryPerspectiveOptions" :key="option.value" :value="option.value">
                  {{ option.target }} / {{ option.label }}
                </option>
              </select>
            </div>
            <small>{{ selectedSummaryPerspective?.description }}</small>
          </label>
        </section>

        <section class="memory-records settings-block">
          <header class="section-header record-header">
            <div>
              <span>Memory space</span>
              <strong>记忆空间</strong>
            </div>
            <em>{{ memories.length }} 条</em>
          </header>
          <div class="merge-actions">
            <button class="secondary-action" type="button" :disabled="summarizing || mergeDisabled" @click="showMergePicker = !showMergePicker">合并大总结</button>
            <button class="secondary-action" type="button" :disabled="summarizing || !hasMergedSummary" @click="showUnmergePicker = !showUnmergePicker">取消合并大总结</button>
          </div>
          <section v-if="showMergePicker" class="merge-picker">
            <label v-for="memory in mergeableMemories" :key="memory.id" class="merge-row switch-card compact-switch">
              <input v-model="selectedMergeIds" :value="memory.id" type="checkbox" />
              <span class="switch-track"></span>
              <span>{{ memory.startFloor }}-{{ memory.endFloor }}楼</span>
            </label>
            <button class="summary-submit" type="button" :disabled="summarizing || selectedMergeIds.length <= 1" @click="mergeMemories">确认合并</button>
          </section>
          <section v-if="showUnmergePicker" class="merge-picker">
            <button v-for="memory in mergedMemories" :key="memory.id" class="merge-row button-row" type="button" @click="unmergeMemories(memory.id)">
              撤回 {{ memory.startFloor }}-{{ memory.endFloor }}楼大总结
            </button>
          </section>
          <article v-for="memory in memories" :key="memory.id" class="memory-card">
            <div class="memory-card-head">
              <div>
                <span>{{ memory.isMergedSummary ? 'Long memory page' : 'Memory page' }}</span>
                <strong>{{ memory.startFloor }}-{{ memory.endFloor }}楼</strong>
              </div>
              <em>{{ memory.isMergedSummary ? '合并大总结' : '片段记忆' }}</em>
            </div>
            <textarea :value="memory.summary" @change="updateMemorySummary(memory, $event)"></textarea>
            <div class="memory-actions">
              <button class="secondary-action" type="button" :disabled="summarizing" @click="confirmResummarize(memory.id)">重新总结</button>
              <button class="danger-action" type="button" @click="confirmDeleteMemory(memory.id)">删除总结</button>
            </div>
          </article>
          <div v-if="!memories.length" class="empty-note memory-empty-note">记忆空间暂时空着。达到楼层或点击手动总结后，新的书页会收进这里。</div>
        </section>
      </section>

      <section v-else-if="activeTab === 'beauty'" class="panel-section beauty-panel">
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>Canvas</span>
              <strong>聊天背景</strong>
            </div>
          </header>
          <div class="background-manager">
            <label class="field background-url-card">
              <span>新增背景图 URL</span>
              <div class="inline-input-action">
                <input v-model="backgroundImageUrlDraft" placeholder="https://..." @keydown.enter.prevent="addBackgroundImageFromUrl" />
                <button class="setting-action-button primary-setting-action" type="button" @click="addBackgroundImageFromUrl">新增</button>
              </div>
            </label>
            <label class="upload-card background-upload-card">
              <strong>导入本地背景</strong>
              <span>可一次选择多张，保存到 IndexedDB。</span>
              <input type="file" accept="image/*" multiple @change="readAppearanceFiles" />
            </label>
            <label class="field background-color-card appearance-color-field">
              <span>背景色</span>
              <input v-model="draft.appearance.backgroundColor" type="color" @change="saveDraft" />
            </label>
            <section class="background-library" aria-label="背景图列表">
              <article
                v-for="(image, index) in backgroundImageOptions"
                :key="`${image}-${index}`"
                class="background-thumb-card"
                :class="{ active: draft.appearance.backgroundImage === image }"
              >
                <button class="background-thumb" type="button" :style="{ backgroundImage: `url(${image})` }" @click="applyBackgroundImage(image)">
                  <span>{{ draft.appearance.backgroundImage === image ? '使用中' : `背景 ${index + 1}` }}</span>
                </button>
                <div class="background-thumb-actions">
                  <button type="button" :disabled="draft.appearance.backgroundImage === image" @click="applyBackgroundImage(image)">应用</button>
                  <button type="button" @click="removeBackgroundImage(image)">删除</button>
                </div>
              </article>
              <div v-if="!backgroundImageOptions.length" class="empty-note compact-empty-note">还没有背景图，添加 URL 或导入本地图片即可保存多个方案。</div>
            </section>
          </div>
        </section>
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>Bubble system</span>
              <strong>气泡配色</strong>
            </div>
          </header>
          <section class="bubble-preview" :style="bubblePreviewStyle" aria-label="气泡预览">
            <div class="preview-row character-preview-row">
              <img class="avatar mini" :src="characterDraft.avatar" :alt="characterDraftNickname" />
              <div class="preview-bubble" :style="characterBubblePreviewStyle">晚上好，今天的聊天会像这样显示。</div>
            </div>
            <div class="preview-row user-preview-row">
              <div class="preview-bubble" :style="userBubblePreviewStyle">我这边的气泡颜色在这里预览。</div>
            </div>
          </section>
          <div class="color-grid">
            <label class="field color-card">
              <span>我方气泡</span>
              <input v-model="draft.appearance.userBubbleColor" type="color" @change="saveDraft" />
            </label>
            <label class="field color-card">
              <span>我方文字</span>
              <input v-model="draft.appearance.userTextColor" type="color" @change="saveDraft" />
            </label>
            <label class="field color-card">
              <span>对方气泡</span>
              <input v-model="draft.appearance.characterBubbleColor" type="color" @change="saveDraft" />
            </label>
            <label class="field color-card">
              <span>对方文字</span>
              <input v-model="draft.appearance.characterTextColor" type="color" @change="saveDraft" />
            </label>
          </div>
        </section>
        <section class="settings-block display-options-grid">
          <label class="switch-card wide">
            <input v-model="draft.appearance.showReadStatus" type="checkbox" @change="saveDraft" />
            <span class="switch-track"></span>
            <div>
              <strong>显示已读未读</strong>
            </div>
          </label>
          <label class="switch-card wide">
            <input v-model="draft.appearance.showMessageTime" type="checkbox" @change="saveDraft" />
            <span class="switch-track"></span>
            <div>
              <strong>显示气泡外时间</strong>
            </div>
          </label>
        </section>
      </section>

      <section v-else-if="activeTab === 'profile'" class="panel-section profile-panel">
        <section class="profile-preview">
          <img class="avatar" :src="characterDraft.avatar" :alt="characterDraftNickname" />
          <div>
            <strong>{{ characterDraftNickname }}</strong>
            <span>ID {{ characterDraft.id }}</span>
          </div>
        </section>
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>Identity</span>
              <strong>头像与公开资料</strong>
            </div>
          </header>
          <div class="profile-avatar-stack">
            <label class="field">
              <span>头像 URL</span>
              <input v-model="characterDraft.avatar" @change="saveCharacterDraft" />
            </label>
            <label class="upload-card">
              <strong>上传本地头像</strong>
              <span>也可以直接粘贴头像 URL。</span>
              <input type="file" accept="image/*" @change="readAvatarFile" />
            </label>
          </div>
          <label class="field">
            <span>备注（仅用户可见，API 不读取）</span>
            <input v-model="characterDraft.userNote" @change="saveCharacterDraft" />
          </label>
          <label class="field">
            <span>网名</span>
            <input v-model="characterDraft.nickname" @change="saveCharacterDraft" />
          </label>
          <label class="field">
            <span>个性签名</span>
            <input v-model="characterDraft.signature" @change="saveCharacterDraft" />
          </label>
          <label class="field">
            <span>名字</span>
            <input v-model="characterDraft.name" @change="saveCharacterDraft" />
          </label>
          <label class="field">
            <span>角色资料</span>
            <textarea v-model="characterDraft.description" @change="saveCharacterDraft"></textarea>
          </label>
        </section>
      </section>

      <section v-else class="panel-section other-panel">
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>Stickers</span>
              <strong>贴纸读取</strong>
            </div>
          </header>
          <label class="switch-card wide">
            <input v-model="draft.stickerVisionEnabled" type="checkbox" @change="saveDraft" />
            <span class="switch-track"></span>
            <div>
              <strong>开启 Stickers 识图</strong>
              <span>关闭后角色只能读取 Sticker 的文字描述。</span>
            </div>
          </label>
          <button class="sticker-bind-trigger" type="button" @click="toggleStickerGroupPicker">
            <span>
              <strong>角色绑定 Stickers分组</strong>
              <small>{{ characterStickerBindingSummary }}</small>
            </span>
            <ChevronDown :size="18" aria-hidden="true" />
          </button>
          <section v-if="showStickerGroupPicker" class="sticker-group-popover">
            <label v-for="group in stickerGroupPickerRows" :key="group.id" class="sticker-group-option switch-card compact-switch">
              <input :checked="draft.characterStickerGroupIds.includes(group.id)" type="checkbox" @change="updateCharacterStickerGroup(group.id, $event)" />
              <span class="switch-track"></span>
              <span class="sticker-group-name">{{ group.name }}</span>
            </label>
            <div v-if="!stickerGroupPickerRows.length" class="empty-note">暂无 Stickers 分组。</div>
          </section>
        </section>
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>VOOM</span>
              <strong>动态生成</strong>
            </div>
          </header>
          <label class="switch-card wide">
            <input v-model="draft.autoGenerateVoom" type="checkbox" @change="saveDraft" />
            <span class="switch-track"></span>
            <div>
              <strong>允许 AI 回复时自动生成 VOOM</strong>
              <span>这是当前角色独立设置，不再只依赖 settings 的 More 页面。</span>
            </div>
          </label>
          <label class="field frequency-field">
            <span>该角色 VOOM 频率</span>
            <select v-model="draft.voomFrequency" @change="saveDraft">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
        </section>
        <section class="settings-block">
          <header class="section-header">
            <div>
              <span>Local time</span>
              <strong>时间感知</strong>
            </div>
          </header>
          <label class="switch-card wide">
            <input v-model="draft.timeAwareness.enabled" type="checkbox" @change="saveDraft" />
            <span class="switch-track"></span>
            <div>
              <strong>开启时间感知</strong>
              <span>向角色提供当前设备/浏览器的本地日期、时间和时区。</span>
            </div>
          </label>
          <section v-if="draft.timeAwareness.enabled" class="time-awareness-note">
            每次生成回复时都会重新读取本机实时信息，适合判断作息、日期和日常节奏。
          </section>
        </section>
      </section>

      <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, reactive, ref, watch } from 'vue';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { CharacterProfile, ConversationMemoryRecord, ConversationSettings } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';
import { estimateTokenCount, normalizeConversationSettings, summaryPerspectiveOptions } from '@/utils/memory';

const props = defineProps<{
  conversationId: string;
  character: CharacterProfile;
  activeTab: PanelTab;
}>();

const store = useAppStore();
export type PanelTab = 'memory' | 'beauty' | 'profile' | 'other';

const activeTab = computed(() => props.activeTab);
const summarizing = ref(false);
const showManualSummary = ref(false);
const showMergePicker = ref(false);
const showUnmergePicker = ref(false);
const showStickerGroupPicker = ref(false);
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');
const backgroundImageUrlDraft = ref('');
const selectedMergeIds = ref<string[]>([]);
const draft = reactive<ConversationSettings>(normalizeConversationSettings(null, props.conversationId));
const characterDraft = reactive<CharacterProfile>({ ...props.character, localWorldBookIds: [...props.character.localWorldBookIds] });
const manualSummary = reactive({
  startFloor: 1,
  endFloor: 1,
  hiddenStartFloor: 0,
  hiddenEndFloor: 0
});

const memories = computed(() => store.memoriesForConversation(props.conversationId));
const totalMemoryTokens = computed(() => memories.value.reduce((total, memory) => total + memory.tokenCount, 0));
const messageCount = computed(() => store.messagesForConversation(props.conversationId).length);
const hiddenFloorStatus = computed(() => {
  const hiddenRanges = memories.value
    .filter((memory) => memory.hiddenStartFloor > 0 && memory.hiddenEndFloor >= memory.hiddenStartFloor)
    .map((memory) => `${memory.hiddenStartFloor}-${memory.hiddenEndFloor}楼`);
  if (!hiddenRanges.length) return `当前对话共 ${messageCount.value} 楼，暂无隐藏楼层。`;
  return `当前对话共 ${messageCount.value} 楼，已隐藏 ${hiddenRanges.join('、')}。`;
});
const hasMergedSummary = computed(() => memories.value.some((memory) => memory.isMergedSummary));
const mergeDisabled = computed(() => hasMergedSummary.value || memories.value.filter((memory) => !memory.isMergedSummary).length <= 1);
const mergeableMemories = computed(() => memories.value.filter((memory) => !memory.isMergedSummary));
const mergedMemories = computed(() => memories.value.filter((memory) => memory.isMergedSummary));
const characterDraftNickname = computed(() => characterDraft.nickname || 'new.friend');
const selectedSummaryPerspective = computed(() => summaryPerspectiveOptions.find((option) => option.value === draft.memory.summaryPerspective) ?? summaryPerspectiveOptions[0]);
const backgroundImageOptions = computed(() => draft.appearance.backgroundImages);
const bubblePreviewStyle = computed(() => ({
  backgroundColor: draft.appearance.backgroundColor,
  backgroundImage: draft.appearance.backgroundImage ? `url(${draft.appearance.backgroundImage})` : 'none'
}));
const userBubblePreviewStyle = computed(() => ({
  background: draft.appearance.userBubbleColor,
  color: draft.appearance.userTextColor
}));
const characterBubblePreviewStyle = computed(() => ({
  background: draft.appearance.characterBubbleColor,
  color: draft.appearance.characterTextColor
}));
const groupedModels = computed(() => {
  return (store.settings?.apiVendors ?? [])
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      avatar: vendor.avatar,
      models: vendor.models
        .filter((model) => model.selected)
        .map((model) => ({
          value: `${vendor.id}::${model.id}`,
          label: model.nickname || model.id
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN'))
    }))
    .filter((vendor) => vendor.models.length)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
});
const stickerGroupPickerRows = computed(() => store.sortedStickerGroups.map((group) => ({
  id: group.id,
  name: group.name
})));
const characterStickerBindingSummary = computed(() => {
  const groupIds = new Set(draft.characterStickerGroupIds);
  if (!groupIds.size) return '未选择';
  const names = stickerGroupPickerRows.value
    .filter((group) => groupIds.has(group.id))
    .map((group) => group.name);
  if (!names.length) return '未选择';
  return names.join('、');
});
const canManualSummarize = computed(() => {
  const start = Number(manualSummary.startFloor);
  const end = Number(manualSummary.endFloor);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start || end > messageCount.value) return false;
  const hiddenStart = Number(manualSummary.hiddenStartFloor);
  const hiddenEnd = Number(manualSummary.hiddenEndFloor);
  if (!hiddenStart && !hiddenEnd) return true;
  return hiddenStart >= start && hiddenEnd >= hiddenStart && hiddenEnd <= end;
});

watch(
  () => [props.conversationId, store.conversationSettings.length] as const,
  () => {
    Object.assign(draft, normalizeConversationSettings(store.settingsForConversation(props.conversationId), props.conversationId));
    showStickerGroupPicker.value = false;
    fillLatestRange();
  },
  { immediate: true }
);

watch(
  () => props.character,
  (nextCharacter) => Object.assign(characterDraft, { ...nextCharacter, localWorldBookIds: [...nextCharacter.localWorldBookIds] }),
  { immediate: true, deep: true }
);

function saveDraft() {
  void store.saveConversationSettings({ ...draft, conversationId: props.conversationId });
}

function normalizeSelectedStickerGroupIds(groupIds: string[]) {
  const selectedIds = new Set(groupIds.map((groupId) => groupId.trim()).filter(Boolean));
  return store.sortedStickerGroups.map((group) => group.id).filter((groupId) => selectedIds.has(groupId));
}

function toggleStickerGroupPicker() {
  showStickerGroupPicker.value = !showStickerGroupPicker.value;
}

async function updateCharacterStickerGroup(groupId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const groupIds = new Set(draft.characterStickerGroupIds);
  if (checked) groupIds.add(groupId);
  else groupIds.delete(groupId);
  const nextSettings = normalizeConversationSettings({
    ...draft,
    conversationId: props.conversationId,
    characterStickerGroupIds: normalizeSelectedStickerGroupIds([...groupIds])
  }, props.conversationId);
  Object.assign(draft, nextSettings);
  await store.saveConversationSettings(nextSettings);
  Object.assign(draft, normalizeConversationSettings(store.settingsForConversation(props.conversationId), props.conversationId));
}

async function manualSummarize() {
  if (!canManualSummarize.value) return;
  summarizing.value = true;
  try {
    await store.summarizeConversationWindow(props.conversationId, {
      forceStartFloor: Math.max(1, Math.floor(Number(manualSummary.startFloor))),
      forceEndFloor: Math.max(1, Math.floor(Number(manualSummary.endFloor))),
      hiddenStartFloor: Math.max(0, Math.floor(Number(manualSummary.hiddenStartFloor) || 0)),
      hiddenEndFloor: Math.max(0, Math.floor(Number(manualSummary.hiddenEndFloor) || 0))
    });
    fillLatestRange();
  } finally {
    summarizing.value = false;
  }
}

function fillLatestRange() {
  const lastEndFloor = memories.value.reduce((max, memory) => Math.max(max, memory.endFloor), 0);
  const startFloor = Math.min(Math.max(1, lastEndFloor + 1), Math.max(1, messageCount.value));
  const endFloor = Math.max(startFloor, messageCount.value);
  manualSummary.startFloor = startFloor;
  manualSummary.endFloor = endFloor;
  const length = endFloor - startFloor + 1;
  const keepTail = Math.min(10, Math.max(1, Math.ceil(length * 0.1)));
  const hiddenEndFloor = Math.max(startFloor - 1, endFloor - keepTail);
  manualSummary.hiddenStartFloor = hiddenEndFloor >= startFloor ? startFloor : 0;
  manualSummary.hiddenEndFloor = hiddenEndFloor >= startFloor ? hiddenEndFloor : 0;
}

async function resummarize(memoryId: string) {
  summarizing.value = true;
  try {
    await store.resummarizeMemory(memoryId);
  } finally {
    summarizing.value = false;
  }
}

async function confirmResummarize(memoryId: string) {
  if (!window.confirm('确认重新调用 API 总结这条记录吗？')) return;
  await resummarize(memoryId);
}

async function mergeMemories() {
  if (selectedMergeIds.value.length <= 1) return;
  summarizing.value = true;
  try {
    await store.mergeConversationMemories(props.conversationId, selectedMergeIds.value);
    selectedMergeIds.value = [];
    showMergePicker.value = false;
  } finally {
    summarizing.value = false;
  }
}

async function unmergeMemories(memoryId: string) {
  summarizing.value = true;
  try {
    await store.unmergeConversationMemories(props.conversationId, memoryId);
    showUnmergePicker.value = false;
  } finally {
    summarizing.value = false;
  }
}

async function confirmDeleteMemory(memoryId: string) {
  if (!window.confirm('确认删除这条总结吗？')) return;
  await store.deleteMemoryRecord(memoryId);
}

function updateMemorySummary(memory: ConversationMemoryRecord, event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  void store.updateMemoryRecord({
    ...memory,
    summary: textarea.value,
    tokenCount: estimateTokenCount(textarea.value)
  });
}

function toggleHidden(memory: ConversationMemoryRecord, hidden: boolean) {
  void store.toggleMemoryHiddenRange(memory.id, hidden);
}

function hiddenRangeLabel(memory: ConversationMemoryRecord) {
  if (!hasHiddenRange(memory)) return '未隐藏';
  return `${memory.hiddenStartFloor}-${memory.hiddenEndFloor}楼`;
}

function hasHiddenRange(memory: ConversationMemoryRecord) {
  return memory.hiddenStartFloor > 0 && memory.hiddenEndFloor >= memory.hiddenStartFloor;
}

function vendorSelectLabel(vendor: { avatar: string; name: string }) {
  return `${vendor.avatar ? '◉ ' : ''}${vendor.name}`;
}

function selectedModelMeta(value: string) {
  if (!value.trim()) return null;
  const [vendorId, ...modelParts] = value.split('::');
  if (!modelParts.length) return null;
  const vendor = groupedModels.value.find((item) => item.id === vendorId);
  if (!vendor) return null;
  const modelValue = `${vendorId}::${modelParts.join('::')}`;
  const model = vendor.models.find((item) => item.value === modelValue);
  if (!model) return null;
  return {
    avatar: vendor.avatar,
    vendorName: vendor.name,
    modelLabel: model.label
  };
}

function saveCharacterDraft() {
  void store.saveCharacter({ ...characterDraft, localWorldBookIds: [...characterDraft.localWorldBookIds] });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function syncBackgroundImages(images: string[], activeImage = draft.appearance.backgroundImage) {
  const normalizedImages = [...new Set(images.map((image) => image.trim()).filter(Boolean))];
  draft.appearance.backgroundImages = normalizedImages;
  draft.appearance.backgroundImage = normalizedImages.includes(activeImage) ? activeImage : normalizedImages[0] ?? '';
  saveDraft();
}

function addBackgroundImages(images: string[]) {
  const nextImages = [...draft.appearance.backgroundImages, ...images];
  const activeImage = images[images.length - 1]?.trim() || draft.appearance.backgroundImage;
  syncBackgroundImages(nextImages, activeImage);
}

function addBackgroundImageFromUrl() {
  const image = backgroundImageUrlDraft.value.trim();
  if (!image) return;
  addBackgroundImages([image]);
  backgroundImageUrlDraft.value = '';
}

async function readAppearanceFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (!files.length) return;
  const images = (await Promise.all(files.map((file) => readFileAsDataUrl(file)))).filter(Boolean);
  if (images.length) addBackgroundImages(images);
  input.value = '';
}

function applyBackgroundImage(image: string) {
  if (!image.trim()) return;
  syncBackgroundImages(draft.appearance.backgroundImages, image.trim());
}

function removeBackgroundImage(image: string) {
  const nextImages = draft.appearance.backgroundImages.filter((item) => item !== image);
  syncBackgroundImages(nextImages, draft.appearance.backgroundImage === image ? nextImages[0] ?? '' : draft.appearance.backgroundImage);
}

async function readAvatarFile(event: Event) {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  avatarEditorSource.value = image;
  showAvatarEditor.value = true;
}

function applyEditedAvatar(value: string) {
  characterDraft.avatar = value;
  saveCharacterDraft();
}
</script>

<style scoped>
.control-panel {
  position: relative;
  display: grid;
  gap: 14px;
}

.panel-section {
  display: grid;
  gap: 14px;
}

.memory-hero,
.profile-preview,
.upload-card,
.empty-note {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.memory-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.memory-hero div {
  display: grid;
  gap: 4px;
}

.memory-hero span,
.memory-card p,
.empty-note,
.upload-card span,
.profile-preview span,
.switch-card span:not(.switch-track) {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.memory-hero strong {
  font-size: 22px;
}

.memory-hero p {
  margin: 0;
  color: #716d72;
  font-size: 12px;
  line-height: 1.5;
}

.manual-summary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #181717, #4a443f);
  color: #fffaf4;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(34, 27, 23, 0.22);
}

.manual-summary-button:disabled {
  opacity: 0.55;
}

.manual-summary-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 235, 203, 0.9), transparent 38%),
    rgba(255, 255, 255, 0.72);
  box-shadow: 0 18px 46px rgba(73, 57, 43, 0.12);
}

.range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.manual-summary-card p {
  margin: 0;
  color: #7a7473;
  font-size: 12px;
  line-height: 1.5;
}

.manual-summary-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  background: #22201e;
  color: #ffffff;
  font-weight: 900;
}

.summary-submit:disabled {
  background: #c9c2bb;
  color: #fffaf4;
}

.memory-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.compact-field {
  justify-content: center;
  min-height: 76px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.compact-field input {
  min-height: 32px;
  border-radius: 12px;
}

.switch-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.switch-card.wide {
  grid-template-columns: auto minmax(0, 1fr);
}

.switch-card.compact-switch {
  min-height: 34px;
  padding: 8px 10px;
  border-radius: 12px;
}

.compact-switch .switch-track {
  width: 38px;
  height: 22px;
}

.compact-switch .switch-track::after {
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
}

.compact-switch input:checked + .switch-track::after {
  transform: translateX(16px);
}

.switch-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #d8d2cf;
  transition: background 0.18s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 3px 8px rgba(42, 35, 31, 0.2);
  transition: transform 0.18s ease;
}

.switch-card input:checked + .switch-track {
  background: #24211f;
}

.switch-card input:checked + .switch-track::after {
  transform: translateX(18px);
}

.switch-card div {
  display: grid;
  gap: 3px;
}

.switch-card strong {
  font-size: 13px;
}

.sticker-bind-trigger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  color: #24201e;
  text-align: left;
}

.sticker-bind-trigger span {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.sticker-bind-trigger strong,
.sticker-bind-trigger small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sticker-bind-trigger strong {
  font-size: 13px;
  font-weight: 900;
}

.sticker-bind-trigger small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.sticker-bind-trigger svg {
  flex: 0 0 auto;
  color: #4f4844;
}

.sticker-group-popover {
  display: grid;
  gap: 4px;
  padding: 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(36, 32, 29, 0.06);
}

.sticker-group-option {
  grid-template-columns: auto minmax(0, 1fr);
  color: #28231f;
  font-weight: 800;
}

.sticker-group-option:active {
  background: rgba(36, 32, 29, 0.06);
}

.sticker-group-name {
  min-width: 0;
  overflow: hidden;
  color: #28231f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-awareness-note {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.model-picker-field {
  display: grid;
  gap: 9px;
}

.model-picker-field > span {
  color: #686b70;
  font-size: 12px;
  font-weight: 800;
}

.model-select-field select {
  width: 100%;
  min-height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  color: #24201e;
  font-weight: 800;
}

.model-select-shell {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 5px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
}

.model-select-shell img {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--soft);
}

.model-select-vendor {
  max-width: 86px;
  overflow: hidden;
  color: #5f5a56;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-select-shell select:not(.with-provider) {
  grid-column: 1 / -1;
}

.model-default,
.model-choice {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid rgba(36, 32, 29, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.68);
  color: #34302d;
  font-size: 12px;
  font-weight: 800;
}

.model-default.active,
.model-choice.active {
  border-color: rgba(28, 26, 24, 0.82);
  background: #1e1c1a;
  color: #ffffff;
}

.provider-model-list {
  display: grid;
  gap: 10px;
}

.provider-model-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
}

.provider-model-card header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-model-card img {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--soft);
}

.provider-model-card strong {
  font-size: 13px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.appearance-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.appearance-tool-card {
  min-width: 0;
  min-height: 82px;
  justify-content: start;
  padding: 10px;
}

.appearance-tool-card input {
  min-width: 0;
}

.appearance-upload-card {
  position: relative;
  cursor: pointer;
}

.appearance-upload-card input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.appearance-color-field input[type='color'] {
  width: 100%;
  min-height: 32px;
  padding: 3px;
}

.profile-avatar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.profile-avatar-grid .field,
.profile-avatar-grid .upload-card {
  min-width: 0;
}

.profile-avatar-grid .upload-card {
  padding: 10px;
}

.profile-avatar-grid input {
  min-width: 0;
}

.memory-records {
  display: grid;
  gap: 10px;
}

.memory-records > header,
.memory-card-head,
.memory-actions,
.profile-preview {
  display: flex;
  align-items: center;
}

.memory-records > header,
.memory-card-head {
  justify-content: space-between;
  gap: 10px;
}

.memory-records > header span,
.memory-card-head span {
  color: var(--muted);
  font-size: 12px;
}

.merge-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.merge-picker {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
}

.merge-row {
  grid-template-columns: auto minmax(0, 1fr);
  background: rgba(244, 242, 242, 0.82);
  color: #302c29;
  font-size: 12px;
  font-weight: 800;
}

.merge-row span:not(.switch-track) {
  color: #302c29;
}

.button-row {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 10px;
}

.memory-card {
  display: grid;
  gap: 9px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
}

.memory-card p {
  margin: 0;
}

.memory-card textarea {
  min-height: 96px;
  padding: 10px;
  border: 0;
  border-radius: 12px;
  outline: 0;
  background: #f4f2f2;
  resize: vertical;
}

.memory-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex-wrap: wrap;
  gap: 8px;
}

.danger-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: rgba(239, 68, 90, 0.12);
  color: var(--danger);
  font-weight: 800;
}

.upload-card {
  display: grid;
  gap: 5px;
  padding: 12px;
}

.upload-card input {
  min-height: 34px;
}

.profile-preview {
  gap: 10px;
  padding: 12px;
}

.profile-preview div {
  display: grid;
  gap: 3px;
}

.empty-note {
  padding: 12px;
}

.control-panel {
  gap: 16px;
  color: #171717;
}

.panel-section {
  gap: 12px;
}

.settings-block {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(19, 24, 22, 0.06);
  border-radius: 20px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 248, 0.9)),
    radial-gradient(circle at top right, rgba(6, 199, 85, 0.09), transparent 34%);
  box-shadow: 0 14px 34px rgba(16, 24, 20, 0.07);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-header div {
  display: grid;
  gap: 2px;
}

.section-header span {
  color: #8a8f94;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-header strong {
  color: #161616;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
}

.compact-header strong {
  font-size: 14px;
}

.memory-hero,
.profile-preview {
  padding: 18px;
  border: 1px solid rgba(19, 24, 22, 0.05);
  border-radius: 24px;
  background:
    radial-gradient(circle at 92% 4%, rgba(6, 199, 85, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 248, 0.92));
  box-shadow: 0 18px 42px rgba(18, 25, 22, 0.08);
}

.memory-hero {
  align-items: flex-start;
  min-height: 118px;
}

.memory-hero span,
.profile-preview span {
  color: #8a8f94;
  font-size: 12px;
  font-weight: 700;
}

.memory-hero strong {
  color: #0f1111;
  font-size: 28px;
  line-height: 1;
  letter-spacing: 0;
}

.memory-hero p {
  max-width: 210px;
  color: #74797d;
  font-size: 12px;
}

.manual-summary-button,
.summary-submit {
  min-height: 40px;
  border-radius: 14px;
  background: #171717;
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(17, 17, 17, 0.18);
}

.manual-summary-button {
  flex: 0 0 auto;
  padding: 0 16px;
}

.manual-summary-button:active,
.summary-submit:active {
  transform: translateY(1px);
}

.manual-summary-card {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(251, 248, 245, 0.92)),
    radial-gradient(circle at top right, rgba(240, 168, 123, 0.16), transparent 34%);
}

.manual-summary-card p {
  color: #797d82;
}

.memory-toggle-grid,
.display-options-grid {
  gap: 9px;
}

.switch-card,
.compact-field,
.sticker-bind-trigger,
.field input,
.field textarea,
.field select,
.upload-card,
.time-awareness-note,
.empty-note,
.memory-card,
.merge-picker {
  border: 1px solid rgba(20, 24, 22, 0.05);
  border-radius: 16px;
  background: #f6f7f7;
  box-shadow: none;
}

.switch-card {
  min-height: 58px;
  padding: 12px;
}

.switch-card strong,
.sticker-bind-trigger strong {
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.switch-card span:not(.switch-track),
.sticker-bind-trigger small,
.time-awareness-note,
.empty-note {
  color: #85898e;
  font-size: 12px;
}

.switch-track {
  width: 46px;
  height: 28px;
  background: #dedad7;
}

.switch-track::after {
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
}

.switch-card input:checked + .switch-track {
  background: #171717;
}

.switch-card input:checked + .switch-track::after {
  transform: translateX(18px);
}

.compact-switch .switch-track {
  width: 38px;
  height: 22px;
}

.compact-switch .switch-track::after {
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
}

.compact-switch input:checked + .switch-track::after {
  transform: translateX(16px);
}

.compact-field {
  min-height: 76px;
  justify-content: center;
}

.field > span {
  color: #767b81;
  font-size: 12px;
  font-weight: 800;
}

.field input,
.field textarea,
.field select {
  min-height: 42px;
  padding: 10px 12px;
  color: #171717;
  font-weight: 700;
}

.field textarea {
  min-height: 112px;
  line-height: 1.55;
}

.model-select-shell {
  min-height: 48px;
  border: 1px solid rgba(20, 24, 22, 0.05);
  background: #f6f7f7;
}

.model-select-field select {
  background: transparent;
}

.perspective-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.perspective-option {
  position: relative;
  display: grid;
  gap: 5px;
  min-height: 88px;
  padding: 12px;
  border: 1px solid rgba(20, 24, 22, 0.06);
  border-radius: 16px;
  background: #f6f7f7;
  overflow: hidden;
}

.perspective-option:last-child {
  grid-column: 1 / -1;
}

.perspective-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.perspective-option span {
  width: fit-content;
  max-width: 100%;
  padding: 3px 7px;
  border-radius: 999px;
  background: #ffffff;
  color: #4f5559;
  font-size: 10px;
  font-weight: 900;
}

.perspective-option strong {
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.perspective-option small {
  color: #85898e;
  font-size: 11px;
  line-height: 1.35;
}

.perspective-option.active {
  border-color: rgba(6, 199, 85, 0.46);
  background: linear-gradient(145deg, #ffffff, #eef9f2);
  box-shadow: 0 10px 24px rgba(6, 199, 85, 0.1);
}

.perspective-option.active span {
  background: #171717;
  color: #ffffff;
}

.record-header em {
  align-self: center;
  color: #898e93;
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
}

.merge-actions,
.manual-summary-actions,
.memory-actions {
  gap: 8px;
}

.secondary-action,
.danger-action {
  min-height: 40px;
  border-radius: 14px;
  font-weight: 900;
}

.secondary-action {
  background: #eef0f1;
  color: #171717;
}

.secondary-action:disabled,
.summary-submit:disabled {
  background: #ece9e7;
  color: #aba7a4;
  box-shadow: none;
}

.danger-action {
  background: rgba(239, 68, 90, 0.11);
}

.memory-card {
  gap: 10px;
  padding: 12px;
}

.memory-card textarea {
  min-height: 104px;
  border: 1px solid rgba(20, 24, 22, 0.05);
  background: #ffffff;
}

.appearance-tools-grid,
.color-grid,
.profile-avatar-grid {
  gap: 9px;
}

.appearance-tool-card,
.color-card,
.profile-avatar-grid .field,
.profile-avatar-grid .upload-card {
  min-height: 88px;
}

.appearance-tool-card,
.color-card {
  padding: 12px;
}

.color-card input[type='color'],
.appearance-color-field input[type='color'] {
  min-height: 38px;
  padding: 4px;
  border-radius: 12px;
  background: #ffffff;
}

.upload-card {
  position: relative;
  align-content: center;
  gap: 4px;
  padding: 12px;
  cursor: pointer;
}

.upload-card strong {
  color: #171717;
  font-size: 14px;
  font-weight: 900;
}

.upload-card input[type='file'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  opacity: 0;
  cursor: pointer;
}

.profile-preview {
  gap: 14px;
}

.profile-preview .avatar {
  width: 60px;
  height: 60px;
  border: 3px solid #ffffff;
  box-shadow: 0 10px 24px rgba(18, 25, 22, 0.12);
}

.profile-preview strong {
  color: #171717;
  font-size: 17px;
  font-weight: 900;
}

.sticker-bind-trigger {
  min-height: 56px;
  padding: 12px;
}

.sticker-group-popover {
  gap: 7px;
  padding: 8px;
  border: 1px solid rgba(20, 24, 22, 0.05);
  background: #ffffff;
}

.time-awareness-note {
  padding: 12px;
  line-height: 1.55;
}

.control-panel button,
.setting-action-button,
.secondary-action,
.danger-action,
.summary-submit,
.manual-summary-button,
.sticker-bind-trigger,
.background-thumb-actions button {
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, opacity 0.16s ease;
}

.control-panel button:active,
.setting-action-button:active,
.secondary-action:active,
.danger-action:active,
.summary-submit:active,
.manual-summary-button:active,
.sticker-bind-trigger:active,
.background-thumb-actions button:active {
  transform: translateY(1px);
}

.manual-summary-button,
.summary-submit,
.setting-action-button,
.secondary-action,
.danger-action,
.background-thumb-actions button {
  min-height: 42px;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.manual-summary-button,
.summary-submit,
.primary-setting-action {
  background: linear-gradient(145deg, #181818, #31302d);
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(22, 22, 22, 0.16);
}

.secondary-action,
.background-thumb-actions button:first-child {
  background: #edf1ef;
  color: #171717;
  box-shadow: inset 0 0 0 1px rgba(23, 23, 23, 0.04);
}

.danger-action,
.background-thumb-actions button:last-child {
  background: rgba(239, 68, 90, 0.1);
  color: #d73850;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 90, 0.08);
}

.secondary-action:disabled,
.summary-submit:disabled,
.background-thumb-actions button:disabled {
  transform: none;
  background: #ebe8e5;
  color: #aaa5a0;
  box-shadow: none;
  cursor: default;
}

.perspective-select-field {
  gap: 8px;
}

.perspective-select-field > small {
  color: #7c8287;
  font-size: 12px;
  line-height: 1.45;
}

.perspective-select-shell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 50px;
  padding: 6px;
  border: 1px solid rgba(20, 24, 22, 0.06);
  border-radius: 16px;
  background: #f6f8f7;
}

.perspective-select-shell strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 12px;
  background: #171717;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.perspective-select-shell select {
  min-height: 38px;
  padding: 0 8px;
  border-radius: 12px;
  background: transparent;
  color: #171717;
  font-weight: 900;
}

.memory-records {
  gap: 12px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 249, 0.9)),
    radial-gradient(circle at 12% 0%, rgba(6, 199, 85, 0.09), transparent 32%);
}

.memory-card {
  position: relative;
  gap: 12px;
  padding: 15px 14px 14px 18px;
  border: 1px solid rgba(50, 43, 35, 0.08);
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(224, 217, 205, 0.58) 0 8px, transparent 8px),
    linear-gradient(180deg, #fffdf9 0%, #fbfaf6 100%);
  box-shadow: 0 16px 28px rgba(36, 30, 24, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.memory-card::after {
  content: '';
  position: absolute;
  inset: 14px 12px 14px auto;
  width: 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(77, 67, 55, 0.05));
  pointer-events: none;
}

.memory-card-head {
  align-items: flex-start;
}

.memory-card-head div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.memory-card-head span {
  color: #9b8f82;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.memory-card-head strong {
  color: #221f1c;
  font-size: 15px;
  font-weight: 900;
}

.memory-card-head em {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef8f1;
  color: #1f6b3a;
  font-style: normal;
  font-size: 10px;
  font-weight: 900;
}

.memory-card textarea {
  min-height: 178px;
  padding: 14px 14px 14px 16px;
  border: 1px solid rgba(84, 74, 62, 0.08);
  border-radius: 14px;
  background:
    repeating-linear-gradient(180deg, transparent 0 27px, rgba(70, 60, 48, 0.045) 28px),
    rgba(255, 255, 255, 0.72);
  color: #2a2723;
  font-size: 13px;
  line-height: 1.85;
}

.memory-empty-note {
  min-height: 96px;
  display: grid;
  place-items: center;
  text-align: center;
  background:
    linear-gradient(90deg, rgba(224, 217, 205, 0.44) 0 8px, transparent 8px),
    #fffdf9;
  color: #8b847d;
}

.background-manager {
  display: grid;
  gap: 10px;
}

.background-url-card,
.background-upload-card,
.background-color-card {
  min-height: 84px;
  padding: 12px;
  border: 1px solid rgba(20, 24, 22, 0.05);
  border-radius: 16px;
  background: #f6f8f7;
}

.inline-input-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.inline-input-action input {
  min-width: 0;
}

.setting-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 0 12px;
}

.background-color-card input[type='color'] {
  width: 100%;
  min-height: 42px;
  padding: 5px;
  border-radius: 13px;
  background: #ffffff;
}

.background-library {
  display: grid;
  gap: 10px;
}

.background-thumb-card {
  display: grid;
  gap: 8px;
  padding: 9px;
  border: 1px solid rgba(20, 24, 22, 0.06);
  border-radius: 18px;
  background: #ffffff;
}

.background-thumb-card.active {
  border-color: rgba(6, 199, 85, 0.36);
  box-shadow: 0 12px 24px rgba(6, 199, 85, 0.09);
}

.background-thumb {
  position: relative;
  display: grid;
  align-items: end;
  width: 100%;
  min-height: 118px;
  padding: 10px;
  border-radius: 14px;
  overflow: hidden;
  background-color: #eef1ef;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  text-align: left;
}

.background-thumb::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 28%, rgba(0, 0, 0, 0.35));
}

.background-thumb span {
  position: relative;
  width: fit-content;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.72);
  font-size: 11px;
  font-weight: 900;
}

.background-thumb-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.background-thumb-actions button {
  min-height: 36px;
}

.compact-empty-note {
  min-height: 72px;
  display: grid;
  place-items: center;
  text-align: center;
}

.bubble-preview {
  display: grid;
  gap: 10px;
  min-height: 154px;
  padding: 14px;
  border: 1px solid rgba(20, 24, 22, 0.06);
  border-radius: 18px;
  background-position: center;
  background-size: cover;
  box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.26);
}

.preview-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.user-preview-row {
  justify-content: flex-end;
}

.preview-bubble {
  max-width: 76%;
  padding: 9px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.character-preview-row .preview-bubble {
  border-bottom-left-radius: 6px;
}

.user-preview-row .preview-bubble {
  border-bottom-right-radius: 6px;
}

.display-options-grid {
  grid-template-columns: 1fr;
}

.display-options-grid .switch-card {
  min-height: 58px;
}

.profile-avatar-stack {
  display: grid;
  gap: 10px;
}

.profile-avatar-stack .field,
.profile-avatar-stack .upload-card {
  min-width: 0;
  min-height: 86px;
}

@media (max-width: 360px) {
  .memory-toggle-grid,
  .range-grid,
  .color-grid,
  .profile-avatar-stack {
    grid-template-columns: 1fr;
  }

  .appearance-tools-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

<template>
  <section class="image-module-configurator">
    <section class="composer-shell">
      <section class="composer-hero" :class="`composer-hero-${activeModuleId}`">
        <div>
          <span>{{ activeModuleMeta.kicker }}</span>
          <strong>{{ activeModuleMeta.title }}</strong>
          <p>{{ activeModuleMeta.description }}</p>
        </div>
        <button class="secondary-action hero-generate" type="button" :disabled="previewState[activeModuleId] === 'loading'" @click="triggerPreview(activeModuleId)">
          {{ previewState[activeModuleId] === 'loading' ? '生成中' : '立即测试' }}
        </button>
      </section>

      <p v-if="moduleFeedback[activeModuleId]" class="module-feedback" :class="previewState[activeModuleId] === 'error' ? 'error' : 'success'">
        {{ moduleFeedback[activeModuleId] }}
      </p>

      <section v-if="activeModuleId === 'openai'" class="composer-section form-grid">
        <div class="section-head compact">
          <div>
            <p class="section-kicker">Vendors</p>
            <h3>OpenAI 兼容供应商</h3>
          </div>
          <button class="secondary-action section-action" type="button" @click="openVendorCreator">添加供应商</button>
        </div>

        <div v-if="draft.imageOpenAi.vendors.length" class="provider-list">
          <button
            v-for="vendor in draft.imageOpenAi.vendors"
            :key="vendor.id"
            class="provider-card"
            :class="{ active: draft.imageOpenAi.activeVendorId === vendor.id }"
            type="button"
            @click="openVendorEditor(vendor)"
          >
            <img class="provider-avatar" :src="vendor.avatar" :alt="vendor.name" />
            <div class="provider-copy">
              <strong>{{ vendor.name }}</strong>
              <p>{{ imageVendorModelSummary(vendor) }}</p>
            </div>
            <div class="provider-meta">
              <span class="status-pill" :class="vendor.enabled ? 'enabled' : 'disabled'">
                {{ vendor.enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <small>{{ draft.imageOpenAi.activeVendorId === vendor.id ? '当前默认' : '点击编辑' }}</small>
            </div>
          </button>
        </div>
        <section v-else class="empty-shell">
          <strong>还没有图片供应商</strong>
          <p>支持添加多个 OpenAI 兼容图片供应商，例如 OpenAI、OpenRouter 或自建网关。</p>
        </section>

        <label class="field">
          <span>默认供应商</span>
          <select v-model="draft.imageOpenAi.activeVendorId">
            <option value="">请选择供应商</option>
            <option v-for="vendor in draft.imageOpenAi.vendors" :key="vendor.id" :value="vendor.id">
              {{ vendor.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>默认画幅</span>
          <select v-model="draft.imageOpenAi.size">
            <option value="1024x1024">1024 x 1024</option>
            <option value="1024x1536">1024 x 1536</option>
            <option value="1536x1024">1536 x 1024</option>
            <option value="auto">auto</option>
          </select>
        </label>

        <label class="field">
          <span>正向提示词</span>
          <textarea v-model="draft.imageOpenAi.positivePrompt" placeholder="例如：Seoul editorial photo, linen desk, soft sunlight, clean composition" />
        </label>

        <label class="field">
          <span>反向提示词</span>
          <textarea v-model="draft.imageOpenAi.negativePrompt" placeholder="例如：blurry, extra fingers, noisy background, oversaturated" />
        </label>

        <section class="preview-card">
          <div class="preview-copy">
            <p class="section-kicker">Preview</p>
            <h3>GPT-Image 预览</h3>
          </div>
          <img v-if="draft.imageOpenAi.lastImageUrl" class="preview-image" :src="draft.imageOpenAi.lastImageUrl" alt="GPT image preview" />
          <div v-else class="preview-placeholder placeholder-openai"><span>等待生成预览</span></div>
        </section>
      </section>

      <section v-else-if="activeModuleId === 'novelai'" class="composer-section form-grid">
        <div class="section-head compact">
          <div>
            <p class="section-kicker">NovelAI</p>
            <h3>代理与参数</h3>
          </div>
        </div>

        <label class="field">
          <span>接口地址</span>
          <input v-model="draft.imageNovelAi.apiUrl" placeholder="https://image.novelai.net" />
        </label>

        <label class="field">
          <span>代理地址</span>
          <input v-model="draft.imageNovelAi.proxyUrl" placeholder="https://your-proxy.example.com" />
          <small class="field-hint">中国大陆环境建议填写你自己的反代地址，留空则直连官方域名。</small>
        </label>

        <label class="field">
          <span>NovelAI Token</span>
          <input v-model="draft.imageNovelAi.apiKey" autocomplete="off" type="password" />
        </label>

        <div class="field-grid two-up">
          <label class="field">
            <span>模型</span>
            <input v-model="draft.imageNovelAi.model" placeholder="nai-diffusion-4-5-curated-preview" />
          </label>

          <label class="field">
            <span>采样器</span>
            <select v-model="draft.imageNovelAi.sampler">
              <option value="k_euler_ancestral">k_euler_ancestral</option>
              <option value="k_euler">k_euler</option>
              <option value="k_dpmpp_2m">k_dpmpp_2m</option>
              <option value="k_dpmpp_sde">k_dpmpp_sde</option>
            </select>
          </label>
        </div>

        <div class="field-grid three-up">
          <label class="field">
            <span>宽度</span>
            <input v-model.number="draft.imageNovelAi.width" min="320" step="64" type="number" />
          </label>
          <label class="field">
            <span>高度</span>
            <input v-model.number="draft.imageNovelAi.height" min="320" step="64" type="number" />
          </label>
          <label class="field">
            <span>种子</span>
            <input v-model="draft.imageNovelAi.seed" placeholder="留空随机" />
          </label>
        </div>

        <div class="field-grid two-up">
          <label class="field">
            <span>引导强度</span>
            <input v-model.number="draft.imageNovelAi.guidance" min="1" max="20" step="0.5" type="number" />
          </label>
          <label class="field">
            <span>步数</span>
            <input v-model.number="draft.imageNovelAi.steps" min="1" max="60" step="1" type="number" />
          </label>
        </div>

        <label class="field">
          <span>正向提示词</span>
          <textarea v-model="draft.imageNovelAi.positivePrompt" placeholder="例如：Korean bookshelf cover art, soft beige, embossed title, detailed illustration" />
        </label>

        <label class="field">
          <span>反向提示词</span>
          <textarea v-model="draft.imageNovelAi.negativePrompt" placeholder="例如：bad anatomy, watermark, noisy, text artifacts" />
        </label>

        <section class="preview-card">
          <div class="preview-copy">
            <p class="section-kicker">Preview</p>
            <h3>NovelAI 预览</h3>
          </div>
          <img v-if="draft.imageNovelAi.lastImageUrl" class="preview-image" :src="draft.imageNovelAi.lastImageUrl" alt="NovelAI preview" />
          <div v-else class="preview-placeholder placeholder-novelai"><span>等待生成预览</span></div>
        </section>
      </section>

      <section v-else class="composer-section form-grid">
        <div class="section-head compact">
          <div>
            <p class="section-kicker">Pollinations</p>
            <h3>账号密钥与生图参数</h3>
          </div>
        </div>

        <label class="field">
          <span>Pollinations Token</span>
          <input v-model="draft.imagePollinations.apiKey" autocomplete="off" type="password" placeholder="auth.pollinations.ai 生成的 Token" />
          <small class="field-hint">用于账号额度、去水印和私密生成。浏览器端会随请求发送 Bearer Token。</small>
        </label>

        <label class="field">
          <span>Referrer 标识</span>
          <input v-model="draft.imagePollinations.referrer" placeholder="link-pwa" />
          <small class="field-hint">Pollinations 文档建议 Web App 通过 referrer 标识应用来源。</small>
        </label>

        <div class="field-grid two-up">
          <label class="field">
            <span>模型</span>
            <input v-model="draft.imagePollinations.model" placeholder="flux" />
          </label>
          <label class="field">
            <span>种子</span>
            <input v-model="draft.imagePollinations.seed" placeholder="留空随机" />
          </label>
        </div>

        <div class="field-grid two-up">
          <label class="field">
            <span>宽度</span>
            <input v-model.number="draft.imagePollinations.width" min="320" step="64" type="number" />
          </label>
          <label class="field">
            <span>高度</span>
            <input v-model.number="draft.imagePollinations.height" min="320" step="64" type="number" />
          </label>
        </div>

        <div class="toggle-grid">
          <label class="toggle-card">
            <input v-model="draft.imagePollinations.enhance" class="toggle-input" type="checkbox" />
            <span class="toggle-indicator" aria-hidden="true"></span>
            <div>
              <strong>Enhance</strong>
              <small>启用服务端画质优化。</small>
            </div>
          </label>

          <label class="toggle-card">
            <input v-model="draft.imagePollinations.nologo" class="toggle-input" type="checkbox" />
            <span class="toggle-indicator" aria-hidden="true"></span>
            <div>
              <strong>No logo</strong>
              <small>尽量不在图片中输出 logo。</small>
            </div>
          </label>

          <label class="toggle-card">
            <input v-model="draft.imagePollinations.private" class="toggle-input" type="checkbox" />
            <span class="toggle-indicator" aria-hidden="true"></span>
            <div>
              <strong>Private</strong>
              <small>请求隐藏到公开 feed，需要账号权限。</small>
            </div>
          </label>
        </div>

        <label class="field">
          <span>正向提示词</span>
          <textarea v-model="draft.imagePollinations.positivePrompt" placeholder="例如：minimal Korean zine cover, muted blush palette, bookstore shelf photography" />
        </label>

        <label class="field">
          <span>反向提示词</span>
          <textarea v-model="draft.imagePollinations.negativePrompt" placeholder="例如：extra limbs, deformed hands, cluttered background" />
        </label>

        <section class="preview-card">
          <div class="preview-copy">
            <p class="section-kicker">Preview</p>
            <h3>Pollinations 预览</h3>
          </div>
          <img v-if="draft.imagePollinations.lastImageUrl" class="preview-image" :src="draft.imagePollinations.lastImageUrl" alt="Pollinations preview" />
          <div v-else class="preview-placeholder placeholder-pollinations"><span>等待生成预览</span></div>
        </section>
      </section>
    </section>

    <AppModal v-model="showVendorComposer" :title="vendorEditorTitle" :show-header="false" variant="ins">
      <form class="provider-composer" @submit.prevent="saveVendor">
        <section class="composer-hero provider-hero">
          <img class="provider-avatar" :src="vendorDraft.avatar" :alt="vendorDraft.name || 'Provider avatar'" />
          <div>
            <span>Image vendor</span>
            <strong>{{ vendorDraft.name || 'OpenAI Images' }}</strong>
            <p>{{ vendorDraft.enabled ? '会参与默认图片供应商选择' : '保存后保持禁用状态' }}</p>
          </div>
        </section>

        <nav class="composer-tabs" aria-label="图片供应商编辑分栏">
          <button
            v-for="tab in vendorTabs"
            :key="tab.id"
            class="composer-tab"
            :class="{ active: activeVendorTab === tab.id }"
            type="button"
            @click="activeVendorTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="activeVendorTab === 'provider'" class="composer-section form-grid">
          <label class="toggle-card">
            <input v-model="vendorDraft.enabled" class="toggle-input" type="checkbox" />
            <span class="toggle-indicator" aria-hidden="true"></span>
            <div>
              <strong>启用供应商</strong>
              <small>禁用后仍保留配置，但不会自动作为默认值。</small>
            </div>
          </label>

          <label class="field">
            <span>供应商名称</span>
            <input v-model="vendorDraft.name" placeholder="OpenAI / OpenRouter / 自建图片网关" />
          </label>

          <label class="field">
            <span>头像 URL</span>
            <input v-model="vendorDraft.avatar" placeholder="https://..." />
          </label>

          <label class="vendor-avatar-upload">
            <input type="file" accept="image/*" @change="readVendorAvatar" />
            <strong>上传本地头像</strong>
            <small>保存为图片供应商头像。</small>
          </label>

          <label class="field">
            <span>API Url</span>
            <input v-model="vendorDraft.apiUrl" placeholder="https://api.openai.com/v1" />
          </label>

          <label class="field">
            <span>API 路径</span>
            <input v-model="vendorDraft.apiPath" placeholder="/images/generations" />
          </label>

          <label class="field">
            <span>API Key</span>
            <input v-model="vendorDraft.apiKey" autocomplete="off" type="password" />
          </label>
        </section>

        <section v-else class="composer-section form-grid">
          <div class="sync-shell">
            <div class="sync-copy">
              <span>Model sync</span>
              <strong>点击 Sync now 拉取图片模型</strong>
            </div>
            <button class="sync-button" type="button" :disabled="vendorSyncState === 'loading'" @click="pullVendorModels">
              {{ vendorSyncButtonLabel }}
            </button>
          </div>

          <div v-if="vendorDraft.models.length" class="model-grid">
            <button
              v-for="model in vendorDraft.models"
              :key="model.id"
              class="model-option"
              :class="{ active: model.selected }"
              type="button"
              @click="selectVendorModel(model.id)"
            >
              <div>
                <strong>{{ model.nickname || model.id }}</strong>
                <span>{{ model.id }}</span>
              </div>
            </button>
          </div>

          <section v-else class="empty-shell compact-empty">
            <strong>暂无图片模型</strong>
            <p>先填好接口和 Key，再同步模型列表。</p>
          </section>
        </section>

        <div class="composer-footer">
          <button class="footer-button footer-delete" type="button" :disabled="!editingVendorId" @click="removeVendor">
            删除供应商
          </button>
          <button class="footer-button footer-cancel" type="button" @click="showVendorComposer = false">取消</button>
          <button class="footer-button footer-save" type="submit">保存供应商</button>
        </div>
      </form>
    </AppModal>

    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedVendorAvatar" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import { fetchVendorModels, generateNovelAiImage, generateOpenAiImage, generatePollinationsImage } from '@/services/ai';
import type { ApiVendor, ApiVendorModel, AppSettings, ImageModuleId } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';
import { createApiVendor, mergeVendorModels, normalizeAppSettings } from '@/utils/settings';

type PreviewState = 'idle' | 'loading' | 'success' | 'error';
type VendorComposerTab = 'provider' | 'models';

const props = defineProps<{
  settings: AppSettings;
  moduleId: ImageModuleId;
}>();

const emit = defineEmits<{
  save: [settings: AppSettings];
}>();

const vendorTabs = [
  { id: 'provider' as VendorComposerTab, label: '基础信息' },
  { id: 'models' as VendorComposerTab, label: '图片模型' }
];

const draft = ref<AppSettings>(normalizeAppSettings(props.settings));
const showVendorComposer = ref(false);
const activeVendorTab = ref<VendorComposerTab>('provider');
const editingVendorId = ref<string | null>(null);
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');
const vendorDraft = ref<ApiVendor>(createApiVendor({
  enabled: true,
  name: 'OpenAI Images',
  apiUrl: 'https://api.openai.com/v1',
  apiPath: '/images/generations'
}));
const vendorSyncState = ref<PreviewState>('idle');
const previewState = reactive<Record<ImageModuleId, PreviewState>>({
  openai: 'idle',
  novelai: 'idle',
  pollinations: 'idle'
});
const moduleFeedback = reactive<Record<ImageModuleId, string>>({
  openai: '',
  novelai: '',
  pollinations: ''
});

watch(
  () => props.settings,
  (nextSettings) => {
    draft.value = normalizeAppSettings(nextSettings);
  },
  { deep: true }
);

const activeModuleId = computed(() => props.moduleId);
const activeModuleMeta = computed(() => {
  if (props.moduleId === 'novelai') {
    return {
      kicker: 'NovelAI',
      title: 'NovelAI',
      description: '连接 NovelAI 图片接口，用于生成角色与封面图片。'
    };
  }

  if (props.moduleId === 'pollinations') {
    return {
      kicker: 'Pollinations',
      title: 'Pollinations',
      description: '连接 Pollinations 图片接口，用于生成角色与封面图片。'
    };
  }

  return {
    kicker: 'GPT-Image2',
    title: 'OpenAI',
    description: '连接 OpenAI 兼容图片接口，用于生成角色与封面图片。'
  };
});
const vendorEditorTitle = computed(() => editingVendorId.value ? '编辑图片供应商' : '添加图片供应商');
const vendorSyncButtonLabel = computed(() => ({
  idle: 'Sync now',
  loading: 'Syncing',
  success: 'Synced',
  error: 'Retry sync'
}[vendorSyncState.value]));

function cloneVendor(vendor?: ApiVendor) {
  return createApiVendor({
    ...vendor,
    models: vendor?.models.map((model) => ({ ...model })) ?? []
  });
}

function submitSettings() {
  emit('save', normalizeAppSettings(draft.value));
}

defineExpose({
  submitSettings
});

function setModulePreview(moduleId: ImageModuleId, imageUrl: string) {
  if (moduleId === 'openai') {
    draft.value = normalizeAppSettings({
      ...draft.value,
      imageOpenAi: {
        ...draft.value.imageOpenAi,
        lastImageUrl: imageUrl
      }
    });
    return;
  }

  if (moduleId === 'novelai') {
    draft.value = normalizeAppSettings({
      ...draft.value,
      imageNovelAi: {
        ...draft.value.imageNovelAi,
        lastImageUrl: imageUrl
      }
    });
    return;
  }

  draft.value = normalizeAppSettings({
    ...draft.value,
    imagePollinations: {
      ...draft.value.imagePollinations,
      lastImageUrl: imageUrl
    }
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '图片请求失败，请稍后再试。';
}

async function triggerPreview(moduleId: ImageModuleId) {
  previewState[moduleId] = 'loading';
  moduleFeedback[moduleId] = '';

  try {
    const result = moduleId === 'openai'
      ? await generateOpenAiImage(draft.value)
      : moduleId === 'novelai'
        ? await generateNovelAiImage(draft.value)
        : await generatePollinationsImage(draft.value);

    setModulePreview(moduleId, result.imageUrl);
    previewState[moduleId] = 'success';
    moduleFeedback[moduleId] = '预览已更新，保存后会同步到本地设置。';
  } catch (error) {
    previewState[moduleId] = 'error';
    moduleFeedback[moduleId] = getErrorMessage(error);
  }
}

function openVendorCreator() {
  editingVendorId.value = null;
  vendorDraft.value = cloneVendor(createApiVendor({
    enabled: true,
    name: 'OpenAI Images',
    apiUrl: 'https://api.openai.com/v1',
    apiPath: '/images/generations'
  }));
  activeVendorTab.value = 'provider';
  vendorSyncState.value = 'idle';
  showVendorComposer.value = true;
}

function openVendorEditor(vendor: ApiVendor) {
  editingVendorId.value = vendor.id;
  vendorDraft.value = cloneVendor(vendor);
  activeVendorTab.value = 'provider';
  vendorSyncState.value = 'idle';
  showVendorComposer.value = true;
}

async function pullVendorModels() {
  vendorSyncState.value = 'loading';
  try {
    const modelIds = await fetchVendorModels(vendorDraft.value);
    vendorDraft.value = mergeVendorModels(vendorDraft.value, modelIds);
    vendorSyncState.value = 'success';
    activeVendorTab.value = 'models';
  } catch {
    vendorSyncState.value = 'error';
  }
}

function selectVendorModel(modelId: string) {
  vendorDraft.value = {
    ...vendorDraft.value,
    models: vendorDraft.value.models.map((model) => ({
      ...model,
      selected: model.id === modelId
    }))
  };
}

async function readVendorAvatar(event: Event) {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  avatarEditorSource.value = image;
  showAvatarEditor.value = true;
}

function applyEditedVendorAvatar(value: string) {
  vendorDraft.value = {
    ...vendorDraft.value,
    avatar: value
  };
}

function imageVendorModelSummary(vendor: ApiVendor) {
  const selected = vendor.models.find((model) => model.selected);
  if (selected) return selected.nickname || selected.id;
  if (vendor.models[0]) return `${vendor.models.length} models`;
  return '尚未同步模型';
}

function saveVendor() {
  const cleanedModels = vendorDraft.value.models
    .map((model): ApiVendorModel => ({
      id: model.id.trim(),
      nickname: model.nickname.trim(),
      selected: model.selected
    }))
    .filter((model) => model.id);

  const nextVendor = createApiVendor({
    ...vendorDraft.value,
    name: vendorDraft.value.name.trim() || 'OpenAI Images',
    avatar: vendorDraft.value.avatar.trim(),
    apiUrl: vendorDraft.value.apiUrl.trim() || 'https://api.openai.com/v1',
    apiPath: vendorDraft.value.apiPath.trim() || '/images/generations',
    models: cleanedModels.length
      ? cleanedModels.map((model, index) => ({
        ...model,
        selected: cleanedModels.some((item) => item.selected)
          ? model.selected
          : index === 0
      }))
      : []
  });

  const remainingVendors = draft.value.imageOpenAi.vendors.filter((vendor) => vendor.id !== nextVendor.id);
  const nextVendors = [nextVendor, ...remainingVendors];
  const nextActiveVendorId = draft.value.imageOpenAi.activeVendorId && draft.value.imageOpenAi.activeVendorId !== nextVendor.id
    ? draft.value.imageOpenAi.activeVendorId
    : nextVendor.id;

  draft.value = normalizeAppSettings({
    ...draft.value,
    imageOpenAi: {
      ...draft.value.imageOpenAi,
      activeVendorId: nextActiveVendorId,
      vendors: nextVendors
    }
  });
  showVendorComposer.value = false;
}

function removeVendor() {
  if (!editingVendorId.value) return;

  const nextVendors = draft.value.imageOpenAi.vendors.filter((vendor) => vendor.id !== editingVendorId.value);
  const nextActiveVendorId = draft.value.imageOpenAi.activeVendorId === editingVendorId.value
    ? nextVendors[0]?.id || ''
    : draft.value.imageOpenAi.activeVendorId;

  draft.value = normalizeAppSettings({
    ...draft.value,
    imageOpenAi: {
      ...draft.value.imageOpenAi,
      activeVendorId: nextActiveVendorId,
      vendors: nextVendors
    }
  });
  showVendorComposer.value = false;
}
</script>

<style scoped>
.image-module-configurator,
.composer-shell,
.provider-composer,
.composer-section,
.form-grid {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.provider-composer {
  min-height: 0;
  padding-bottom: calc(74px + var(--safe-bottom));
}

.composer-hero,
.preview-card,
.empty-shell {
  position: relative;
  overflow: hidden;
}

.composer-hero {
  display: grid;
  gap: 9px;
  padding: 13px;
  border-radius: 22px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  background:
    radial-gradient(circle at top right, rgba(255, 209, 224, 0.65), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.94));
  box-shadow: 0 12px 28px rgba(24, 28, 34, 0.06);
}

.composer-hero-novelai {
  background:
    radial-gradient(circle at top left, rgba(244, 221, 198, 0.72), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(249, 246, 242, 0.94));
}

.composer-hero-pollinations {
  background:
    radial-gradient(circle at top right, rgba(215, 231, 255, 0.78), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 249, 255, 0.94));
}

.provider-hero {
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
}

.section-kicker,
.composer-hero span,
.sync-copy span {
  margin: 0;
  color: #9d7a86;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.composer-hero strong,
.section-head h3,
.preview-copy h3 {
  margin: 0;
  color: #231f25;
  font-family: 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', 'Songti SC', serif;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 800;
}

.composer-hero strong {
  display: block;
  margin-top: 4px;
  font-size: 17px;
  line-height: 1.18;
  font-weight: 600;
}

.composer-hero p,
.field-hint,
.provider-copy p,
.provider-meta small,
.empty-shell p,
.module-feedback,
.toggle-card small {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.module-feedback.error {
  color: #cf425a;
}

.module-feedback.success {
  color: #26774e;
}

.hero-generate,
.section-action,
.sync-button,
.footer-button {
  min-height: 34px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.hero-generate {
  width: 100%;
  background: rgba(243, 244, 245, 0.9);
}

.section-head,
.sync-shell,
.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.section-action {
  flex: 0 0 auto;
  background: rgba(243, 244, 245, 0.92);
}

.provider-list,
.model-grid,
.toggle-grid,
.field-grid,
.preview-card,
.provider-copy,
.provider-meta,
.preview-copy,
.sync-copy,
.toggle-card div {
  display: grid;
}

.provider-list,
.model-grid,
.toggle-grid,
.field-grid,
.preview-card {
  gap: 10px;
}

.provider-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 11px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  text-align: left;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.04);
}

.provider-card.active {
  box-shadow: 0 0 0 1.5px rgba(255, 188, 210, 0.88), 0 18px 34px rgba(42, 35, 44, 0.08);
}

.provider-avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  object-fit: cover;
  background: var(--soft);
}

.provider-copy strong {
  color: #231f25;
  font-size: 13px;
  font-weight: 800;
}

.provider-meta {
  grid-column: 2;
  justify-items: start;
  gap: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 900;
}

.status-pill.enabled {
  background: rgba(231, 248, 236, 0.96);
  color: #138046;
}

.status-pill.disabled {
  background: rgba(241, 243, 246, 0.96);
  color: #79808a;
}

.empty-shell,
.preview-card,
.sync-shell,
.model-option,
.toggle-card,
.vendor-avatar-upload {
  padding: 11px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.035);
}

.empty-shell strong {
  color: #232529;
  font-size: 13px;
}

.field {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.field > span {
  color: #686d72;
  font-size: 11px;
  font-weight: 800;
}

.field input,
.field select,
.field textarea {
  min-height: 34px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(243, 244, 245, 0.9);
  color: #17191d;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.035);
}

.field textarea {
  min-height: 104px;
  resize: vertical;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #9b9fa5;
}

.field:focus-within > span {
  color: #16643e;
}

.field:focus-within input,
.field:focus-within select,
.field:focus-within textarea {
  background: #ffffff;
  box-shadow: 0 0 0 1.5px rgba(6, 199, 85, 0.18), 0 12px 24px rgba(27, 81, 52, 0.08);
}

.toggle-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.vendor-avatar-upload {
  display: grid;
  gap: 4px;
  min-height: 58px;
}

.vendor-avatar-upload input {
  display: none;
}

.vendor-avatar-upload strong {
  color: #232529;
  font-size: 13px;
  font-weight: 800;
}

.vendor-avatar-upload small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-indicator {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border: 1.5px solid rgba(146, 150, 158, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.toggle-input:checked + .toggle-indicator {
  border-color: transparent;
  background: linear-gradient(180deg, #1f2229, #3a3d48);
  box-shadow: 0 0 0 4px rgba(255, 219, 230, 0.58);
}

.toggle-card strong,
.sync-copy strong,
.model-option strong {
  color: #232529;
  font-size: 13px;
  font-weight: 800;
}

.sync-button {
  min-width: 98px;
  background: linear-gradient(180deg, #111111, #2c2f39);
  color: #ffffff;
}

.model-option {
  display: grid;
  gap: 6px;
  border: 1px solid transparent;
  text-align: left;
}

.model-option.active {
  border-color: rgba(255, 188, 210, 0.88);
  box-shadow: 0 10px 26px rgba(34, 25, 39, 0.08);
}

.model-option span {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.preview-image,
.preview-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 240px;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  color: rgba(41, 35, 42, 0.74);
  font-family: 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', 'Songti SC', serif;
  font-size: 18px;
  letter-spacing: 0.08em;
  overflow: hidden;
}

.preview-image {
  object-fit: cover;
}

.placeholder-openai {
  background:
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.84), transparent 24%),
    linear-gradient(135deg, #fff8fb, #f1f6fb 55%, #eef1f8);
}

.placeholder-novelai {
  background:
    radial-gradient(circle at top left, rgba(244, 221, 198, 0.82), transparent 24%),
    linear-gradient(135deg, #fff7f0, #f6efe8 56%, #eee8e2);
}

.placeholder-pollinations {
  background:
    radial-gradient(circle at top, rgba(215, 231, 255, 0.86), transparent 24%),
    linear-gradient(135deg, #f8fbff, #edf2fb 56%, #f4f0ff);
}

.composer-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.composer-tab {
  min-height: 34px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #6f7079;
  font-size: 11px;
  font-weight: 800;
}

.composer-tab.active {
  background: linear-gradient(180deg, #111111, #2c2f39);
  color: #ffffff;
}

.composer-footer {
  position: sticky;
  bottom: calc(-16px - var(--safe-bottom));
  z-index: 3;
  margin: 0 -16px calc(-16px - var(--safe-bottom));
  padding: 12px 16px calc(16px + var(--safe-bottom));
  background: linear-gradient(180deg, rgba(247, 249, 252, 0), rgba(247, 249, 252, 0.96) 28%, rgba(247, 249, 252, 0.99));
  backdrop-filter: blur(14px);
}

.footer-button {
  flex: 1 1 180px;
}

.footer-cancel {
  background: rgba(255, 255, 255, 0.88);
  color: #44424b;
}

.footer-save {
  background: linear-gradient(180deg, #111111, #2c2f39);
  color: #ffffff;
}

.footer-delete {
  background: rgba(255, 237, 240, 0.94);
  color: #c74259;
}

.compact-empty {
  padding: 16px;
}

@media (min-width: 520px) {
  .provider-card {
    grid-template-columns: 56px minmax(0, 1fr) auto;
  }

  .provider-avatar {
    width: 56px;
    height: 56px;
    border-radius: 20px;
  }

  .provider-meta {
    grid-column: auto;
    justify-items: end;
  }

  .field-grid.two-up,
  .toggle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-grid.three-up {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
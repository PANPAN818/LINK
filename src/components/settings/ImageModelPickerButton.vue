<template>
  <button class="image-model-button" type="button" :aria-label="buttonLabel" :title="buttonLabel" @click="showPicker = true">
    <ImagePlus :size="iconSize" stroke-width="2.2" />
    <span v-if="showLabel">{{ compactSelectedLabel }}</span>
  </button>

  <AppModal v-model="showPicker" title="生图模型" variant="ins">
    <section class="model-picker">
      <div class="picker-copy">
        <strong>{{ selectedModelLabel }}</strong>
        <span>{{ imageModelOptions.length ? '世界书封面和 VOOM 配图会使用当前模型。' : '配置生图模型后会在这里显示。' }}</span>
      </div>

      <div v-if="imageModelOptions.length" class="model-list">
        <button
          v-for="option in imageModelOptions"
          :key="option.key"
          class="model-option"
          :class="{ active: option.key === selectedModelKey }"
          type="button"
          @click="selectImageModel(option)"
        >
          <span class="model-provider">{{ option.providerLabel }}</span>
          <strong>{{ option.label }}</strong>
          <small>{{ option.detail }}</small>
        </button>
      </div>

      <section v-else class="picker-empty">
        <strong>暂无可切换模型</strong>
        <p>先在 Image 页面配置 OpenAI 图片供应商、NovelAI 或 Pollinations。没有可用配置时，VOOM 会显示文字描述卡片。</p>
      </section>
    </section>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ImagePlus } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { AppSettings } from '@/types/domain';
import { createImageModelKey, getConfiguredImageModelOptions, getSelectedImageModelOption, type ConfiguredImageModelOption } from '@/utils/settings';

withDefaults(defineProps<{
  showLabel?: boolean;
  iconSize?: number;
}>(), {
  showLabel: false,
  iconSize: 18
});

const store = useAppStore();
const showPicker = ref(false);

const imageModelOptions = computed(() => getConfiguredImageModelOptions(store.settings));
const selectedModel = computed(() => getSelectedImageModelOption(store.settings));
const selectedModelKey = computed(() => selectedModel.value?.key ?? '');
const selectedModelLabel = computed(() => selectedModel.value ? `${selectedModel.value.providerLabel} · ${selectedModel.value.label}` : '使用文字描述卡片');
const compactSelectedLabel = computed(() => selectedModel.value?.providerLabel ?? 'Image');
const buttonLabel = computed(() => selectedModel.value ? `切换生图模型：${selectedModelLabel.value}` : '切换生图模型');

async function selectImageModel(option: ConfiguredImageModelOption) {
  const settings = store.settings;
  if (!settings) return;

  const nextSettings: AppSettings = {
    ...settings,
    voomImageProvider: option.provider,
    voomImageModel: option.model
  };

  if (option.provider === 'openai') {
    const [vendorId] = option.model.split('::');
    nextSettings.imageOpenAi = {
      ...settings.imageOpenAi,
      activeVendorId: vendorId || settings.imageOpenAi.activeVendorId
    };
  } else if (option.provider === 'novelai') {
    nextSettings.imageNovelAi = {
      ...settings.imageNovelAi,
      model: option.model
    };
  } else {
    nextSettings.imagePollinations = {
      ...settings.imagePollinations,
      model: option.model
    };
  }

  await store.saveSettings(nextSettings);
  showPicker.value = false;
}
</script>

<style scoped>
.image-model-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 34px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #111111;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 900;
}

.image-model-button span {
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-picker,
.picker-copy,
.model-list {
  display: grid;
  gap: 14px;
}

.picker-copy {
  gap: 5px;
}

.picker-copy strong {
  color: #151515;
  font-size: 18px;
  font-weight: 900;
}

.picker-copy span,
.picker-empty p {
  margin: 0;
  color: #767b82;
  font-size: 12px;
  line-height: 1.45;
}

.model-option {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 4px 10px;
  width: 100%;
  min-height: 58px;
  padding: 10px 12px;
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
  grid-row: span 2;
  align-self: center;
  color: #12853f;
  font-size: 11px;
  font-weight: 900;
}

.model-option strong,
.model-option small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-option strong {
  font-size: 13px;
  font-weight: 900;
}

.model-option small {
  color: #858a91;
  font-size: 11px;
}

.picker-empty {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 8px;
  background: #ffffff;
}

.picker-empty strong {
  color: #171717;
  font-size: 14px;
}
</style>
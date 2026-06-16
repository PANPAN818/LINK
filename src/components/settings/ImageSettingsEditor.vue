<template>
  <ImageGeneratorConsole ref="imageConsoleRef" :settings="settings" @save="emit('save', $event)" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImageGeneratorConsole from '@/components/settings/ImageGeneratorConsole.vue';
import type { AppSettings } from '@/types/domain';

defineProps<{
  settings: AppSettings;
}>();

const emit = defineEmits<{
  save: [settings: AppSettings];
}>();

const imageConsoleRef = ref<InstanceType<typeof ImageGeneratorConsole> | null>(null);

function saveSettings() {
  imageConsoleRef.value?.submitSettings();
}

defineExpose({
  saveSettings
});
</script>
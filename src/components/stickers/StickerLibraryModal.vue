<template>
  <AppModal :model-value="modelValue" title="Stickers" :show-header="false" variant="ins" @update:model-value="emit('update:modelValue', $event)">
    <StickerLibraryPanel
      :conversation-id="conversationId"
      :show-toolbar-actions="false"
      show-manage-action
      presentation="modal"
      @close="close"
      @manage="openStickersPage"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppModal from '@/components/common/AppModal.vue';
import StickerLibraryPanel from '@/components/stickers/StickerLibraryPanel.vue';

defineProps<{
  modelValue: boolean;
  conversationId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const router = useRouter();

function close() {
  emit('update:modelValue', false);
}

function openStickersPage() {
  close();
  void router.push({ name: 'stickers' });
}
</script>

<template>
  <MobileShell />
  <FirstRunDisclaimer v-if="showDisclaimer" :model-value="showDisclaimer" @complete="handleDisclaimerComplete" />
  <AppModal v-model="store.configAlert.open" :title="store.configAlert.title">
    <section class="config-alert">
      <p>{{ store.configAlert.message }}</p>
    </section>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MobileShell from '@/components/layout/MobileShell.vue';
import AppModal from '@/components/common/AppModal.vue';
import FirstRunDisclaimer from '@/components/common/FirstRunDisclaimer.vue';
import { useAppStore } from '@/stores/appStore';

const store = useAppStore();

const showDisclaimer = computed(() => store.ready && !store.settings?.disclaimerAccepted);

async function handleDisclaimerComplete() {
  if (!store.settings) return;
  await store.saveSettings({
    ...store.settings,
    disclaimerAccepted: true
  });
}
</script>

<style scoped>
.config-alert p {
  margin: 0;
  color: #363a40;
  font-size: 14px;
  line-height: 1.6;
}
</style>
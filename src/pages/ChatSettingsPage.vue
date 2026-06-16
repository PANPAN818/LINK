<template>
  <section v-if="conversation && character" class="screen no-tabs chat-settings-page">
    <header class="top-bar chat-settings-topbar">
      <button class="chat-settings-title-button" type="button" aria-label="返回聊天" @click="goBack">
        <h1 class="top-title">Chat Settings</h1>
      </button>
    </header>

    <main class="chat-settings-main">
      <section class="chat-settings-panel">
        <ChatControlPanel :conversation-id="props.id" :character="character" :active-tab="activeTab" />
      </section>
    </main>

    <nav class="chat-settings-tabs" aria-label="Chat settings tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="chat-settings-tab"
        :class="{ active: activeTab === tab.id }"
        type="button"
        @pointerup="openTab(tab.id)"
        @click="openTab(tab.id)"
      >
        <component :is="tab.icon" :size="20" stroke-width="2.1" />
        <span>{{ tab.shortLabel }}</span>
      </button>
    </nav>
  </section>
  <section v-else class="screen no-tabs empty-state">会话不存在</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BookOpenText, Palette, Settings2, UserRound } from 'lucide-vue-next';
import ChatControlPanel, { type PanelTab } from '@/components/chat/ChatControlPanel.vue';
import { useAppStore } from '@/stores/appStore';

const tabs = [
  { id: 'memory' as PanelTab, shortLabel: 'Memory', icon: BookOpenText },
  { id: 'beauty' as PanelTab, shortLabel: 'Beauty', icon: Palette },
  { id: 'profile' as PanelTab, shortLabel: 'Profile', icon: UserRound },
  { id: 'other' as PanelTab, shortLabel: 'More', icon: Settings2 }
] as const;

const props = defineProps<{
  id: string;
}>();

const route = useRoute();
const router = useRouter();
const store = useAppStore();
const activeTab = ref<PanelTab>('memory');

const conversation = computed(() => store.conversationById(props.id));
const character = computed(() => (conversation.value ? store.characterById(conversation.value.charId) : undefined));
const isOfflineSettings = computed(() => route.name === 'offline-chat-settings');

onMounted(() => {
  void store.hydrate();
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: isOfflineSettings.value ? 'offline-room' : 'chat-room', params: { id: props.id } });
}

function openTab(tab: PanelTab) {
  activeTab.value = tab;
}
</script>

<style scoped>
.chat-settings-page {
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 218, 227, 0.42), transparent 30%),
    radial-gradient(circle at 96% 4%, rgba(6, 199, 85, 0.16), transparent 26%),
    linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 54%, #edf3f1 100%);
}

.chat-settings-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: rgba(251, 252, 251, 0.82);
  backdrop-filter: blur(20px);
}

.chat-settings-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  color: inherit;
}

.chat-settings-title-button .top-title {
  margin: 0;
  text-align: left;
}

.chat-settings-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 12px calc(14px + var(--safe-right)) 18px calc(14px + var(--safe-left));
}

.chat-settings-panel {
  display: grid;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 12px;
}

.chat-settings-tabs {
  position: relative;
  z-index: 20;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(17, 17, 17, 0.05);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
}

.chat-settings-tab {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-height: 48px;
  padding: 6px 4px;
  border-radius: 14px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  touch-action: manipulation;
}

.chat-settings-tab.active {
  background: #eef8f1;
  color: #111111;
}

.chat-settings-tab svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 420px) {
  .chat-settings-main {
    padding-inline: 12px;
  }
}
</style>
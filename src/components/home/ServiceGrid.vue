<template>
  <section>
    <div class="section-heading">
      <span>Services</span>
      <button class="see-all" type="button" @click="openAll">See all</button>
    </div>
    <div class="service-grid">
      <button v-for="service in services" :key="service.label" type="button" class="service-item" @click="service.action?.()">
        <component :is="service.icon" :size="32" stroke-width="2" />
        <span>{{ service.label }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BookMarked, Gamepad2, Palette, Smile } from 'lucide-vue-next';

const props = defineProps<{
  openStickers: () => void;
  openWorldBooks: () => void;
  openAll: () => void;
}>();

const { openStickers, openWorldBooks, openAll } = props;

const services = [
  { label: 'Stickers', icon: Smile, action: openStickers },
  { label: 'Themes', icon: Palette },
  { label: 'World Book', icon: BookMarked, action: openWorldBooks },
  { label: 'LINK GAME', icon: Gamepad2 }
];
</script>

<style scoped>
.see-all {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.see-all:active {
  opacity: 0.72;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 4px 12px 20px;
}

.service-item {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-height: 64px;
  color: #171717;
  font-size: 11px;
  font-weight: 700;
}

.service-item svg {
  width: 27px;
  height: 27px;
}

.service-item span {
  max-width: 70px;
  overflow-wrap: anywhere;
}
</style>
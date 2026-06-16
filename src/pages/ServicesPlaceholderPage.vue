<template>
  <section class="screen no-tabs services-placeholder-page">
    <header class="top-bar services-topbar">
      <button class="services-title-button" type="button" aria-label="返回主页" @click="goHome">
        <h1 class="top-title">Services</h1>
      </button>
      <div class="services-head-spacer"></div>
    </header>

    <main class="services-content" aria-label="Services placeholder"></main>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  void router.push({ name: 'home' });
}
</script>

<style scoped>
.services-placeholder-page {
  background:
    radial-gradient(circle at top left, rgba(255, 217, 228, 0.72), transparent 30%),
    linear-gradient(180deg, #fff9fa, #f5f7fb 58%, #eef5ef);
}

.services-content {
  min-height: calc(var(--app-height) - 72px);
  padding: 14px 16px 28px;
}

.services-title-button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 0;
  color: inherit;
}

.services-title-button .top-title {
  margin: 0;
  text-align: left;
}

.services-head-spacer {
  width: 24px;
  height: 24px;
}
</style>

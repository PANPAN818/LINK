<template>
  <section class="screen utility-page">
    <header class="top-bar">
      <h1 class="top-title">Music</h1>
      <button class="icon-button" type="button" aria-label="搜索">
        <Search :size="24" />
      </button>
    </header>
    <main class="utility-content">
      <Music2 :size="42" />
      <h2>LINK音乐</h2>
      <p>这里预留给音乐在线搜索等。</p>
    </main>
  </section>
</template>

<script setup lang="ts">
import { Music2, Search } from 'lucide-vue-next';
</script>

<style scoped>
.utility-content {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  min-height: 50vh;
  padding: 20px;
  color: #4d5157;
  text-align: center;
}

.utility-content svg {
  width: 36px;
  height: 36px;
}

h2,
p {
  margin: 0;
}

p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>
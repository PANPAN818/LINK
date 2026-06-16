<template>
  <section class="screen utility-page">
    <header class="top-bar">
      <h1 class="top-title">Fanfic</h1>
      <button class="icon-button" type="button" aria-label="新建">
        <Plus :size="24" />
      </button>
    </header>
    <main class="utility-content">
      <BookOpenText :size="42" />
      <h2>同人文</h2>
      <p>这里预留给同人文的小说集结地。</p>
    </main>
  </section>
</template>

<script setup lang="ts">
import { BookOpenText, Plus } from 'lucide-vue-next';
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
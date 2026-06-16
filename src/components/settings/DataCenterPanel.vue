<template>
  <section class="data-center">
    <div class="data-grid">
      <article class="data-card">
        <strong>{{ userId }}</strong>
        <span>当前用户 ID</span>
      </article>
      <article class="data-card">
        <strong>{{ characterCount }}</strong>
        <span>好友角色</span>
      </article>
      <article class="data-card">
        <strong>{{ conversationCount }}</strong>
        <span>会话线程</span>
      </article>
      <article class="data-card">
        <strong>{{ messageCount }}</strong>
        <span>消息总数</span>
      </article>
      <article class="data-card">
        <strong>{{ worldBookCount }}</strong>
        <span>世界书条目</span>
      </article>
      <article class="data-card">
        <strong>{{ voomCount }}</strong>
        <span>VOOM 动态</span>
      </article>
    </div>

    <div class="data-note">
      <h3>本地存储</h3>
      <p>当前项目通过 IndexedDB 持久化用户资料、角色、会话、VOOM、世界书与设置。设置页中的改动会写入 settings/main。</p>
      <p>如果需要彻底重置数据，请清理当前站点存储后重新打开应用。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  userId: string;
  characterCount: number;
  conversationCount: number;
  messageCount: number;
  worldBookCount: number;
  voomCount: number;
}>();

</script>

<style scoped>
.data-center {
  display: grid;
  gap: 14px;
}

.toggle-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdfd, #f5f7fa);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.toggle-card input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.toggle-card div {
  display: grid;
  gap: 4px;
}

.toggle-card strong {
  font-size: 14px;
}

.toggle-card span {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.data-card,
.data-note {
  padding: 14px;
  border-radius: 14px;
  background: var(--soft);
}

.data-card {
  display: grid;
  gap: 6px;
}

.data-card strong {
  font-size: 19px;
  line-height: 1;
}

.data-card span,
.data-note p {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.data-note h3,
.data-note p {
  margin: 0;
}

.data-note {
  display: grid;
  gap: 8px;
}
</style>
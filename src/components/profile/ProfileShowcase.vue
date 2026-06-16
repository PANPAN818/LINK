<template>
  <section class="profile-showcase">
    <button class="identity-button" type="button" aria-label="返回主页" @click="emit('back')">
      <span class="archive-pill">{{ profile.archiveLabel }}</span>
      <strong class="identity-title">{{ profile.nickname }}</strong>
      <span class="handle-line">@{{ displayHandle }} <i>•</i> {{ profile.mood }}</span>
    </button>

    <section class="profile-card">
      <div class="card-topline">
        <img class="showcase-avatar" :src="profile.avatar" :alt="profile.nickname" />
        <div class="card-side">
          <div class="stats-row">
            <div>
              <strong>{{ profile.stats.posts }}</strong>
              <span>{{ profile.stats.postsLabel }}</span>
            </div>
            <div>
              <strong>{{ profile.stats.followers }}</strong>
              <span>{{ profile.stats.followersLabel }}</span>
            </div>
            <div>
              <strong>{{ profile.stats.following }}</strong>
              <span>{{ profile.stats.followingLabel }}</span>
            </div>
          </div>

          <div class="actions-row" aria-hidden="true">
            <button class="message-action" type="button" tabindex="-1">
              <MessageCircle :size="18" />
              <span>{{ profile.messageLabel }}</span>
            </button>
            <button class="heart-action" type="button" tabindex="-1">
              <Heart :size="21" />
            </button>
          </div>
        </div>
      </div>

      <p class="profile-bio">{{ profile.bio }}</p>
      <p class="profile-location"><MapPin :size="16" /> {{ profile.location }}</p>
      <div class="tag-row">
        <span v-for="tag in profile.tags" :key="tag">#{{ tag }}</span>
      </div>
    </section>

    <div v-if="profile.highlights.length" class="highlight-row">
      <figure v-for="highlight in profile.highlights" :key="highlight.id">
        <img :src="highlight.image || profile.avatar" :alt="highlight.title" />
        <figcaption>{{ highlight.title }}</figcaption>
      </figure>
    </div>

    <div v-if="profile.chips.length" class="chip-row">
      <span v-for="chip in profile.chips" :key="`chip-${chip}`">{{ chip }}</span>
    </div>

    <div v-if="profile.links.length" class="link-list">
      <div v-for="link in profile.links" :key="link.id" class="profile-link-row">
        <LinkIcon :size="19" />
        <strong>{{ link.label }}</strong>
        <span v-if="link.url">{{ readableUrl(link.url) }}</span>
      </div>
    </div>

    <section v-if="profile.moments.length" class="moments-section">
      <h2><Grid3X3 :size="19" /> {{ profile.momentsLabel }}</h2>
      <div class="moment-grid">
        <article v-for="moment in profile.moments" :key="moment.id" class="moment-tile">
          <img v-if="moment.image" :src="moment.image" :alt="moment.title" />
          <span>{{ moment.title }}</span>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Grid3X3, Heart, Link as LinkIcon, MapPin, MessageCircle } from 'lucide-vue-next';
import type { VisualProfile } from '@/types/domain';

const props = defineProps<{
  profile: VisualProfile;
  userId: string;
}>();

const emit = defineEmits<{
  back: [];
}>();

const displayHandle = computed(() => props.profile.handle.replace(/^@/, '') || props.userId);

function readableUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
</script>

<style scoped>
.profile-showcase {
  container-type: inline-size;
  color: #ffffff;
}

.identity-button {
  display: grid;
  justify-items: start;
  max-width: 100%;
  padding: 0;
  color: #ffffff;
  text-align: left;
}

.identity-button:active {
  opacity: 0.78;
}

.archive-pill {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 15px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.identity-title {
  display: block;
  margin: 15px 0 0;
  font-size: 44px;
  line-height: 0.9;
  font-weight: 900;
}

.handle-line {
  display: block;
  margin: 0 0 15px;
  font-size: 14px;
  font-weight: 850;
}

.handle-line i {
  margin: 0 6px;
  font-style: normal;
}

.profile-card,
.profile-link-row,
.moment-tile {
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 8px;
  background: linear-gradient(96deg, rgba(238, 238, 238, 0.92), rgba(246, 246, 246, 0.84));
  color: #252323;
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(20px);
}

.profile-card {
  padding: 15px 15px 16px;
}

.card-topline {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.showcase-avatar {
  width: 78px;
  height: 78px;
  flex: 0 0 auto;
  border: 4px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.15);
}

.card-side {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  text-align: center;
}

.stats-row strong {
  display: block;
  font-size: 19px;
  line-height: 1;
  font-weight: 900;
}

.stats-row span {
  display: block;
  margin-top: 5px;
  color: #6f6f6f;
  font-size: 8px;
  font-weight: 850;
  text-transform: uppercase;
}

.actions-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 8px;
  margin-top: 0;
  margin-left: 0;
}

.message-action,
.heart-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border-radius: 8px;
  font-weight: 900;
}

.message-action {
  gap: 6px;
  background: var(--profile-accent, #f49ab5);
  color: #ffffff;
  font-size: 14px;
}

.heart-action {
  border: 1px solid #898989;
  background: rgba(255, 255, 255, 0.22);
}

.profile-bio {
  margin: 17px 0 11px;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 900;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  color: #707070;
  font-size: 12px;
  font-weight: 850;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  font-weight: 900;
}

.highlight-row {
  display: flex;
  gap: 14px;
  margin: 16px 0 13px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.highlight-row figure {
  flex: 0 0 60px;
  margin: 0;
  text-align: center;
}

.highlight-row img {
  width: 60px;
  height: 60px;
  border: 2px solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.highlight-row figcaption {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 13px;
}

.chip-row span {
  min-height: 32px;
  padding: 6px 13px 4px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-bottom: 3px solid var(--profile-accent, #f49ab5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
  font-weight: 850;
}

.chip-row span:nth-child(3n + 2) {
  border-bottom-color: #b6d7a8;
}

.chip-row span:nth-child(3n + 3) {
  border-bottom-color: #f7d66d;
}

.link-list {
  display: grid;
  gap: 8px;
}

.profile-link-row {
  display: grid;
  grid-template-columns: 21px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 15px;
}

.profile-link-row strong,
.profile-link-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-link-row strong {
  font-size: 15px;
  font-weight: 900;
}

.profile-link-row span {
  max-width: 150px;
  color: #6e6e6e;
  font-size: 12px;
  font-weight: 850;
}

.moments-section {
  margin-top: 16px;
}

.moments-section h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 11px;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.moment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.moment-tile {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(172, 145, 151, 0.9);
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.moment-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moment-tile span {
  position: relative;
  z-index: 1;
  max-width: 85%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

@container (min-width: 560px) {
  .archive-pill {
    min-height: 42px;
    padding: 0 17px;
    font-size: 13px;
  }

  .identity-title {
    margin: 24px 0 3px;
    font-size: 56px;
    line-height: 0.86;
  }

  .handle-line {
    margin-bottom: 22px;
    font-size: 16px;
  }

  .profile-card {
    padding: 22px 22px 24px;
  }

  .card-topline {
    grid-template-columns: 126px minmax(0, 1fr);
    gap: 24px;
  }

  .card-side {
    gap: 11px;
  }

  .showcase-avatar {
    width: 126px;
    height: 126px;
  }

  .stats-row {
    gap: 12px;
  }

  .stats-row strong {
    font-size: 25px;
  }

  .stats-row span {
    margin-top: 7px;
    font-size: 11px;
  }

  .actions-row {
    grid-template-columns: minmax(0, 1fr) 50px;
    gap: 10px;
    margin-top: 0;
    margin-left: 0;
  }

  .message-action,
  .heart-action {
    min-height: 50px;
  }

  .profile-bio {
    margin: 28px 0 18px;
    font-size: 18px;
  }

  .profile-location {
    margin-bottom: 22px;
    font-size: 14px;
  }

  .tag-row {
    gap: 26px;
    font-size: 14px;
  }

  .highlight-row {
    gap: 26px;
    margin-bottom: 26px;
  }

  .highlight-row figure {
    flex-basis: 76px;
  }

  .highlight-row img {
    width: 76px;
    height: 76px;
  }

  .highlight-row figcaption {
    margin-top: 8px;
    font-size: 14px;
  }

  .chip-row span {
    min-height: 40px;
    padding: 8px 17px 6px;
    font-size: 14px;
  }

  .profile-link-row strong {
    font-size: 18px;
  }

  .profile-link-row span {
    font-size: 14px;
  }

  .moments-section h2 {
    font-size: 18px;
  }

  .moment-tile {
    font-size: 14px;
  }
}

@media (max-width: 380px) {
  .archive-pill {
    min-height: 34px;
    padding: 0 12px;
    font-size: 11px;
    letter-spacing: 2px;
  }

  .identity-title {
    margin-top: 14px;
    font-size: 38px;
  }

  .handle-line {
    margin-bottom: 14px;
    font-size: 13px;
  }

  .profile-card {
    padding: 14px 12px 15px;
  }

  .card-topline {
    grid-template-columns: 66px minmax(0, 1fr);
    gap: 9px;
  }

  .showcase-avatar {
    width: 66px;
    height: 66px;
  }

  .stats-row {
    gap: 4px;
  }

  .stats-row strong {
    font-size: 16px;
  }

  .stats-row span {
    margin-top: 5px;
    font-size: 8px;
  }

  .actions-row {
    grid-template-columns: minmax(0, 1fr) 38px;
    gap: 6px;
  }

  .message-action,
  .heart-action {
    min-height: 36px;
  }

  .message-action {
    font-size: 12px;
  }

  .profile-bio {
    margin: 15px 0 10px;
    font-size: 13px;
  }

  .profile-location,
  .tag-row,
  .chip-row span {
    font-size: 11px;
  }

  .highlight-row figure {
    flex-basis: 54px;
  }

  .highlight-row img {
    width: 54px;
    height: 54px;
  }

  .profile-link-row {
    min-height: 46px;
    padding: 0 12px;
  }

  .profile-link-row strong {
    font-size: 13px;
  }

  .profile-link-row span {
    max-width: 96px;
    font-size: 11px;
  }
}

@media (max-height: 720px) {
  .identity-title {
    margin-top: 13px;
    font-size: 40px;
  }

  .handle-line {
    margin-bottom: 18px;
  }

  .profile-card {
    padding-top: 16px;
    padding-bottom: 18px;
  }

  .highlight-row {
    margin-top: 18px;
    margin-bottom: 14px;
  }

  .chip-row {
    margin-bottom: 14px;
  }

  .profile-link-row {
    min-height: 54px;
  }

  .moments-section {
    margin-top: 18px;
  }
}
</style>
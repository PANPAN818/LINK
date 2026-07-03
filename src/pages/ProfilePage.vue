<template>
  <section class="screen no-tabs profile-page">
    <header class="top-bar profile-topbar">
      <button class="account-title-button" type="button" aria-label="返回主页" @click="goHome">
        <h1 class="top-title">Account</h1>
      </button>
      <div class="profile-top-actions">
        <button
          class="friends-scope-switch"
          :class="{ all: showAllFriends }"
          type="button"
          :aria-label="showAllFriends ? 'Friends 显示所有账号绑定角色' : 'Friends 仅显示当前账号绑定角色'"
          :aria-pressed="showAllFriends"
          @click="toggleFriendsDisplayScope"
        >
          <span>Mine</span>
          <span>All</span>
        </button>
        <button class="icon-button" type="button" aria-label="新建账号" @click="createAccount">
          <Plus :size="24" />
        </button>
      </div>
    </header>

    <main class="profile-content">
      <AccountManagerPanel
        ref="accountManagerRef"
        :accounts="store.accounts"
        :active-user-id="store.user?.id || ''"
        :characters="store.characters"
        @save="saveAccount"
        @switch="switchAccount"
        @delete="deleteAccount"
        @move-character="moveCharacter"
      />
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import AccountManagerPanel from '@/components/profile/AccountManagerPanel.vue';
import { useAppStore } from '@/stores/appStore';
import type { UserProfile } from '@/types/domain';

const store = useAppStore();
const router = useRouter();
const accountManagerRef = ref<InstanceType<typeof AccountManagerPanel> | null>(null);
const showAllFriends = computed(() => store.settings?.friendsDisplayScope === 'all-users');

function goHome() {
  void router.push({ name: 'home' });
}

async function saveAccount(account: UserProfile) {
  await store.saveAccountProfile(account);
}

async function switchAccount(userId: string) {
  await store.setActiveUser(userId);
}

async function deleteAccount(userId: string) {
  await store.deleteUserProfile(userId);
}

async function moveCharacter(payload: { characterId: string; userId: string }) {
  const character = store.characterById(payload.characterId);
  if (!character || character.boundUserId === payload.userId) return;
  await store.saveCharacter({
    ...character,
    boundUserId: payload.userId
  });
}

function createAccount() {
  accountManagerRef.value?.createAccount();
}

async function toggleFriendsDisplayScope() {
  if (!store.settings) return;
  await store.saveSettings({
    ...store.settings,
    friendsDisplayScope: showAllFriends.value ? 'active-user' : 'all-users'
  });
}
</script>

<style scoped>
.profile-page {
  background:
    radial-gradient(circle at top left, rgba(255, 217, 228, 0.72), transparent 30%),
    linear-gradient(180deg, #fff9fa, #f5f7fb 58%, #eef5ef);
}

.profile-content {
  padding: 14px 16px 28px;
}

.account-title-button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 0;
  color: inherit;
}

.account-title-button .top-title {
  margin: 0;
  text-align: left;
}

.profile-top-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.friends-scope-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  width: 82px;
  height: 30px;
  padding: 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: #7d8087;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.friends-scope-switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(17, 17, 17, 0.12);
  transition: transform 0.18s ease;
}

.friends-scope-switch.all::before {
  transform: translateX(100%);
}

.friends-scope-switch span {
  position: relative;
  z-index: 1;
  text-align: center;
}

.friends-scope-switch:not(.all) span:first-child,
.friends-scope-switch.all span:last-child {
  color: #111111;
}
</style>

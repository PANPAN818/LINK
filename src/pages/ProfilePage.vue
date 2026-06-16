<template>
  <section class="screen no-tabs profile-page">
    <header class="top-bar profile-topbar">
      <button class="account-title-button" type="button" aria-label="返回主页" @click="goHome">
        <h1 class="top-title">Account</h1>
      </button>
      <button class="icon-button" type="button" aria-label="新建账号" @click="createAccount">
        <Plus :size="24" />
      </button>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import AccountManagerPanel from '@/components/profile/AccountManagerPanel.vue';
import { useAppStore } from '@/stores/appStore';
import type { UserProfile } from '@/types/domain';

const store = useAppStore();
const router = useRouter();
const accountManagerRef = ref<InstanceType<typeof AccountManagerPanel> | null>(null);

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
</style>

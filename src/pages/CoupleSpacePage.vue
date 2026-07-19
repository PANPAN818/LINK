<template>
  <section v-if="conversation && character" class="screen no-tabs couple-page">
    <header class="top-bar couple-topbar">
      <button class="back-button" type="button" aria-label="返回聊天" @click="goBack">
        <ArrowLeft :size="21" />
      </button>
      <div class="top-title-copy">
        <strong>恋人守护</strong>
      </div>
      <button class="top-action" type="button" :disabled="syncing || !state?.consentGrantedAt" aria-label="同步角色状态" @click="syncNow">
        <LoaderCircle v-if="syncing" class="spin" :size="19" />
        <RefreshCw v-else :size="19" />
      </button>
    </header>

    <main class="couple-main">
      <section class="bond-hero">
        <div class="avatar-pair" aria-label="情侣头像">
          <img :src="currentUser?.avatar || '/avatar.svg'" :alt="currentUser?.nickname || '我'" />
          <span><Heart :size="15" fill="currentColor" /></span>
          <img :src="character.avatar" :alt="characterName" />
        </div>
        <div class="bond-title">
          <span>{{ relationshipDaysText }}</span>
          <strong>{{ currentUserName }} <em>&</em> {{ characterName }}</strong>
          <small>{{ state?.relationshipLabel || '恋人' }} · {{ snapshot ? `刚刚同步于 ${formatClock(snapshot.generatedAt)}` : '等待第一次心动同步' }}</small>
        </div>
        <button v-if="state?.consentGrantedAt" class="hero-settings" type="button" aria-label="情侣空间设置" @click="openSettings">
          <Settings2 :size="17" />
        </button>
      </section>

      <section v-if="!state?.consentGrantedAt" class="consent-card">
        <span class="consent-icon"><ShieldCheck :size="30" /></span>
        <p class="section-kicker">Mutual Sharing</p>
        <h1>把关心变成彼此允许的事</h1>
        <p>开启后，API 会依据角色设定、聊天记忆与当前时间生成共享位置、手机报告和生活轨迹。它不会读取真实 GPS、解锁记录或后台应用。</p>
        <ul>
          <li><MapPinned :size="17" /><span>角色生活路线、停留和预计到达</span></li>
          <li><Smartphone :size="17" /><span>角色主动分享的电量与使用状态</span></li>
          <li><Heart :size="17" /><span>只服务于这段关系的陪伴与惊喜</span></li>
        </ul>
        <label class="consent-check">
          <input v-model="consentChecked" type="checkbox" />
          <span>我理解这是角色互动模拟，并确认双方自愿共享</span>
        </label>
        <button class="primary-button" type="button" :disabled="!consentChecked" @click="enableCoupleSpace">一起开启</button>
      </section>

      <template v-else>
        <section v-if="!displaySnapshot" class="first-sync-card">
          <span><Radio :size="31" /></span>
          <h2>连接已经建立</h2>
          <p>第一次同步会让角色根据最近生活与关系进度，分享此刻的位置、手机状态和今天的小片段。</p>
          <button class="primary-button" type="button" :disabled="syncing" @click="syncNow">
            <LoaderCircle v-if="syncing" class="spin" :size="18" />
            <Sparkles v-else :size="18" />
            {{ syncing ? '正在靠近角色的世界…' : '同步此刻状态' }}
          </button>
        </section>

        <template v-else>
          <section v-if="activeTab === 'home'" class="tab-content overview-tab">
            <button class="mini-map-card" type="button" @click="activeTab = 'map'">
              <span class="map-canvas" aria-hidden="true">
                <span class="map-road road-one"></span>
                <span class="map-road road-two"></span>
                <span class="map-road road-three"></span>
                <span class="map-water"></span>
                <span class="map-pin"><MapPin :size="19" fill="currentColor" /></span>
              </span>
              <span class="mini-map-copy">
                <small>NOW · {{ displaySnapshot.location.transport }}</small>
                <strong>{{ displaySnapshot.location.place }}</strong>
                <span>{{ displaySnapshot.location.status }}</span>
                <em><Navigation :size="13" /> {{ displaySnapshot.location.distance }}</em>
              </span>
              <ChevronRight :size="18" />
            </button>

            <section class="metric-grid">
              <article class="metric-card pink">
                <span class="metric-icon">{{ displaySnapshot.bond.moodEmoji }}</span>
                <small>此刻心情</small>
                <strong>{{ displaySnapshot.bond.mood }}</strong>
              </article>
              <article class="metric-card violet">
                <span class="metric-ring" :style="{ '--score': `${displaySnapshot.bond.missLevel * 3.6}deg` }"><i>{{ displaySnapshot.bond.missLevel }}</i></span>
                <small>想你浓度</small>
                <strong>{{ missLevelLabel }}</strong>
              </article>
              <article class="metric-card mint">
                <BatteryCharging v-if="displaySnapshot.device.charging" :size="22" />
                <BatteryMedium v-else :size="22" />
                <small>角色电量</small>
                <strong>{{ displaySnapshot.device.battery }}%</strong>
              </article>
              <article class="metric-card peach">
                <LockKeyhole :size="21" />
                <small>手机状态</small>
                <strong>{{ screenStatusLabel }}</strong>
              </article>
            </section>

            <section class="whisper-card">
              <span class="whisper-avatar"><img :src="character.avatar" alt="" /></span>
              <div>
                <small>{{ characterName }} 的悄悄话</small>
                <p>“{{ displaySnapshot.bond.whisper }}”</p>
              </div>
            </section>

            <section class="plan-card">
              <span><CalendarHeart :size="21" /></span>
              <div>
                <small>下一件想一起做的事</small>
                <strong>{{ displaySnapshot.bond.nextPlan }}</strong>
              </div>
              <span class="sync-score">{{ displaySnapshot.bond.syncScore }}% 默契</span>
            </section>
          </section>

          <section v-else-if="activeTab === 'map'" class="tab-content map-tab">
            <section class="location-hero-card">
              <div class="live-pill"><span></span>角色实时共享</div>
              <span class="location-orbit" aria-hidden="true"><i></i><b><MapPin :size="24" fill="currentColor" /></b></span>
              <h2>{{ displaySnapshot.location.place }}</h2>
              <p>{{ displaySnapshot.location.address }}</p>
              <div class="location-summary">
                <span><Navigation :size="15" /><strong>{{ displaySnapshot.location.distance }}</strong><small>与你的距离</small></span>
                <span><BusFront :size="15" /><strong>{{ displaySnapshot.location.transport }}</strong><small>移动方式</small></span>
                <span><Clock3 :size="15" /><strong>{{ displaySnapshot.location.eta }}</strong><small>预计到达</small></span>
              </div>
            </section>

            <section class="section-card route-card">
              <header class="card-head">
                <div><small>Today Route</small><h2>今天的移动途径</h2></div>
                <span>{{ formatStay(displaySnapshot.location.stayMinutes) }}</span>
              </header>
              <div v-if="displaySnapshot.location.route.length" class="route-list">
                <article v-for="(stop, index) in displaySnapshot.location.route" :key="`${stop.time}-${index}`" :class="`route-${stop.kind}`">
                  <span class="route-dot"><Footprints v-if="stop.kind === 'pass'" :size="13" /><MapPin v-else :size="13" /></span>
                  <div><strong>{{ stop.name }}</strong><p>{{ stop.detail }}</p></div>
                  <time>{{ stop.time }}</time>
                </article>
              </div>
              <p v-else class="empty-copy">角色今天还没有分享移动路线。</p>
            </section>

            <section class="map-actions">
              <button type="button" :class="{ active: state.arrivalReminderEnabled }" @click="toggleArrivalReminder">
                <BellRing :size="18" />
                <span><strong>{{ state.arrivalReminderEnabled ? '到达提醒已开启' : '到达时提醒我' }}</strong><small>仅在下一次角色状态同步时提示</small></span>
              </button>
              <button type="button" :disabled="syncing" @click="syncNow">
                <Radio :size="18" />
                <span><strong>请求共享现在的位置</strong><small>调用 API 更新角色生活轨迹</small></span>
              </button>
            </section>
          </section>

          <section v-else-if="activeTab === 'device'" class="tab-content device-tab">
            <section class="phone-report-card">
              <header>
                <div><small>PHONE REPORT</small><h2>{{ characterName }} 的手机</h2></div>
                <span class="device-live"><i></i>{{ screenStatusLabel }}</span>
              </header>
              <div class="battery-row">
                <span class="battery-visual"><i :style="{ width: `${displaySnapshot.device.battery}%` }"></i></span>
                <strong>{{ displaySnapshot.device.battery }}%</strong>
                <small>{{ displaySnapshot.device.charging ? '正在充电' : batteryHint }}</small>
              </div>
              <div class="usage-feature">
                <span><Smartphone :size="22" /></span>
                <div><small>今日手机使用</small><strong>{{ formatUsage(displaySnapshot.device.usageMinutes) }}</strong><em>{{ displaySnapshot.device.activeApp }}</em></div>
              </div>
              <div class="unlock-grid">
                <span><UnlockKeyhole :size="17" /><small>最近解锁</small><strong>{{ displaySnapshot.device.lastUnlockedAt }}</strong></span>
                <span><LockKeyhole :size="17" /><small>最近锁屏</small><strong>{{ displaySnapshot.device.lastLockedAt }}</strong></span>
              </div>
            </section>

            <section class="section-card network-card">
              <header class="card-head">
                <div><small>CONNECTION</small><h2>连入网络</h2></div>
                <Wifi :size="20" />
              </header>
              <div class="current-network">
                <span><Wifi :size="18" /></span>
                <div><small>当前网络</small><strong>{{ displaySnapshot.device.network }}</strong></div>
              </div>
              <div class="network-list">
                <article v-for="(network, index) in displaySnapshot.device.networkHistory" :key="`${network.time}-${index}`">
                  <span :class="`network-${network.kind}`"><WifiOff v-if="network.kind === 'offline'" :size="15" /><Signal v-else :size="15" /></span>
                  <strong>{{ network.name }}</strong>
                  <small>{{ network.time }}</small>
                </article>
              </div>
            </section>

            <p class="privacy-note"><ShieldCheck :size="15" />以上是角色主动分享的剧情化报告，并非真实系统权限数据。</p>
          </section>

          <section v-else class="tab-content moments-tab">
            <section class="section-card moments-card">
              <header class="card-head">
                <div><small>LITTLE MOMENTS</small><h2>今天想让你知道的事</h2></div>
                <Sparkles :size="20" />
              </header>
              <article v-for="(moment, index) in displaySnapshot.moments" :key="`${moment.time}-${index}`" class="moment-row">
                <span>{{ moment.emoji }}</span>
                <div><strong>{{ moment.title }}</strong><p>{{ moment.detail }}</p></div>
                <time>{{ moment.time }}</time>
              </article>
              <p v-if="!displaySnapshot.moments.length" class="empty-copy">今天的小片段还藏在角色的口袋里。</p>
            </section>

            <section class="section-card wishes-card">
              <header class="card-head">
                <div><small>WISH CAPSULE</small><h2>我们的心愿便利贴</h2></div>
                <Heart :size="20" />
              </header>
              <form class="wish-form" @submit.prevent="addWish">
                <input v-model="wishDraft" maxlength="120" placeholder="例如：下次一起看凌晨四点的天" />
                <button type="submit" :disabled="!wishDraft.trim()" aria-label="添加心愿"><Plus :size="18" /></button>
              </form>
              <div class="wish-list">
                <article v-for="wish in state.wishes" :key="wish.id">
                  <span>♡</span><p>{{ wish.content }}</p>
                  <button type="button" aria-label="删除心愿" @click="deleteWish(wish.id)"><X :size="14" /></button>
                </article>
                <p v-if="!state.wishes.length" class="empty-copy">写下一件想和对方完成的小事吧。</p>
              </div>
            </section>

            <section v-if="snapshotHistory.length" class="history-strip">
              <header><span>状态回忆</span><small>最近 {{ snapshotHistory.length + 1 }} 次</small></header>
              <div>
                <button type="button" :class="{ active: !selectedSnapshotId }" @click="selectedSnapshotId = ''">现在</button>
                <button v-for="item in snapshotHistory" :key="item.id" type="button" :class="{ active: selectedSnapshotId === item.id }" @click="selectedSnapshotId = item.id">{{ formatHistory(item.generatedAt) }}</button>
              </div>
            </section>
          </section>
        </template>
      </template>
    </main>

    <nav v-if="state?.consentGrantedAt" class="couple-tabs" aria-label="情侣空间页面切换">
      <button type="button" :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'"><Heart :size="20" /><span>我们</span></button>
      <button type="button" :class="{ active: activeTab === 'map' }" @click="activeTab = 'map'"><MapPinned :size="20" /><span>位置</span></button>
      <button type="button" :class="{ active: activeTab === 'device' }" @click="activeTab = 'device'"><Smartphone :size="20" /><span>手机</span></button>
      <button type="button" :class="{ active: activeTab === 'moments' }" @click="activeTab = 'moments'"><Sparkles :size="20" /><span>印记</span></button>
    </nav>

    <AppModal v-model="showSettings" title="情侣空间设置" variant="ins">
      <form class="couple-settings" @submit.prevent="saveSettings">
        <label><span>关系称呼</span><input v-model="relationshipLabelDraft" maxlength="20" placeholder="恋人、搭档、命定之人…" /></label>
        <label><span>在一起的日期</span><input v-model="startedAtDraft" type="date" /></label>
        <p><ShieldCheck :size="15" />共享内容仅保存在本机角色数据与用户主动创建的备份中。</p>
        <div class="settings-actions">
          <button class="danger-button" type="button" @click="disableCoupleSpace">关闭并清空</button>
          <button class="primary-button" type="submit">保存设置</button>
        </div>
      </form>
    </AppModal>
  </section>

  <section v-else class="screen no-tabs couple-page missing-page">
    <button type="button" @click="goBack"><ArrowLeft :size="20" />返回</button>
    <p>没有找到这段关系。</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, BatteryCharging, BatteryMedium, BellRing, BusFront, CalendarHeart, ChevronRight, Clock3, Footprints, Heart, LoaderCircle, LockKeyhole, MapPin, MapPinned, Navigation, Plus, Radio, RefreshCw, Settings2, ShieldCheck, Signal, Smartphone, Sparkles, UnlockKeyhole, Wifi, WifiOff, X } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { CoupleSpaceSnapshot } from '@/types/domain';
import { createCoupleSpaceState } from '@/utils/coupleSpace';
import { createId } from '@/utils/id';
import { getCharacterDisplayName } from '@/utils/character';
import { getUserDisplayName } from '@/utils/profile';

const props = defineProps<{ id: string }>();
const router = useRouter();
const store = useAppStore();
type CoupleTab = 'home' | 'map' | 'device' | 'moments';

const activeTab = ref<CoupleTab>('home');
const syncing = ref(false);
const consentChecked = ref(false);
const showSettings = ref(false);
const relationshipLabelDraft = ref('');
const startedAtDraft = ref('');
const wishDraft = ref('');
const selectedSnapshotId = ref('');

const conversation = computed(() => store.conversationById(props.id));
const character = computed(() => conversation.value ? store.characterById(conversation.value.charId) : null);
const currentUser = computed(() => character.value ? store.userById(character.value.boundUserId) ?? store.user : store.user);
const state = computed(() => character.value?.coupleSpace);
const snapshot = computed(() => state.value?.snapshot);
const snapshotHistory = computed(() => state.value?.history ?? []);
const displaySnapshot = computed<CoupleSpaceSnapshot | undefined>(() => {
  if (!selectedSnapshotId.value) return snapshot.value;
  return snapshotHistory.value.find((item) => item.id === selectedSnapshotId.value) ?? snapshot.value;
});
const characterName = computed(() => character.value ? getCharacterDisplayName(character.value) : 'TA');
const currentUserName = computed(() => currentUser.value ? getUserDisplayName(currentUser.value) : '我');
const relationshipDaysText = computed(() => {
  const startedAt = state.value?.startedAt;
  if (!startedAt) return 'OUR PRIVATE LINK';
  const start = new Date(`${startedAt}T00:00:00`).getTime();
  if (!Number.isFinite(start)) return 'OUR PRIVATE LINK';
  const days = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1);
  return `相伴第 ${days} 天`;
});
const screenStatusLabel = computed(() => {
  const status = displaySnapshot.value?.device.screenStatus;
  return status === 'using' ? '正在使用' : status === 'locked' ? '已锁屏' : '暂时放下';
});
const batteryHint = computed(() => {
  const battery = displaySnapshot.value?.device.battery ?? 0;
  return battery <= 20 ? '该提醒充电啦' : battery >= 80 ? '电量很安心' : '足够陪你一阵';
});
const missLevelLabel = computed(() => {
  const level = displaySnapshot.value?.bond.missLevel ?? 0;
  return level >= 85 ? '忍不住想见你' : level >= 60 ? '总会想起你' : level >= 35 ? '悄悄惦记' : '各自好好生活';
});

onMounted(() => store.hydrate());

function goBack() {
  if (window.history.length > 1) router.back();
  else void router.replace({ name: 'chat-room', params: { id: props.id } });
}

async function enableCoupleSpace() {
  const target = character.value;
  if (!target || !consentChecked.value) return;
  await store.saveCoupleSpaceState(target.id, createCoupleSpaceState());
}

async function syncNow() {
  if (syncing.value) return;
  syncing.value = true;
  try {
    const previousPlace = snapshot.value?.location.place;
    const nextSnapshot = await store.refreshCoupleSpace(props.id);
    if (!nextSnapshot) return;
    selectedSnapshotId.value = '';
    if (state.value?.arrivalReminderEnabled && previousPlace && nextSnapshot.location.place !== previousPlace) {
      store.showConfigAlert(`${characterName.value} 已从「${previousPlace}」移动到「${nextSnapshot.location.place}」。`, '位置有更新');
    }
  } catch (error) {
    store.showConfigAlert(error instanceof Error ? error.message : '情侣空间同步失败。', '无法同步');
  } finally {
    syncing.value = false;
  }
}

async function updateState(patch: Partial<NonNullable<typeof state.value>>) {
  const target = character.value;
  const current = state.value;
  if (!target || !current) return;
  await store.saveCoupleSpaceState(target.id, { ...current, ...patch });
}

async function toggleArrivalReminder() {
  if (!state.value) return;
  await updateState({ arrivalReminderEnabled: !state.value.arrivalReminderEnabled });
}

function openSettings() {
  relationshipLabelDraft.value = state.value?.relationshipLabel ?? '恋人';
  startedAtDraft.value = state.value?.startedAt ?? '';
  showSettings.value = true;
}

async function saveSettings() {
  await updateState({
    relationshipLabel: relationshipLabelDraft.value.trim() || '恋人',
    startedAt: startedAtDraft.value
  });
  showSettings.value = false;
}

async function disableCoupleSpace() {
  const target = character.value;
  if (!target || !window.confirm('关闭情侣空间并清空共享状态、轨迹历史和心愿便利贴？')) return;
  await store.saveCharacter({ ...target, coupleSpace: undefined });
  showSettings.value = false;
  consentChecked.value = false;
  selectedSnapshotId.value = '';
}

async function addWish() {
  const content = wishDraft.value.trim();
  if (!content || !state.value) return;
  await updateState({ wishes: [...state.value.wishes, { id: createId('couple_wish'), content, createdAt: Date.now() }] });
  wishDraft.value = '';
}

async function deleteWish(wishId: string) {
  if (!state.value) return;
  await updateState({ wishes: state.value.wishes.filter((wish) => wish.id !== wishId) });
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(timestamp);
}

function formatHistory(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(timestamp);
}

function formatStay(minutes: number) {
  if (!minutes) return '刚刚抵达';
  if (minutes < 60) return `停留 ${minutes} 分钟`;
  return `停留 ${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}

function formatUsage(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}
</script>

<style scoped>
.couple-page {
  --couple-pink: #ff668b;
  --couple-deep: #4b3040;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 0;
  color: #33272e;
  background:
    radial-gradient(circle at 95% 2%, rgba(255, 179, 202, 0.34), transparent 26%),
    radial-gradient(circle at 4% 42%, rgba(183, 160, 255, 0.2), transparent 28%),
    linear-gradient(180deg, #fff9fb 0%, #f8f5fb 54%, #f4f7fa 100%);
}

.couple-topbar {
  flex: 0 0 auto;
  justify-content: flex-start;
  gap: 11px;
  background: rgba(255, 249, 251, 0.88);
  border-bottom: 1px solid rgba(98, 64, 82, 0.07);
}

.back-button,
.top-action,
.hero-settings {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  color: #44343d;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 6px 20px rgba(97, 55, 75, 0.07);
}

.top-title-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.top-title-copy strong { font-size: 16px; font-weight: 900; }
.top-action:disabled { opacity: 0.38; }

.couple-main {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 15px 14px calc(88px + var(--safe-bottom));
  -webkit-overflow-scrolling: touch;
}

.bond-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  margin-bottom: 14px;
  padding: 12px 13px;
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 14px 34px rgba(90, 58, 76, 0.08);
  backdrop-filter: blur(18px);
}

.avatar-pair { position: relative; display: flex; flex: 0 0 90px; align-items: center; padding-bottom: 4px; }
.avatar-pair img { flex: 0 0 48px; width: 48px; height: 48px; border: 3px solid #fff; border-radius: 17px; object-fit: cover; box-shadow: 0 6px 14px rgba(65, 34, 50, 0.13); }
.avatar-pair img + span + img { margin-left: -6px; }
.avatar-pair span { position: absolute; z-index: 2; bottom: -2px; left: 34px; display: grid; place-items: center; width: 22px; height: 22px; border: 2px solid #fff; border-radius: 50%; color: #fff; background: var(--couple-pink); box-shadow: 0 3px 8px rgba(104, 45, 68, 0.16); }
.avatar-pair span svg { width: 12px; height: 12px; }
.bond-title { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.bond-title > span { color: var(--couple-pink); font-size: 9px; font-weight: 900; letter-spacing: 0.12em; }
.bond-title strong { overflow: hidden; margin: 2px 0; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.bond-title strong em { color: #ff8aa8; font-family: Georgia, serif; font-style: italic; }
.bond-title small { overflow: hidden; color: #9c7f8e; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.hero-settings { flex: 0 0 34px; width: 34px; height: 34px; box-shadow: none; }

.consent-card,
.first-sync-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 29px 22px 24px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  text-align: center;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 18px 46px rgba(88, 58, 80, 0.09);
}

.consent-icon,
.first-sync-card > span { display: grid; place-items: center; width: 64px; height: 64px; margin-bottom: 12px; border-radius: 23px; color: #fff; background: linear-gradient(145deg, #ff6d93, #b78cff); box-shadow: 0 12px 24px rgba(224, 100, 144, 0.25); }
.section-kicker { margin: 0; color: #b48b9f; font-size: 9px; font-weight: 900; letter-spacing: 0.15em; }
.consent-card h1, .first-sync-card h2 { margin: 5px 0 8px; color: #392b33; font-size: 20px; }
.consent-card > p:not(.section-kicker), .first-sync-card p { margin: 0; color: #826d78; font-size: 12px; line-height: 1.75; }
.consent-card ul { width: 100%; margin: 18px 0; padding: 0; list-style: none; }
.consent-card li { display: flex; align-items: center; gap: 10px; padding: 9px 4px; color: #5e4a54; text-align: left; border-bottom: 1px solid rgba(98, 68, 84, 0.07); }
.consent-card li svg { color: #f06f92; }
.consent-check { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 15px; color: #715b66; font-size: 11px; line-height: 1.55; text-align: left; }
.consent-check input { width: 17px; height: 17px; margin: 0; accent-color: var(--couple-pink); }
.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 0 22px; border-radius: 15px; color: #fff; font-weight: 800; background: linear-gradient(135deg, #ff668b, #c778d7); box-shadow: 0 10px 22px rgba(220, 91, 139, 0.21); }
.primary-button:disabled { opacity: 0.45; box-shadow: none; }
.first-sync-card { margin-top: 18px; }
.first-sync-card .primary-button { margin-top: 18px; }

.tab-content { display: grid; gap: 12px; }
.mini-map-card { display: flex; align-items: stretch; min-height: 154px; overflow: hidden; padding: 0; border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 25px; text-align: left; background: rgba(255, 255, 255, 0.82); box-shadow: 0 14px 32px rgba(80, 61, 72, 0.08); }
.map-canvas { position: relative; flex: 0 0 43%; overflow: hidden; background: linear-gradient(145deg, #e7f0e8, #f3e6e9); }
.map-road { position: absolute; display: block; width: 150%; height: 12px; border: 3px solid #fff; border-width: 3px 0; background: #d2d8d4; transform-origin: center; }
.road-one { top: 25%; left: -24%; transform: rotate(32deg); }
.road-two { top: 62%; left: -18%; transform: rotate(-23deg); }
.road-three { top: 44%; left: -25%; height: 7px; transform: rotate(83deg); }
.map-water { position: absolute; right: -30px; bottom: -24px; width: 100px; height: 80px; border-radius: 50%; background: rgba(147, 203, 226, 0.6); }
.map-pin { position: absolute; top: 50%; left: 49%; display: grid; place-items: center; width: 42px; height: 42px; border: 4px solid #fff; border-radius: 50% 50% 50% 9px; color: #ff587f; background: #ffdce5; box-shadow: 0 8px 17px rgba(135, 68, 91, 0.21); transform: translate(-50%, -50%) rotate(-45deg); }
.map-pin svg { transform: rotate(45deg); }
.mini-map-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; justify-content: center; padding: 14px; }
.mini-map-copy small { color: #d06081; font-size: 9px; font-weight: 900; letter-spacing: 0.08em; }
.mini-map-copy strong { margin: 4px 0; overflow: hidden; color: #3e3037; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
.mini-map-copy > span { color: #7c6972; font-size: 11px; line-height: 1.5; }
.mini-map-copy em { display: flex; align-items: center; gap: 4px; margin-top: 9px; color: #aa8294; font-size: 10px; font-style: normal; }
.mini-map-card > svg { align-self: center; margin-right: 11px; color: #c5aab6; }

.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.metric-card { position: relative; display: grid; grid-template-columns: 39px 1fr; grid-template-rows: auto auto; min-height: 88px; padding: 13px; border-radius: 22px; overflow: hidden; }
.metric-card::after { position: absolute; right: -18px; bottom: -24px; width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,.28); content: ''; }
.metric-card.pink { background: linear-gradient(145deg, #ffe5ed, #ffd3df); }
.metric-card.violet { background: linear-gradient(145deg, #eee8ff, #ded2ff); }
.metric-card.mint { background: linear-gradient(145deg, #e1f6ee, #caecdf); }
.metric-card.peach { background: linear-gradient(145deg, #fff0df, #ffe1d4); }
.metric-icon, .metric-card > svg, .metric-ring { grid-row: 1 / 3; align-self: center; font-size: 25px; }
.metric-card > svg { color: #6c756d; }
.metric-card small { align-self: end; color: #8f7481; font-size: 9px; }
.metric-card strong { z-index: 1; align-self: start; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.metric-ring { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: conic-gradient(#a278df var(--score), rgba(255,255,255,.55) 0); }
.metric-ring::before { position: absolute; width: 25px; height: 25px; border-radius: 50%; background: #ebe3ff; content: ''; }
.metric-ring i { z-index: 1; font-size: 9px; font-style: normal; font-weight: 900; }
.whisper-card, .plan-card { display: flex; align-items: center; gap: 12px; padding: 15px; border: 1px solid rgba(255,255,255,.88); border-radius: 22px; background: rgba(255,255,255,.72); }
.whisper-avatar img { width: 40px; height: 40px; border-radius: 15px; object-fit: cover; }
.whisper-card div, .plan-card div { flex: 1; min-width: 0; }
.whisper-card small, .plan-card small { color: #b28098; font-size: 9px; font-weight: 800; }
.whisper-card p { margin: 3px 0 0; color: #513c47; font-family: Georgia, 'Songti SC', serif; font-size: 12px; line-height: 1.65; }
.plan-card > span:first-child { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 15px; color: #e15f85; background: #ffe1ea; }
.plan-card strong { display: block; margin-top: 3px; font-size: 11px; line-height: 1.5; }
.sync-score { color: #9d6faa; font-size: 9px; font-weight: 900; }

.location-hero-card { position: relative; overflow: hidden; padding: 18px; border-radius: 28px; color: #fff; text-align: center; background: radial-gradient(circle at 15% 10%, rgba(255,255,255,.27), transparent 25%), linear-gradient(145deg, #6c81b5, #8c6cb2 48%, #d47c9e); box-shadow: 0 16px 34px rgba(91, 77, 129, 0.22); }
.live-pill { position: absolute; top: 13px; left: 13px; display: flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: 99px; font-size: 8px; font-weight: 800; background: rgba(20,18,40,.22); }
.live-pill span, .device-live i { width: 6px; height: 6px; border-radius: 50%; background: #92ffc0; box-shadow: 0 0 0 4px rgba(146,255,192,.15); }
.location-orbit { position: relative; display: grid; place-items: center; width: 104px; height: 104px; margin: 16px auto 8px; border: 1px solid rgba(255,255,255,.25); border-radius: 50%; }
.location-orbit::before, .location-orbit i { position: absolute; width: 76px; height: 76px; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; content: ''; }
.location-orbit i { width: 48px; height: 48px; background: rgba(255,255,255,.12); }
.location-orbit b { z-index: 1; display: grid; place-items: center; width: 43px; height: 43px; border-radius: 16px; color: #d45b83; background: #fff; box-shadow: 0 10px 20px rgba(40,25,61,.2); }
.location-hero-card h2 { margin: 0; font-size: 19px; }
.location-hero-card > p { margin: 4px 0 15px; color: rgba(255,255,255,.72); font-size: 10px; }
.location-summary { display: grid; grid-template-columns: repeat(3, 1fr); padding-top: 13px; border-top: 1px solid rgba(255,255,255,.18); }
.location-summary span { display: flex; min-width: 0; flex-direction: column; align-items: center; justify-content: flex-start; gap: 3px; padding: 0 7px; border-right: 1px solid rgba(255,255,255,.15); }
.location-summary span:last-child { border: 0; }
.location-summary strong { max-width: 100%; overflow: visible; font-size: 10px; line-height: 1.4; overflow-wrap: anywhere; text-align: center; text-overflow: clip; white-space: normal; }
.location-summary small { color: rgba(255,255,255,.6); font-size: 8px; }

.location-hero-card,
.location-hero-card h2,
.location-hero-card > p,
.location-hero-card .live-pill,
.location-hero-card .location-summary :is(svg, strong) {
  color: #ffffff !important;
}

.location-hero-card .location-summary small {
  color: rgba(255,255,255,.68) !important;
}

.section-card { padding: 16px; border: 1px solid rgba(255,255,255,.9); border-radius: 25px; background: rgba(255,255,255,.77); box-shadow: 0 12px 30px rgba(80,60,72,.06); }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-head small { color: #c27d9b; font-size: 8px; font-weight: 900; letter-spacing: .12em; }
.card-head h2 { margin: 2px 0 0; font-size: 14px; }
.card-head > span { padding: 5px 8px; border-radius: 99px; color: #9a7487; font-size: 8px; background: #f8edf2; }
.card-head > svg { color: #de7394; }
.route-list article { position: relative; display: grid; grid-template-columns: 30px 1fr auto; gap: 8px; min-height: 59px; }
.route-list article:not(:last-child)::after { position: absolute; top: 23px; bottom: -4px; left: 11px; width: 2px; background: linear-gradient(#e8aac0, #d9d7e7); content: ''; }
.route-dot { z-index: 1; display: grid; place-items: center; width: 24px; height: 24px; border: 4px solid #fff; border-radius: 50%; color: #fff; background: #d98ba7; box-shadow: 0 0 0 1px #edd3dc; }
.route-arrival .route-dot { background: #8b7bc5; }
.route-pass .route-dot { background: #aab3bb; }
.route-list strong { display: block; margin-top: 2px; font-size: 11px; }
.route-list p { margin: 3px 0 0; color: #98818c; font-size: 9px; line-height: 1.45; }
.route-list time { color: #a58c97; font-size: 9px; }
.map-actions { display: grid; gap: 9px; }
.map-actions button { display: flex; align-items: center; gap: 11px; min-height: 62px; padding: 11px 14px; border-radius: 20px; text-align: left; background: rgba(255,255,255,.75); }
.map-actions button.active { color: #b84f74; background: #ffe2eb; }
.map-actions button > span { display: flex; flex-direction: column; }
.map-actions strong { font-size: 11px; }
.map-actions small { margin-top: 2px; color: #a18794; font-size: 9px; }

.phone-report-card { overflow: hidden; padding: 18px; border-radius: 29px; color: #f7f7fb; background: radial-gradient(circle at 90% 5%, rgba(187,145,255,.25), transparent 24%), linear-gradient(155deg, #242432, #363449 58%, #45364c); box-shadow: 0 17px 36px rgba(42,39,58,.2); }
.phone-report-card header { display: flex; align-items: center; justify-content: space-between; }
.phone-report-card header small { color: #c9bfd2; font-size: 8px; font-weight: 900; letter-spacing: .12em; }
.phone-report-card h2 { margin: 3px 0 0; font-size: 16px; }
.device-live { display: flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 99px; color: #dcd5e4; font-size: 9px; background: rgba(255,255,255,.08); }
.battery-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 5px 10px; margin: 23px 0 15px; }
.battery-visual { position: relative; display: block; height: 12px; padding: 2px; border: 1px solid rgba(255,255,255,.35); border-radius: 5px; }
.battery-visual::after { position: absolute; top: 3px; right: -4px; width: 3px; height: 5px; border-radius: 0 2px 2px 0; background: rgba(255,255,255,.35); content: ''; }
.battery-visual i { display: block; height: 100%; border-radius: 2px; background: linear-gradient(90deg, #ff88ac, #bd9aff); }
.battery-row strong { font-size: 18px; }
.battery-row small { grid-column: 1 / 3; color: #a9a3b2; font-size: 9px; }
.usage-feature { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: 18px; background: rgba(255,255,255,.07); }
.usage-feature > span { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; color: #ffc2d5; background: rgba(255,123,165,.15); }
.usage-feature div { display: grid; flex: 1; grid-template-columns: 1fr auto; }
.usage-feature small { color: #aca6b5; font-size: 9px; }
.usage-feature strong { grid-row: 2; font-size: 13px; }
.usage-feature em { grid-row: 1 / 3; align-self: center; color: #d6c9dc; font-size: 9px; font-style: normal; }
.unlock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 10px; }
.unlock-grid span { display: grid; grid-template-columns: 23px 1fr; align-items: center; padding: 11px; border-radius: 17px; background: rgba(255,255,255,.055); }
.unlock-grid svg { grid-row: 1 / 3; color: #c0a8cf; }
.unlock-grid small { color: #9992a0; font-size: 8px; }
.unlock-grid strong { font-size: 11px; }
.current-network { display: flex; align-items: center; gap: 11px; padding: 12px; border-radius: 18px; background: #f3edf8; }
.current-network > span { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 13px; color: #8568a0; background: #fff; }
.current-network div { display: flex; flex-direction: column; }
.current-network small { color: #a797af; font-size: 8px; }
.current-network strong { font-size: 11px; }
.network-list { margin-top: 9px; }
.network-list article { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; min-height: 39px; border-bottom: 1px solid #f0eaee; }
.network-list article > span { display: grid; place-items: center; color: #8f8298; }
.network-list strong { font-size: 10px; }
.network-list small { color: #aa96a1; font-size: 9px; }
.network-offline { color: #c6a1a7 !important; }
.privacy-note { display: flex; align-items: center; justify-content: center; gap: 5px; margin: 1px 0; color: #a38c98; font-size: 9px; }

.moment-row { display: grid; grid-template-columns: 38px 1fr auto; gap: 9px; min-height: 64px; }
.moment-row > span { display: grid; place-items: center; align-self: start; width: 35px; height: 35px; border-radius: 14px; font-size: 18px; background: #fff0f5; }
.moment-row strong { font-size: 11px; }
.moment-row p { margin: 3px 0 0; color: #917a86; font-size: 9px; line-height: 1.55; }
.moment-row time { color: #b79aa8; font-size: 8px; }
.wish-form { display: grid; grid-template-columns: 1fr 42px; gap: 7px; }
.wish-form input { min-width: 0; min-height: 42px; padding: 0 13px; border: 1px solid #f0dce5; border-radius: 14px; font: inherit; font-size: 11px; background: #fffafb; }
.wish-form button { display: grid; place-items: center; border-radius: 14px; color: #fff; background: #ed7699; }
.wish-list { display: grid; gap: 7px; margin-top: 10px; }
.wish-list article { display: grid; grid-template-columns: 20px 1fr 24px; align-items: center; min-height: 42px; padding: 7px 8px; border-radius: 14px; color: #674d59; background: linear-gradient(135deg, #fff0f4, #f7efff); }
.wish-list article > span { color: #e6678d; font-size: 18px; }
.wish-list p { margin: 0; font-size: 10px; line-height: 1.5; }
.wish-list button { display: grid; place-items: center; color: #b59aa7; }
.empty-copy { margin: 9px 0 0; color: #ad98a2; font-size: 10px; text-align: center; }
.history-strip { padding: 14px; border-radius: 21px; background: rgba(255,255,255,.61); }
.history-strip header { display: flex; justify-content: space-between; color: #856b77; font-size: 10px; }
.history-strip header small { color: #b49da8; font-size: 9px; }
.history-strip > div { display: flex; gap: 6px; margin-top: 9px; overflow-x: auto; scrollbar-width: none; }
.history-strip button { flex: 0 0 auto; min-height: 31px; padding: 0 10px; border-radius: 99px; color: #9d8290; font-size: 9px; background: #f3eaef; }
.history-strip button.active { color: #fff; background: #d87698; }

.couple-tabs { position: absolute; z-index: 9; right: 11px; bottom: calc(9px + var(--safe-bottom)); left: 11px; display: grid; grid-template-columns: repeat(4, 1fr); min-height: 64px; padding: 7px; border: 1px solid rgba(255,255,255,.82); border-radius: 24px; background: rgba(255,255,255,.86); box-shadow: 0 14px 38px rgba(76,50,66,.16); backdrop-filter: blur(22px); }
.couple-tabs button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border-radius: 17px; color: #a9929d; font-size: 8px; }
.couple-tabs button.active { color: #d8527b; background: #ffedf3; }
.couple-tabs button.active svg { fill: rgba(238,95,138,.16); }

.couple-settings { display: grid; gap: 13px; }
.couple-settings label { display: grid; gap: 5px; color: #765f6b; font-size: 10px; }
.couple-settings input { min-height: 43px; padding: 0 12px; border: 1px solid #e8dce2; border-radius: 13px; font: inherit; background: #fff; }
.couple-settings > p { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: #9b8490; font-size: 9px; line-height: 1.5; }
.settings-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.danger-button { min-height: 44px; border-radius: 15px; color: #d34f68; background: #fff0f2; }
.missing-page { align-items: center; justify-content: center; gap: 12px; }
.missing-page > button { display: flex; align-items: center; gap: 6px; }
.spin { animation: couple-spin .85s linear infinite; }
@keyframes couple-spin { to { transform: rotate(360deg); } }

@media (min-width: 680px) {
  .couple-main { width: min(100%, 560px); margin: 0 auto; }
  .couple-tabs { right: 50%; left: auto; width: min(calc(100% - 22px), 540px); transform: translateX(50%); }
}
</style>

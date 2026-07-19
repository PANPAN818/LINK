import type { CoupleDeviceScreenStatus, CoupleMomentRecord, CoupleNetworkRecord, CoupleRouteStop, CoupleSpaceSnapshot, CoupleSpaceState, CoupleWishNote } from '@/types/domain';

const routeKinds = new Set<CoupleRouteStop['kind']>(['start', 'pass', 'stay', 'arrival']);
const networkKinds = new Set<CoupleNetworkRecord['kind']>(['wifi', 'cellular', 'offline']);
const screenStatuses = new Set<CoupleDeviceScreenStatus>(['using', 'locked', 'idle']);

function text(value: unknown, fallback = '') {
  return String(value ?? '').trim() || fallback;
}

function numberInRange(value: unknown, minimum: number, maximum: number, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, Math.round(numeric))) : fallback;
}

function normalizeRoute(input: unknown): CoupleRouteStop[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 8).map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const rawKind = text(record.kind) as CoupleRouteStop['kind'];
    return {
      name: text(record.name, `途经点 ${index + 1}`),
      time: text(record.time, '--:--'),
      kind: routeKinds.has(rawKind) ? rawKind : index === 0 ? 'start' : 'pass',
      detail: text(record.detail, '轻轻经过这里')
    };
  });
}

function normalizeNetworks(input: unknown): CoupleNetworkRecord[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 6).map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const rawKind = text(record.kind) as CoupleNetworkRecord['kind'];
    return {
      name: text(record.name, '未知网络'),
      time: text(record.time, '--:--'),
      kind: networkKinds.has(rawKind) ? rawKind : 'wifi'
    };
  });
}

function normalizeMoments(input: unknown): CoupleMomentRecord[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 8).map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      time: text(record.time, '--:--'),
      title: text(record.title, '一个普通瞬间'),
      detail: text(record.detail, '今天也在好好生活。'),
      emoji: text(record.emoji, '✨').slice(0, 4)
    };
  });
}

export function normalizeCoupleSpaceSnapshot(input: unknown, generatedAt = Date.now()): CoupleSpaceSnapshot {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const location = source.location && typeof source.location === 'object' ? source.location as Record<string, unknown> : {};
  const device = source.device && typeof source.device === 'object' ? source.device as Record<string, unknown> : {};
  const bond = source.bond && typeof source.bond === 'object' ? source.bond as Record<string, unknown> : {};
  const rawScreenStatus = text(device.screenStatus) as CoupleDeviceScreenStatus;
  return {
    id: text(source.id, `couple_snapshot_${generatedAt}_${Math.random().toString(16).slice(2)}`),
    generatedAt: Number.isFinite(source.generatedAt) ? Number(source.generatedAt) : generatedAt,
    location: {
      place: text(location.place, '角色的小世界'),
      address: text(location.address, '一个只在故事里亮起的坐标'),
      status: text(location.status, '正在好好生活'),
      distance: text(location.distance, '心的距离很近'),
      transport: text(location.transport, '散步'),
      eta: text(location.eta, '等下一次见面'),
      stayMinutes: numberInRange(location.stayMinutes, 0, 1440, 0),
      route: normalizeRoute(location.route)
    },
    device: {
      battery: numberInRange(device.battery, 0, 100, 76),
      charging: Boolean(device.charging),
      screenStatus: screenStatuses.has(rawScreenStatus) ? rawScreenStatus : 'idle',
      lastUnlockedAt: text(device.lastUnlockedAt, '--:--'),
      lastLockedAt: text(device.lastLockedAt, '--:--'),
      usageMinutes: numberInRange(device.usageMinutes, 0, 1440, 0),
      activeApp: text(device.activeApp, '没有正在使用的应用'),
      network: text(device.network, '未分享网络'),
      networkHistory: normalizeNetworks(device.networkHistory)
    },
    bond: {
      mood: text(bond.mood, '平静'),
      moodEmoji: text(bond.moodEmoji, '💗').slice(0, 4),
      missLevel: numberInRange(bond.missLevel, 0, 100, 50),
      syncScore: numberInRange(bond.syncScore, 0, 100, 70),
      nextPlan: text(bond.nextPlan, '找一个舒服的时间聊聊天'),
      whisper: text(bond.whisper, '今天也想和你分享一点小事。')
    },
    moments: normalizeMoments(source.moments)
  };
}

function normalizeWishes(input: unknown): CoupleWishNote[] {
  if (!Array.isArray(input)) return [];
  return input.slice(-20).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const content = text(record.content).slice(0, 120);
    if (!content) return [];
    return [{
      id: text(record.id, `couple_wish_${Math.random().toString(16).slice(2)}`),
      content,
      createdAt: Number.isFinite(record.createdAt) ? Number(record.createdAt) : Date.now()
    }];
  });
}

export function normalizeCoupleSpaceState(input: Partial<CoupleSpaceState> | null | undefined): CoupleSpaceState | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const snapshot = input.snapshot ? normalizeCoupleSpaceSnapshot(input.snapshot) : undefined;
  const history = Array.isArray(input.history)
    ? input.history.map((item) => normalizeCoupleSpaceSnapshot(item)).filter((item) => item.id !== snapshot?.id).slice(0, 11)
    : [];
  return {
    consentGrantedAt: Math.max(0, Number(input.consentGrantedAt) || 0),
    relationshipLabel: text(input.relationshipLabel, '恋人'),
    startedAt: text(input.startedAt),
    arrivalReminderEnabled: Boolean(input.arrivalReminderEnabled),
    ...(snapshot ? { snapshot } : {}),
    history,
    wishes: normalizeWishes(input.wishes)
  };
}

export function createCoupleSpaceState(): CoupleSpaceState {
  return {
    consentGrantedAt: Date.now(),
    relationshipLabel: '恋人',
    startedAt: '',
    arrivalReminderEnabled: false,
    history: [],
    wishes: []
  };
}
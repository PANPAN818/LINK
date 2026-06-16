import { computed, ref, watch } from 'vue';
import { useAppStore } from '@/stores/appStore';

export function useStickerManager(initialGroupId = '') {
  const store = useAppStore();
  const activeGroupId = ref(initialGroupId);
  const preferredGroupId = ref(initialGroupId);
  const selectedStickerIds = ref<string[]>([]);
  const groupDrafts = ref<Record<string, string>>({});
  const descriptionDrafts = ref<Record<string, string>>({});
  const stickerGroupDrafts = ref<Record<string, string>>({});
  const moveTargetGroupId = ref('');
  const feedback = ref('');

  const groups = computed(() => store.sortedStickerGroups ?? []);
  const allStickers = computed(() => store.sortedStickers ?? []);
  const stickers = computed(() => store.stickersForGroup(activeGroupId.value));

  watch(
    groups,
    (nextGroups) => {
      const activeStillExists = nextGroups.some((group) => group.id === activeGroupId.value);
      const preferredStillExists = nextGroups.some((group) => group.id === preferredGroupId.value);
      const nextActiveGroupId = activeStillExists
        ? activeGroupId.value
        : preferredStillExists
          ? preferredGroupId.value
          : nextGroups[0]?.id ?? '';

      if (activeGroupId.value !== nextActiveGroupId) activeGroupId.value = nextActiveGroupId;
      groupDrafts.value = Object.fromEntries(nextGroups.map((group) => [group.id, groupDrafts.value[group.id] ?? group.name]));
      if (!nextGroups.some((group) => group.id === moveTargetGroupId.value)) moveTargetGroupId.value = '';
    },
    { immediate: true }
  );

  watch(
    stickers,
    (nextStickers) => {
      const visibleIds = new Set(nextStickers.map((sticker) => sticker.id));
      selectedStickerIds.value = selectedStickerIds.value.filter((stickerId) => visibleIds.has(stickerId));
      descriptionDrafts.value = Object.fromEntries(nextStickers.map((sticker) => [sticker.id, descriptionDrafts.value[sticker.id] ?? sticker.description]));
      stickerGroupDrafts.value = Object.fromEntries(nextStickers.map((sticker) => [sticker.id, stickerGroupDrafts.value[sticker.id] ?? sticker.groupIds[0] ?? groups.value[0]?.id ?? '']));
    },
    { immediate: true }
  );

  function setActiveGroupId(groupId: string) {
    preferredGroupId.value = groupId;
    if (!groupId || groups.value.some((group) => group.id === groupId)) activeGroupId.value = groupId;
    selectedStickerIds.value = [];
    moveTargetGroupId.value = '';
    feedback.value = '';
  }

  function updateGroupDraft(groupId: string, value: string) {
    groupDrafts.value = {
      ...groupDrafts.value,
      [groupId]: value
    };
  }

  function updateDescriptionDraft(stickerId: string, value: string) {
    descriptionDrafts.value = {
      ...descriptionDrafts.value,
      [stickerId]: value
    };
  }

  function updateStickerGroupDraft(stickerId: string, value: string) {
    stickerGroupDrafts.value = {
      ...stickerGroupDrafts.value,
      [stickerId]: value
    };
  }

  function toggleStickerSelection(stickerId: string) {
    feedback.value = '';
    selectedStickerIds.value = selectedStickerIds.value.includes(stickerId)
      ? selectedStickerIds.value.filter((item) => item !== stickerId)
      : [...selectedStickerIds.value, stickerId];
  }

  function toggleSelectAll() {
    const visibleIds = stickers.value.map((sticker) => sticker.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((stickerId) => selectedStickerIds.value.includes(stickerId));
    selectedStickerIds.value = allSelected ? [] : visibleIds;
    feedback.value = '';
  }

  async function createGroup() {
    const name = nextGroupName();
    const group = await store.addStickerGroup(name);
    groupDrafts.value = {
      ...groupDrafts.value,
      [group.id]: group.name
    };
    preferredGroupId.value = group.id;
    activeGroupId.value = group.id;
    feedback.value = `已创建分组“${group.name}”。`;
  }

  function nextGroupName() {
    const baseName = '新分组';
    const existingNames = new Set(groups.value.map((group) => group.name.trim().toLocaleLowerCase()));
    if (!existingNames.has(baseName.toLocaleLowerCase())) return baseName;
    for (let index = 2; index < 1000; index += 1) {
      const candidate = `${baseName} ${index}`;
      if (!existingNames.has(candidate.toLocaleLowerCase())) return candidate;
    }
    return `${baseName} ${Date.now()}`;
  }

  async function renameGroup(groupId: string) {
    const group = groups.value.find((item) => item.id === groupId);
    const name = groupDrafts.value[groupId]?.trim() ?? '';
    if (!group || !name) return;
    await store.saveStickerGroup({ ...group, name });
    feedback.value = `已更新分组“${name}”。`;
  }

  async function deleteGroup(groupId: string) {
    const group = groups.value.find((item) => item.id === groupId);
    if (!group) return;
    if (!window.confirm(`删除分组“${group.name}”？分组内 Sticker 会自动保留到其他分组。`)) return;
    const deleted = await store.deleteStickerGroup(groupId);
    if (!deleted) return;
    const fallbackGroupId = groups.value.find((item) => item.id !== groupId)?.id ?? '';
    if (activeGroupId.value === groupId) activeGroupId.value = fallbackGroupId;
    if (preferredGroupId.value === groupId) preferredGroupId.value = fallbackGroupId;
    selectedStickerIds.value = [];
    feedback.value = `已删除分组“${group.name}”。`;
  }

  async function saveSticker(stickerId: string) {
    const sticker = stickers.value.find((item) => item.id === stickerId) ?? null;
    const description = descriptionDrafts.value[stickerId]?.trim() ?? '';
    const groupId = stickerGroupDrafts.value[stickerId]?.trim() ?? '';
    if (!sticker || !description) return;
    await store.saveSticker({
      ...sticker,
      description,
      groupIds: groupId ? [groupId] : sticker.groupIds
    });
    descriptionDrafts.value = {
      ...descriptionDrafts.value,
      [stickerId]: description
    };
    stickerGroupDrafts.value = {
      ...stickerGroupDrafts.value,
      [stickerId]: groupId || sticker.groupIds[0] || ''
    };
    feedback.value = '贴纸已保存。';
  }

  async function deleteSticker(stickerId: string) {
    const sticker = stickers.value.find((item) => item.id === stickerId) ?? null;
    if (!sticker) return;
    if (!window.confirm(`删除 Sticker“${sticker.description}”？`)) return;
    await store.deleteSticker(stickerId);
    selectedStickerIds.value = selectedStickerIds.value.filter((item) => item !== stickerId);
    feedback.value = 'Sticker 已删除。';
  }

  async function moveSelected() {
    if (!selectedStickerIds.value.length || !moveTargetGroupId.value) return;
    const movedCount = await store.moveStickersToGroup(selectedStickerIds.value, moveTargetGroupId.value);
    if (!movedCount) return;
    selectedStickerIds.value = [];
    feedback.value = `已移动 ${movedCount} 个 Sticker。`;
  }

  async function deleteSelected() {
    const selectedCount = selectedStickerIds.value.length;
    if (!selectedCount) return;
    if (!window.confirm(`删除已选中的 ${selectedCount} 个 Sticker？`)) return;
    const deletedCount = await store.deleteStickers(selectedStickerIds.value);
    if (!deletedCount) return;
    selectedStickerIds.value = [];
    feedback.value = `已删除 ${deletedCount} 个 Sticker。`;
  }

  return {
    store,
    groups,
    allStickers,
    stickers,
    activeGroupId,
    selectedStickerIds,
    groupDrafts,
    descriptionDrafts,
    stickerGroupDrafts,
    moveTargetGroupId,
    feedback,
    setActiveGroupId,
    updateGroupDraft,
    updateDescriptionDraft,
    updateStickerGroupDraft,
    toggleStickerSelection,
    toggleSelectAll,
    createGroup,
    renameGroup,
    deleteGroup,
    saveSticker,
    deleteSticker,
    moveSelected,
    deleteSelected
  };
}
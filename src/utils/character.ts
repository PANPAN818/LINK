import type { CharacterProfile } from '@/types/domain';
import { normalizeVisualProfile } from '@/utils/profile';

const defaultCharacterSignature = '这个角色还没有写个性签名。';

export function getCharacterDisplayName(character: Pick<CharacterProfile, 'userNote' | 'nickname' | 'name'>) {
  return String(character.userNote ?? '').trim() || String(character.nickname ?? '').trim() || String(character.name ?? '').trim() || 'new.friend';
}

export function getCharacterVoomAuthorName(character: Pick<CharacterProfile, 'userNote' | 'nickname'>) {
  return String(character.userNote ?? '').trim() || String(character.nickname ?? '').trim() || 'new.friend';
}

export function normalizeCharacterProfile(character: CharacterProfile, fallbackUserId = ''): CharacterProfile {
  const nickname = String(character.nickname ?? '').trim() || String(character.name ?? '').trim() || 'new.friend';
  const name = String(character.name ?? '').trim() || nickname;
  const description = String(character.description ?? '').trim();
  const signature = String(character.signature ?? '').trim() || String(character.subtitle ?? '').trim() || defaultCharacterSignature;
  const boundUserId = String(character.boundUserId ?? '').trim() || fallbackUserId;
  const localWorldBookIds = Array.isArray(character.localWorldBookIds)
    ? [...new Set(character.localWorldBookIds.filter(Boolean))]
    : [];
  const voomFrequency = character.voomFrequency === 'low' || character.voomFrequency === 'high' || character.voomFrequency === 'medium'
    ? character.voomFrequency
    : 'medium';
  const profile = normalizeVisualProfile(character.profile, {
    id: character.id,
    nickname,
    name,
    avatar: character.avatar,
    signature
  });

  return {
    ...character,
    nickname,
    name,
    description,
    signature,
    userNote: String(character.userNote ?? '').trim(),
    boundUserId,
    subtitle: String(character.subtitle ?? '').trim() || signature,
    lastSeen: String(character.lastSeen ?? '').trim() || '现在',
    localWorldBookIds,
    voomFrequency,
    profile
  };
}
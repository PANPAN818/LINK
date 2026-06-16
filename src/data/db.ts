import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, CharacterProfile, ChatMessage, Conversation, ConversationMemoryRecord, ConversationSettings, Sticker, StickerGroup, UserProfile, VoomPost, WorldBookEntry } from '@/types/domain';
import { normalizeUserProfile } from '@/utils/profile';
import { normalizeAppSettings } from '@/utils/settings';
import { normalizeWorldBooks } from '@/utils/worldBook';
import { defaultCharacters, defaultConversations, defaultMessages, defaultSettings, defaultStickerGroups, defaultStickers, defaultUsers, defaultVoomPosts, defaultWorldBooks } from './seed';

interface LinkDb extends DBSchema {
  user: { key: string; value: UserProfile };
  characters: { key: string; value: CharacterProfile };
  conversations: { key: string; value: Conversation; indexes: { byChar: string } };
  messages: { key: string; value: ChatMessage; indexes: { byConversation: string } };
  voomPosts: { key: string; value: VoomPost; indexes: { byChar: string; byConversation: string } };
  worldBooks: { key: string; value: WorldBookEntry; indexes: { byScope: string } };
  stickerGroups: { key: string; value: StickerGroup };
  stickers: { key: string; value: Sticker };
  conversationSettings: { key: string; value: ConversationSettings };
  conversationMemories: { key: string; value: ConversationMemoryRecord; indexes: { byConversation: string } };
  settings: { key: string; value: AppSettings };
}

let dbPromise: Promise<IDBPDatabase<LinkDb>> | undefined;

export function getDb() {
  dbPromise ??= openDB<LinkDb>('link-local-db', 4, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains('user')) db.createObjectStore('user', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('characters')) db.createObjectStore('characters', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('conversations')) {
        const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
        conversationStore.createIndex('byChar', 'charId');
      }
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('byConversation', 'conversationId');
      }
      if (!db.objectStoreNames.contains('voomPosts')) {
        const voomStore = db.createObjectStore('voomPosts', { keyPath: 'id' });
        voomStore.createIndex('byChar', 'charId');
        voomStore.createIndex('byConversation', 'conversationId');
      }
      if (!db.objectStoreNames.contains('worldBooks')) {
        const worldBookStore = db.createObjectStore('worldBooks', { keyPath: 'id' });
        worldBookStore.createIndex('byScope', 'scope');
      }
      if (!db.objectStoreNames.contains('stickerGroups')) db.createObjectStore('stickerGroups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('stickers')) db.createObjectStore('stickers', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('conversationSettings')) db.createObjectStore('conversationSettings', { keyPath: 'conversationId' });
      if (!db.objectStoreNames.contains('conversationMemories')) {
        const memoryStore = db.createObjectStore('conversationMemories', { keyPath: 'id' });
        memoryStore.createIndex('byConversation', 'conversationId');
      }
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');

      if (oldVersion < 4) {
        const stickerGroupStore = transaction.objectStore('stickerGroups');
        const stickerStore = transaction.objectStore('stickers');
        defaultStickerGroups.forEach((group) => {
          void stickerGroupStore.put(group);
        });
        defaultStickers.forEach((sticker) => {
          void stickerStore.put(sticker);
        });
      }
    }
  });
  return dbPromise;
}

export async function seedDatabase() {
  const db = await getDb();
  const existingUser = await db.get('user', defaultUsers[0].id);
  if (existingUser) return;

  const tx = db.transaction(['user', 'characters', 'conversations', 'messages', 'voomPosts', 'worldBooks', 'stickerGroups', 'stickers', 'conversationSettings', 'conversationMemories', 'settings'], 'readwrite');
  await Promise.all(defaultUsers.map((user) => tx.objectStore('user').put(user)));
  await Promise.all(defaultCharacters.map((character) => tx.objectStore('characters').put(character)));
  await Promise.all(defaultConversations.map((conversation) => tx.objectStore('conversations').put(conversation)));
  await Promise.all(defaultMessages.map((message) => tx.objectStore('messages').put(message)));
  await Promise.all(defaultVoomPosts.map((post) => tx.objectStore('voomPosts').put(post)));
  await Promise.all(defaultWorldBooks.map((entry) => tx.objectStore('worldBooks').put(entry)));
  await Promise.all(defaultStickerGroups.map((entry) => tx.objectStore('stickerGroups').put(entry)));
  await Promise.all(defaultStickers.map((entry) => tx.objectStore('stickers').put(entry)));
  await tx.objectStore('settings').put(defaultSettings, 'main');
  await tx.done;
}

export async function loadSnapshot() {
  await seedDatabase();
  const db = await getDb();
  const [users, characters, conversations, messages, voomPosts, worldBooks, stickerGroups, stickers, conversationSettings, conversationMemories, settings] = await Promise.all([
    db.getAll('user'),
    db.getAll('characters'),
    db.getAll('conversations'),
    db.getAll('messages'),
    db.getAll('voomPosts'),
    db.getAll('worldBooks'),
    db.getAll('stickerGroups'),
    db.getAll('stickers'),
    db.getAll('conversationSettings'),
    db.getAll('conversationMemories'),
    db.get('settings', 'main')
  ]);

  return {
    users: users.map((user) => normalizeUserProfile(user)),
    characters,
    conversations,
    messages,
    voomPosts,
    worldBooks: normalizeWorldBooks(worldBooks),
    stickerGroups,
    stickers,
    conversationSettings,
    conversationMemories,
    settings: normalizeAppSettings(settings ?? defaultSettings)
  };
}

type StoreName = 'user' | 'characters' | 'conversations' | 'messages' | 'voomPosts' | 'worldBooks' | 'stickerGroups' | 'stickers' | 'conversationSettings' | 'conversationMemories' | 'settings';

export async function putEntity<TStore extends StoreName>(storeName: TStore, value: LinkDb[TStore]['value'], key?: LinkDb[TStore]['key']) {
  const db = await getDb();
  if (key !== undefined) {
    await db.put(storeName, value as never, key as never);
    return;
  }
  await db.put(storeName, value as never);
}

export async function deleteEntity<TStore extends StoreName>(storeName: TStore, key: LinkDb[TStore]['key']) {
  const db = await getDb();
  await db.delete(storeName, key as never);
}
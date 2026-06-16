import type { AppSettings, CharacterProfile, ChatMessage, Conversation, Sticker, StickerGroup, UserProfile, VoomPost, WorldBookEntry } from '@/types/domain';
import { createVisualProfile } from '@/utils/profile';

const now = Date.now();

export const defaultUsers: UserProfile[] = [
  {
    id: '1008600001',
    nickname: 'Linker',
    name: 'Sean',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sean&backgroundColor=06c755',
    description: '白天写代码，深夜把情绪藏进对话框里。偏好慢热关系，会认真记住细节。',
    signature: '今天也想把生活过成一张柔软的照片。',
    boundCharacterIds: ['2000100001', '2000100002'],
    profile: createVisualProfile({
      id: '1008600001',
      nickname: 'Linker',
      name: 'Sean',
      signature: '今天也想把生活过成一张柔软的照片。'
    })
  },
  {
    id: '1008600002',
    nickname: 'Meltline',
    name: 'Mina',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Mina&backgroundColor=f4d8cd',
    description: '更像一个会把心事写进备忘录的人。聊天慢，但表达很细。喜欢 film、cafe 和雨天。',
    signature: 'offline first, feelings later.',
    boundCharacterIds: ['2000100003'],
    profile: createVisualProfile({
      id: '1008600002',
      nickname: 'Meltline',
      name: 'Mina',
      signature: 'offline first, feelings later.'
    })
  }
];

export const defaultCharacters: CharacterProfile[] = [
  {
    id: '2000100001',
    nickname: 'Sokyung.zip',
    name: 'Sokyung',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sokyung&backgroundColor=f4d8cd',
    description: '韩国留学生。回消息不算快，偶尔发很短的语音。说话直接，但不是故意冷淡。最近在便利店兼职，作息有点乱。',
    signature: '便利店夜班后只想安静一点。',
    userNote: '',
    boundUserId: '1008600001',
    subtitle: '[动画表情]',
    lastSeen: '17:40',
    localWorldBookIds: ['wb_local_campus'],
    voomFrequency: 'medium'
  },
  {
    id: '2000100002',
    nickname: 'Sohye._',
    name: 'Sohye',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Sohye&backgroundColor=f2f2f2',
    description: '美术专业。喜欢把事情拖到最后一天，聊天时会突然消失去赶作业。偶尔发韩语。',
    signature: 'ddl 在追我，不是我在追 ddl。',
    userNote: '',
    boundUserId: '1008600001',
    subtitle: '你加班了',
    lastSeen: '17:17',
    localWorldBookIds: ['wb_local_art'],
    voomFrequency: 'low'
  },
  {
    id: '2000100003',
    nickname: 'rin__tokyo',
    name: 'りん',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=Rin&backgroundColor=dbeafe',
    description: '在东京工作的朋友。生活节奏很满，经常隔很久才回。日语和中文混着说。对关系边界很敏感，不喜欢被逼问。',
    signature: '既読つけても、今はまだ返せない。',
    userNote: '',
    boundUserId: '1008600002',
    subtitle: '聞こえませんね',
    lastSeen: '00:49',
    localWorldBookIds: ['wb_local_tokyo'],
    voomFrequency: 'low'
  }
];

export const defaultConversations: Conversation[] = defaultCharacters.map((character, index) => ({
  id: `conv_${character.id}`,
  userId: character.boundUserId,
  charId: character.id,
  title: character.nickname,
  activeMode: 'online',
  updatedAt: now - index * 1000 * 60 * 34,
  unreadCount: index === 0 ? 1 : 0,
  summary: '刚开始通过LINK App 认识，还没有形成稳定关系。'
}));

export const defaultStickerGroups: StickerGroup[] = [
  {
    id: 'sticker_group_default',
    name: 'ganadi',
    createdAt: now,
    updatedAt: now
  }
];

export const defaultStickers: Sticker[] = [
  {
    id: 'sticker_ganadi_stare',
    description: '紧盯着你',
    imageUrl: 'https://img.heliar.top/file/1781413300001_IMG_20260614_125939.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'sticker_ganadi_speechless',
    description: '无语',
    imageUrl: 'https://img.heliar.top/file/1781413305538_IMG_20260614_125924.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 1,
    updatedAt: now - 1
  },
  {
    id: 'sticker_ganadi_like',
    description: '小狗点赞',
    imageUrl: 'https://img.heliar.top/file/1781413297430_IMG_20260614_125856.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 2,
    updatedAt: now - 2
  },
  {
    id: 'sticker_ganadi_love',
    description: '小狗示爱',
    imageUrl: 'https://img.heliar.top/file/1781413298387_IMG_20260614_125848.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 3,
    updatedAt: now - 3
  },
  {
    id: 'sticker_ganadi_wronged',
    description: '小狗委屈',
    imageUrl: 'https://img.heliar.top/file/1781413294473_IMG_20260614_125839.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 4,
    updatedAt: now - 4
  },
  {
    id: 'sticker_ganadi_cry',
    description: '小狗哭泣',
    imageUrl: 'https://img.heliar.top/file/1781413299876_IMG_20260614_125825.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 5,
    updatedAt: now - 5
  },
  {
    id: 'sticker_ganadi_negotiate',
    description: '我需要谈判',
    imageUrl: 'https://img.heliar.top/file/1781413294947_IMG_20260614_125808.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 6,
    updatedAt: now - 6
  },
  {
    id: 'sticker_ganadi_escape',
    description: '就这样狗溜溜的逃离',
    imageUrl: 'https://img.heliar.top/file/1781413295195_IMG_20260614_125749.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 7,
    updatedAt: now - 7
  },
  {
    id: 'sticker_ganadi_court',
    description: '告到小狗法庭',
    imageUrl: 'https://img.heliar.top/file/1781413282665_IMG_20260614_125742.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 8,
    updatedAt: now - 8
  },
  {
    id: 'sticker_ganadi_losing_water',
    description: '正在大量流失水分。',
    imageUrl: 'https://img.heliar.top/file/1781413288631_IMG_20260614_125734.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 9,
    updatedAt: now - 9
  }
];

export const defaultMessages: ChatMessage[] = [
  {
    id: 'msg_seed_1',
    conversationId: 'conv_2000100001',
    sender: 'char',
    mode: 'online',
    content: '[动画表情]',
    createdAt: now - 1000 * 60 * 30,
    status: 'sent'
  },
  {
    id: 'msg_seed_2',
    conversationId: 'conv_2000100002',
    sender: 'char',
    mode: 'online',
    content: '你加班了',
    createdAt: now - 1000 * 60 * 78,
    status: 'sent'
  },
  {
    id: 'msg_seed_3',
    conversationId: 'conv_2000100003',
    sender: 'char',
    mode: 'online',
    content: 'いまむりです?',
    createdAt: now - 1000 * 60 * 180,
    status: 'sent'
  }
];

export const defaultWorldBooks: WorldBookEntry[] = [
  {
    id: 'wb_global_online',
    title: '线上聊天规则',
    scope: 'global-online',
    enabled: true,
    content: '线上模式渲染为即时通讯。角色可以短句、连发、已读不回、隔一段时间再回。不要把每条消息写成小说段落。',
    entries: [{
      id: 'wbe_global_online_rules',
      title: '即时通讯节奏',
      content: '线上模式渲染为即时通讯。角色可以短句、连发、已读不回、隔一段时间再回。不要把每条消息写成小说段落。',
      enabled: true,
      activation: 'constant',
      keys: [],
      secondaryKeys: [],
      position: 'before-chat',
      order: 100,
      depth: 4,
      probability: 100,
      caseSensitive: false
    }],
    coverImage: '',
    coverPrompt: 'linen bookshelf cover, minimal Korean editorial mood, instant messenger etiquette',
    coverNegativePrompt: '',
    coverProvider: ''
  },
  {
    id: 'wb_global_offline',
    title: '线下长文本规则',
    scope: 'global-offline',
    enabled: true,
    content: '线下模式参考 SillyTavern 长文本 RP，输出更像小说段落，但仍保持角色视角、认知边界和对话连续性。',
    entries: [{
      id: 'wbe_global_offline_rules',
      title: '长文本 RP 节奏',
      content: '线下模式参考 SillyTavern 长文本 RP，输出更像小说段落，但仍保持角色视角、认知边界和对话连续性。',
      enabled: true,
      activation: 'constant',
      keys: [],
      secondaryKeys: [],
      position: 'before-chat',
      order: 100,
      depth: 4,
      probability: 100,
      caseSensitive: false
    }],
    coverImage: '',
    coverPrompt: 'quiet novel cover, Seoul bookstore mood, warm beige layout, literary fiction',
    coverNegativePrompt: '',
    coverProvider: ''
  },
  {
    id: 'wb_local_campus',
    title: '校园与兼职',
    scope: 'local',
    enabled: true,
    content: 'Sokyung 最近在便利店兼职，晚上更容易累，白天有课。',
    entries: [{
      id: 'wbe_local_campus_shift',
      title: '便利店与课程',
      content: 'Sokyung 最近在便利店兼职，晚上更容易累，白天有课。',
      enabled: true,
      activation: 'constant',
      keys: [],
      secondaryKeys: [],
      position: 'before-chat',
      order: 100,
      depth: 4,
      probability: 100,
      caseSensitive: false
    }],
    coverImage: '',
    coverPrompt: 'soft campus diary cover, Korean ins bookstore shelf, convenience store night light',
    coverNegativePrompt: '',
    coverProvider: ''
  },
  {
    id: 'wb_local_art',
    title: '美术作业',
    scope: 'local',
    enabled: true,
    content: 'Sohye 的作业经常拖延，ddl 前会情绪差。',
    entries: [{
      id: 'wbe_local_art_deadline',
      title: '作业与 ddl',
      content: 'Sohye 的作业经常拖延，ddl 前会情绪差。',
      enabled: true,
      activation: 'constant',
      keys: [],
      secondaryKeys: [],
      position: 'before-chat',
      order: 100,
      depth: 4,
      probability: 100,
      caseSensitive: false
    }],
    coverImage: '',
    coverPrompt: 'editorial sketchbook cover, cream paper texture, Korean art school mood',
    coverNegativePrompt: '',
    coverProvider: ''
  },
  {
    id: 'wb_local_tokyo',
    title: '东京生活',
    scope: 'local',
    enabled: true,
    content: 'りん在东京工作，通勤时间长，常在深夜回消息。',
    entries: [{
      id: 'wbe_local_tokyo_commute',
      title: '通勤与深夜',
      content: 'りん在东京工作，通勤时间长，常在深夜回消息。',
      enabled: true,
      activation: 'constant',
      keys: [],
      secondaryKeys: [],
      position: 'before-chat',
      order: 100,
      depth: 4,
      probability: 100,
      caseSensitive: false
    }],
    coverImage: '',
    coverPrompt: 'midnight commute pocket book cover, muted city glow, Korean magazine styling',
    coverNegativePrompt: '',
    coverProvider: ''
  }
];

export const defaultVoomPosts: VoomPost[] = [
  {
    id: 'voom_seed_1',
    charId: '2000100001',
    conversationId: 'conv_2000100001',
    authorName: 'Sokyung.zip',
    authorAvatar: defaultCharacters[0].avatar,
    content: '今天便利店的饭团只剩金枪鱼味。也行。',
    imageDescription: '便利店白色灯光下的金枪鱼饭团和冰咖啡，旁边露出一点收银台边角。',
    imageProvider: 'mock',
    createdAt: now - 1000 * 60 * 60 * 4,
    likes: ['Minji'],
    comments: [{ id: 'comment_seed_1', authorName: 'Jae', content: '金枪鱼最好吃' }]
  }
];

export const defaultSettings: AppSettings = {
  activeUserId: '1008600001',
  apiEndpoint: '',
  apiKey: '',
  model: 'gpt-compatible-model',
  autoGenerateVoom: true,
  disclaimerAccepted: false,
  ttsEnabled: false,
  ttsVoice: 'alloy',
  ttsPlaybackMode: 'manual',
  imageModel: 'gpt-image-1',
  imageSize: '1024x1024',
  imagePromptPrefix: '',
  imageOpenAi: {
    activeVendorId: '',
    size: '1024x1024',
    positivePrompt: '',
    negativePrompt: '',
    lastImageUrl: '',
    vendors: []
  },
  imageNovelAi: {
    apiUrl: 'https://image.novelai.net',
    proxyUrl: '',
    apiKey: '',
    model: 'nai-diffusion-4-5-curated-preview',
    positivePrompt: '',
    negativePrompt: '',
    width: 832,
    height: 1216,
    guidance: 6.5,
    steps: 28,
    sampler: 'k_euler_ancestral',
    seed: '',
    lastImageUrl: ''
  },
  imagePollinations: {
    apiKey: '',
    referrer: 'link-pwa',
    model: 'flux',
    positivePrompt: '',
    negativePrompt: '',
    width: 1024,
    height: 1024,
    seed: '',
    enhance: true,
    nologo: true,
    private: true,
    lastImageUrl: ''
  },
  voomImageProvider: '',
  voomImageModel: '',
  imagePrivateOnly: true,
  apiVendors: []
};
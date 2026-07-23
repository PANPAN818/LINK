import { generateImageByProvider, hasTextGenerationConfig, requestTextGeneration, type TextGenerationOptions } from '@/services/ai';
import type {
  AppSettings,
  CharacterProfile,
  FanficBook,
  FanficChapter,
  FanficComment,
  FanficCreativeDna,
  FanficOutlineChapter,
  FanficStoryBible,
  FanficTopic,
  UserProfile,
  WorldBookEntry
} from '@/types/domain';
import { createId } from '@/utils/id';
import { defaultFanficStoryBible, normalizeFanficCreativeDna, serializeFanficLocalWorldBooks } from '@/utils/fanfic';
import { parseFanficJsonResponse } from '@/utils/fanficJson';
import { getSelectedImageModelOption } from '@/utils/settings';

export { parseFanficJsonResponse } from '@/utils/fanficJson';

export interface FanficCreationPreferences {
  tone: string;
  pov: string;
  endingPreference: string;
  chapterTarget: number;
  contentBoundaries: string[];
  extraGuidance: string;
}

export interface FanficBookPlan {
  title: string;
  authorName: string;
  summary: string;
  genre: string;
  tags: string[];
  topicPitch: string;
  tone: string;
  pov: string;
  endingPreference: string;
  contentBoundaries: string[];
  coverPrompt: string;
  coverPalette: string[];
  storyBible: FanficStoryBible;
  outline: FanficOutlineChapter[];
}

export interface FanficChapterBundle {
  chapter: FanficChapter;
  comments: FanficComment[];
  bookComments: FanficComment[];
}

interface RawChapterBundle {
  chapter?: {
    title?: unknown;
    paragraphs?: unknown;
    summary?: unknown;
    continuity?: unknown;
    hotspots?: unknown;
    nextDirections?: unknown;
  };
  comments?: unknown;
  bookComments?: unknown;
}

const commentNames = ['吃瓜不迟到', '今天也想催更', '小猫不加班', '奶茶续命中', '不想早八', '认真看文', '蹲个后续', '橘子汽水', '路过的读者', '三分钟看完', '别鸽我', '我先投一票', '熬夜看两章', '这波我站你'];
const fallbackAuthorNames = ['小满写字', '南风不晚', '阿梨有话说', '山止川行', '半糖不加冰', '一颗青梅', '今天也更新', '纸上小舟'];
const fallbackTrendKeywords = ['现言脑洞', '古言脑洞', '青春甜宠', '职场婚恋', '年代重生', '豪门总裁', '种田经营', '快穿虐渣', '玄幻言情', '女频悬疑', '星光璀璨', '末世基建', '宫斗宅斗', '科幻末世'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function asString(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function asStringArray(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => asString(entry)).filter(Boolean))].slice(0, limit);
}

async function requestFanficJson(
  settings: AppSettings | undefined,
  prompt: string,
  options: TextGenerationOptions,
  validate: (value: unknown) => boolean = () => true
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptPrompt = attempt === 0
      ? prompt
      : `${prompt}\n\n重要重试要求：上一次响应不是可解析的完整 JSON。请从头重新生成全部字段，使用紧凑 JSON，不要 Markdown 代码块，不要解释，不要省略结尾的引号、数组或花括号。`;
    const reply = await requestTextGeneration(settings, attemptPrompt, '', {
      ...options,
      jsonMode: true,
      temperature: attempt === 0 ? options.temperature : Math.min(options.temperature ?? 0.9, 0.72),
      maxTokens: options.maxTokens ? Math.min(8192, options.maxTokens + attempt * 800) : undefined
    });
    try {
      const parsed = parseFanficJsonResponse(reply);
      if (!validate(parsed)) throw new Error('文本模型返回的 JSON 缺少必要字段。');
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }
  const reason = lastError instanceof Error ? lastError.message : 'JSON 结构无效。';
  throw new Error(`${reason} 已自动修复并重试仍未成功，请检查当前模型的最大输出长度。`);
}

function countFanficCharacters(content: string) {
  return [...content.replace(/\s+/g, '')].length;
}

function normalizeChapterTarget(value: number) {
  const target = Math.round(Number(value) || 12);
  return Math.min(30, Math.max(4, target));
}

function normalizePalette(value: unknown) {
  const colors = asStringArray(value, 3).filter((entry) => /^#[0-9a-f]{6}$/i.test(entry));
  return [...colors, '#f2d7d9', '#dce7de', '#f8f1e4'].slice(0, 3);
}

function stableIndex(value: string, length: number) {
  if (!length) return 0;
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0) % length;
}

function fallbackAuthorName(title: string) {
  return fallbackAuthorNames[stableIndex(title, fallbackAuthorNames.length)];
}

function isNoRomanceBook(book: Pick<FanficBook, 'tags' | 'topicTitle' | 'genre'>) {
  return [...book.tags, book.topicTitle, book.genre].some((value) => value.includes('无 CP') || value.includes('无感情') || value.includes('纯事业'));
}

function normalizeStoryBible(value: unknown): FanficStoryBible {
  const source = isRecord(value) ? value : {};
  const supportingCharacters = Array.isArray(source.supportingCharacters)
    ? source.supportingCharacters.flatMap((entry) => {
        if (!isRecord(entry)) return [];
        const name = asString(entry.name);
        if (!name) return [];
        return [{
          name,
          role: asString(entry.role, '重要配角'),
          goal: asString(entry.goal),
          secret: asString(entry.secret)
        }];
      }).slice(0, 8)
    : [];
  return {
    ...defaultFanficStoryBible(),
    premise: asString(source.premise),
    era: asString(source.era, '架空当代'),
    locations: asStringArray(source.locations, 8),
    worldRules: asStringArray(source.worldRules, 10),
    supportingCharacters,
    relationshipArc: asString(source.relationshipArc),
    coreMystery: asString(source.coreMystery),
    motifs: asStringArray(source.motifs, 6)
  };
}

function normalizeOutline(value: unknown, chapterTarget: number, topic: FanficTopic): FanficOutlineChapter[] {
  const createFallbackEntry = (order: number): FanficOutlineChapter => {
    const seed = topic.commercialSeed;
    const isFirst = order === 1;
    const isLast = order === chapterTarget;
    const title = isFirst ? '开局就有事' : isLast ? '把账算清楚' : order === 2 ? '第一次反击' : order === 3 ? '对手出招' : order % 3 === 1 ? '拿到阶段成果' : '局面再升级';
    return {
      order,
      title,
      premise: isFirst
        ? seed?.openingProblem || topic.hook
        : isLast
          ? `完成${seed?.immediateGoal || '核心目标'}，回应前文留下的关键问题。`
          : `${seed?.immediateGoal || '推进当前目标'}，并让新的阻力迫使两位主角调整计划。`,
      emotionalBeat: isNoRomanceBook({ tags: topic.tags, topicTitle: topic.title, genre: topic.categoryLabel || '' })
        ? '双方在方法分歧中确认共同目标，事业伙伴关系更牢固。'
        : '双方在一次具体选择中更了解彼此，关系向前推进。',
      cliffhanger: isLast ? '主要冲突得到回收，留下完整而有余味的结尾。' : `${seed?.escalation || '新的对手或代价出现'}，下一章必须马上回应。`
    };
  };
  const rawOutline = Array.isArray(value) ? value : [];
  const outline = rawOutline.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const order = index + 1;
    const fallback = createFallbackEntry(order);
    return [{
      order,
      title: asString(entry.title, fallback.title),
      premise: asString(entry.premise, fallback.premise),
      emotionalBeat: asString(entry.emotionalBeat, fallback.emotionalBeat),
      cliffhanger: asString(entry.cliffhanger, fallback.cliffhanger)
    }];
  }).slice(0, chapterTarget);
  while (outline.length < chapterTarget) {
    const order = outline.length + 1;
    outline.push(createFallbackEntry(order));
  }
  return outline;
}

function creativeDnaForWriter(dna: FanficCreativeDna) {
  return {
    userTraits: dna.userTraits,
    characterTraits: dna.characterTraits,
    chemistry: dna.chemistry,
    narrativeBoundaries: dna.narrativeBoundaries
  };
}

export async function distillFanficCreativeDna(input: {
  user: UserProfile;
  character: CharacterProfile;
  userName: string;
  characterName: string;
  localWorldBooks?: WorldBookEntry[];
  settings?: AppSettings;
}) {
  const localWorldBookMaterial = serializeFanficLocalWorldBooks(input.localWorldBooks ?? []);
  const prompt = [
    '你是原创小说的人物气质提炼器。只做抽象提炼，不写故事。',
    '下面的用户资料、角色资料和角色绑定的局部世界书，只允许用于判断人格倾向、价值观、表达节奏、行为边界和两人可能形成的关系化学反应。局部世界书是本角色的补充设定来源，但仍只做抽象提炼。',
    '严禁把资料里的职业、年龄、时代、地点、组织、家庭、社会关系、能力、经历、事件、口头禅、原句、专有名词或世界观直接带入 DNA 或后续小说；这些内容必须列入 forbiddenCarryovers。',
    `用户唯一真名：${input.userName}`,
    `角色唯一真名：${input.characterName}`,
    `用户资料：${input.user.description || '未填写'}`,
    `角色资料：${input.character.description || '未填写'}`,
    `角色绑定且启用的局部世界书：${JSON.stringify(localWorldBookMaterial.length ? localWorldBookMaterial : '无')}`,
    '输出 JSON：{"userTraits":[3-6个抽象短语],"characterTraits":[3-6个抽象短语],"chemistry":[3-6个关系动力短语],"narrativeBoundaries":[创作边界],"forbiddenCarryovers":[用户资料、角色资料和局部世界书中不得复用的专有名词、职业、地点、经历、能力、规则或原句片段，使用短词列出]}。',
    'userTraits、characterTraits、chemistry 不得连续复制任一资料中 8 个以上汉字；除双方真名外不要输出资料中的完整句子。只输出 JSON。'
  ].join('\n\n');
  const parsed = await requestFanficJson(
    input.settings,
    prompt,
    { temperature: 0.35, maxTokens: 2200 },
    (value) => isRecord(value) && Array.isArray(value.userTraits) && Array.isArray(value.characterTraits) && Array.isArray(value.chemistry)
  );
  return normalizeFanficCreativeDna(isRecord(parsed) ? parsed : {});
}

export async function generateFanficBookPlan(input: {
  userName: string;
  characterName: string;
  creativeDna: FanficCreativeDna;
  topic: FanficTopic;
  preferences: FanficCreationPreferences;
  settings?: AppSettings;
}): Promise<FanficBookPlan> {
  const chapterTarget = normalizeChapterTarget(input.preferences.chapterTarget);
  const noRomance = input.topic.categoryId === 'no-romance' || input.topic.tags.some((tag) => tag.includes('无 CP'));
  const prompt = [
    '你是原创中文女频连载小说的策划编辑。目标是清楚、直给、好读、能追更的商业网文，不是散文、电影分镜、文学短篇或高概念实验。创建一部全新平行世界小说，唯一双主角必须是用户真名与角色真名。',
    `双主角真名：${input.userName}、${input.characterName}。只能使用这两个真名指代双主角，不得创造替代名、网名或沿用任何旧称呼。`,
    `抽象人物 DNA：${JSON.stringify(creativeDnaForWriter(input.creativeDna))}`,
    `题材商业种子：${JSON.stringify({ title: input.topic.title, hook: input.topic.hook, setting: input.topic.setting, conflict: input.topic.conflict, relationship: input.topic.relationship, tags: input.topic.tags, commercialSeed: input.topic.commercialSeed })}`,
    `创作偏好：${JSON.stringify({ ...input.preferences, chapterTarget })}`,
    '原创铁律：所有时代、地点、职业、身份、能力、组织、家庭、相识过程、共同经历、事件、台词和世界规则都必须从零原创；不得引用任何既有作品、真实作者、明星、IP 或原人物设定。',
    '双方必须同等重要，每章都要推动两人的行动线或关系线；配角只能服务于双主角主线。不要模仿任何真实作者、平台作品或具体作品表达。',
    '商业连载规则：简介先给标签和人物关系，再说开局困境、主动选择、对手或风险和可预期回报；书名要直观呈现身份、关系、目标或危机，避免只有意象的抽象标题。第一章前 300 字内必须出现具体地点、正在发生的麻烦和两位主角的主动动作。',
    `规划恰好 ${chapterTarget} 章，每章约 2500 字。第 1 章完成开局冲突和第一次小回报；第 2-3 章让对手或代价升级；中段每章都有小目标、阻力、转折和阶段结果；最后一章完成主要冲突。${noRomance ? '这是无 CP 题材：用户与角色仍是唯一双主角，只写事业、知己或战友情，不安排恋爱线。' : '感情线必须通过对话、行动、边界变化和具体事件推进，不用抽象抒情代替互动。'}`,
    '书名 4-18 个汉字，避免“无尽、寂静、终焉、月光”等空泛意象堆叠；笔名 2-6 个汉字、像真实读者会看到的个人笔名，不得含“编辑部、工作室、AI、系统、佚名、匿名”，也不能使用双主角真名。',
    '输出严格 JSON：{"title":"直白有卖点的原创书名","authorName":"2-6字虚构个人笔名","summary":"100-180字、标签先行且交代开局冲突和回报的简介","genre":"类型","tags":[5-8个清晰标签],"topicPitch":"一句话读者卖点","tone":"基调","pov":"叙事视角","endingPreference":"结局倾向","contentBoundaries":[边界],"coverPrompt":"不含文字和真人肖像的英文封面底图提示词","coverPalette":[三个#RRGGBB],"storyBible":{"premise":"一句话核心前提","era":"原创时代","locations":[地点],"worldRules":[规则],"supportingCharacters":[{"name":"原创配角真名","role":"作用","goal":"目标","secret":"秘密"}],"relationshipArc":"关系弧线","coreMystery":"核心问题","motifs":[意象]},"outline":[{"order":1,"title":"直接表达事件或冲突的章名","premise":"本章小目标、阻力和结果","emotionalBeat":"由行动体现的关系变化","cliffhanger":"下一章必须回应的具体问题"}]}。只输出 JSON。'
  ].join('\n\n');
  const parsed = await requestFanficJson(
    input.settings,
    prompt,
    { temperature: 0.78, maxTokens: Math.min(7600, 2400 + chapterTarget * 260) },
    (value) => isRecord(value) && Boolean(asString(value.title)) && Boolean(asString(value.summary)) && isRecord(value.storyBible) && Array.isArray(value.outline)
  );
  if (!isRecord(parsed)) throw new Error('小说规划返回格式无效。');
  const title = asString(parsed.title);
  if (!title) throw new Error('小说规划缺少书名。');
  const authorNameCandidate = asString(parsed.authorName);
  const blockedNames = new Set([input.userName, input.characterName]);
  const authorIsBlocked = !authorNameCandidate
    || authorNameCandidate.length > 12
    || [...blockedNames].some((name) => name && authorNameCandidate.includes(name))
    || /编辑部|工作室|AI|系统|佚名|匿名|作者/.test(authorNameCandidate);
  const authorName = authorIsBlocked ? fallbackAuthorName(title) : authorNameCandidate;
  const tags = asStringArray([...input.topic.tags, ...asStringArray(parsed.tags, 8)], 8);
  return {
    title,
    authorName,
    summary: asString(parsed.summary, input.topic.hook),
    genre: asString(parsed.genre, input.topic.tags[0] || '原创故事'),
    tags,
    topicPitch: asString(parsed.topicPitch, input.topic.hook),
    tone: asString(parsed.tone, input.preferences.tone),
    pov: asString(parsed.pov, input.preferences.pov),
    endingPreference: asString(parsed.endingPreference, input.preferences.endingPreference),
    contentBoundaries: asStringArray(parsed.contentBoundaries, 12).length ? asStringArray(parsed.contentBoundaries, 12) : input.preferences.contentBoundaries,
    coverPrompt: asString(parsed.coverPrompt, `editorial book cover, ${input.topic.setting}, two symbolic silhouettes, Korean indie magazine aesthetic, no text`),
    coverPalette: normalizePalette(parsed.coverPalette),
    storyBible: normalizeStoryBible(parsed.storyBible),
    outline: normalizeOutline(parsed.outline, chapterTarget, input.topic)
  };
}

function normalizeRawComments(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const content = asString(entry.content);
    if (!content) return [];
    return [{
      hotspotKey: asString(entry.hotspotKey),
      authorName: asString(entry.authorName, commentNames[index % commentNames.length]),
      content,
      replyTo: Number.isInteger(Number(entry.replyTo)) ? Number(entry.replyTo) : -1,
      likes: Math.min(9999, Math.max(0, Math.round(Number(entry.likes) || 0)))
    }];
  }).slice(0, 20);
}

function generatedReaderName(candidate: string, index: number, blockedNames: Set<string>) {
  const blocked = !candidate
    || candidate.length > 18
    || [...blockedNames].some((name) => name && candidate.includes(name))
    || /作者|官方|管理员|编辑部|工作室/.test(candidate);
  return blocked ? commentNames[index % commentNames.length] : candidate;
}

function createFallbackChapterComments(book: FanficBook, chapter: FanficChapter): FanficComment[] {
  const hotspots = chapter.hotspots.length ? chapter.hotspots : [{ id: '', label: '本章高潮', excerpt: chapter.paragraphs.at(-1)?.text.slice(0, 46) || chapter.title }];
  const noRomance = isNoRomanceBook(book);
  const templates = [
    (hotspot: { label: string }) => `${hotspot.label}这一下真没想到。`,
    () => `${book.userName}这次没退，爽了。`,
    () => `${book.characterName}这个反应我记住了，后面肯定还有事。`,
    () => noRomance ? '这对事业搭档都在认真做事，看着太舒服了。' : '两个人嘴上没说，行动已经很明显了。',
    () => '等等，前面那个小细节是不是伏笔？',
    () => '先别急着下结论，我感觉还有一层。',
    () => '这一章节奏可以，冲突和结果都给到了。',
    () => '我刚想夸两句，结果又卡在这里。',
    () => '回复楼上：我也觉得没这么简单。',
    () => '下一章先看谁出手，我站主角这边。',
    () => '不是只会说狠话，真的把事情办成了。',
    () => '回复：一起蹲，更新了喊我。',
    () => '作者快更，别逼我回来刷新。',
    () => '这个对手终于上强度了，继续。',
    () => noRomance ? '回复：不用恋爱也好看，是并肩赢下来的感觉。' : '回复：感情别一下说透，就按这个速度拉扯。'
  ];
  const targetCount = hotspots.length >= 3 ? 15 : 12;
  const ids = Array.from({ length: targetCount }, () => createId('fanfic_comment'));
  const now = Date.now();
  return ids.map((id, index) => {
    const hotspot = hotspots[index % hotspots.length];
    return {
      id,
      bookId: book.id,
      chapterId: chapter.id,
      hotspotId: hotspot.id || undefined,
      scope: 'chapter' as const,
      authorType: 'generated' as const,
      authorName: commentNames[index % commentNames.length],
      avatarSeed: `fanfic-reader-${index}`,
      content: templates[index % templates.length](hotspot),
      parentId: index === 8 ? ids[5] : index === 11 ? ids[7] : index === 14 ? ids[10] : undefined,
      likes: 3 + ((index * 7) % 46),
      createdAt: now + index
    };
  });
}

function createFallbackBookComments(book: FanficBook, chapter: FanficChapter): FanficComment[] {
  const noRomance = isNoRomanceBook(book);
  const contents = [
    '标签和简介说得很清楚，我知道这本要看什么。',
    `第一章《${chapter.title}》开局就有事，没有绕半天。`,
    `${book.userName}和${book.characterName}都在主动解决问题，不是谁给谁当背景板。`,
    noRomance ? '无感情线也有双主角羁绊，这个方向可以。' : '感情线先靠行动推进，这个速度正好。',
    '章名很直白，目录看着就想继续点。',
    '先加入书架，蹲下一章兑现。'
  ];
  const now = Date.now();
  return contents.map((content, index) => ({
    id: createId('fanfic_comment'),
    bookId: book.id,
    scope: 'book',
    authorType: 'generated',
    authorName: commentNames[(index + 5) % commentNames.length],
    avatarSeed: `fanfic-book-reader-${index}`,
    content,
    likes: 8 + index * 7,
    createdAt: now + index
  }));
}

function normalizeChapterBundle(raw: RawChapterBundle, input: { book: FanficBook; order: number; includeBookComments: boolean }): FanficChapterBundle {
  const rawChapter = isRecord(raw.chapter) ? raw.chapter : {};
  const paragraphTexts = asStringArray(rawChapter.paragraphs, 60);
  if (paragraphTexts.length < 6) throw new Error('章节正文不完整，请重试。');
  const chapterId = createId('fanfic_chapter');
  const now = Date.now();
  const paragraphs = paragraphTexts.map((text, index) => ({ id: `${chapterId}_p${index + 1}`, text }));
  const rawHotspots = Array.isArray(rawChapter.hotspots) ? rawChapter.hotspots : [];
  const hotspotKeyToId = new Map<string, string>();
  const hotspots = rawHotspots.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const requestedIndex = Math.round(Number(entry.paragraphIndex) || 0) - 1;
    const paragraphIndex = Math.min(paragraphs.length - 1, Math.max(0, requestedIndex >= 0 ? requestedIndex : paragraphs.length - 1));
    const paragraph = paragraphs[paragraphIndex];
    const id = createId('fanfic_hotspot');
    hotspotKeyToId.set(asString(entry.key, `hotspot-${index + 1}`), id);
    return [{
      id,
      paragraphId: paragraph.id,
      label: asString(entry.label, `高潮 ${index + 1}`),
      excerpt: asString(entry.excerpt, paragraph.text.slice(0, 64)),
      reason: asString(entry.reason, '本章情绪或剧情转折点。'),
      commentCount: 0
    }];
  }).slice(0, 3);
  if (!hotspots.length) {
    const paragraph = paragraphs[Math.max(0, paragraphs.length - 2)];
    const id = createId('fanfic_hotspot');
    hotspotKeyToId.set('hotspot-1', id);
    hotspots.push({ id, paragraphId: paragraph.id, label: '本章高潮', excerpt: paragraph.text.slice(0, 64), reason: '本章主要转折点。', commentCount: 0 });
  }
  const content = paragraphs.map((paragraph) => paragraph.text).join('\n\n');
  const chapter: FanficChapter = {
    id: chapterId,
    bookId: input.book.id,
    order: input.order,
    title: asString(rawChapter.title, input.book.outline[input.order - 1]?.title || `第${input.order}章`),
    content,
    paragraphs,
    summary: asString(rawChapter.summary, content.slice(0, 180)),
    continuity: asStringArray(rawChapter.continuity, 16),
    hotspots,
    nextDirections: asStringArray(rawChapter.nextDirections, 3),
    wordCount: countFanficCharacters(content),
    status: 'published',
    model: '',
    createdAt: now,
    updatedAt: now
  };
  const blockedAuthorNames = new Set([input.book.userName, input.book.characterName]);
  const rawComments = normalizeRawComments(raw.comments);
  const generatedCommentIds = rawComments.map(() => createId('fanfic_comment'));
  let comments: FanficComment[] = rawComments.map((entry, index) => ({
    id: generatedCommentIds[index],
    bookId: input.book.id,
    chapterId,
    hotspotId: hotspotKeyToId.get(entry.hotspotKey) || hotspots[index % hotspots.length]?.id,
    scope: 'chapter',
    authorType: 'generated',
    authorName: generatedReaderName(entry.authorName, index, blockedAuthorNames),
    avatarSeed: `fanfic-reader-${entry.authorName}-${index}`,
    content: entry.content,
    parentId: entry.replyTo >= 0 && entry.replyTo < index ? generatedCommentIds[entry.replyTo] : undefined,
    likes: entry.likes,
    createdAt: now + index
  }));
  if (comments.length < 12) comments = createFallbackChapterComments(input.book, chapter);
  const commentCountByHotspot = new Map<string, number>();
  comments.forEach((comment) => {
    if (!comment.hotspotId) return;
    commentCountByHotspot.set(comment.hotspotId, (commentCountByHotspot.get(comment.hotspotId) ?? 0) + 1);
  });
  chapter.hotspots = chapter.hotspots.map((hotspot) => ({ ...hotspot, commentCount: commentCountByHotspot.get(hotspot.id) ?? 0 }));

  const rawBookComments = input.includeBookComments ? normalizeRawComments(raw.bookComments) : [];
  let bookComments: FanficComment[] = rawBookComments.map((entry, index) => ({
    id: createId('fanfic_comment'),
    bookId: input.book.id,
    scope: 'book',
    authorType: 'generated',
    authorName: generatedReaderName(entry.authorName, index + 4, blockedAuthorNames),
    avatarSeed: `fanfic-book-reader-${entry.authorName}-${index}`,
    content: entry.content,
    likes: entry.likes,
    createdAt: now + index
  }));
  if (input.includeBookComments && bookComments.length < 5) bookComments = createFallbackBookComments(input.book, chapter);
  return { chapter, comments, bookComments };
}

function buildChapterPrompt(input: {
  book: FanficBook;
  order: number;
  previousChapters: FanficChapter[];
  direction?: string;
  strictLength?: boolean;
  includeBookComments: boolean;
}) {
  const outline = input.book.outline[input.order - 1];
  const previousContext = input.previousChapters.slice(-3).map((chapter) => ({ order: chapter.order, title: chapter.title, summary: chapter.summary, continuity: chapter.continuity }));
  const noRomance = isNoRomanceBook(input.book);
  const chapterStage = input.order === 1
    ? '首章：前 300 字内让麻烦发生，两位主角都出场并行动；本章结束前完成第一次应对或小反击，同时抛出更大的具体问题。'
    : input.order === 2
      ? '第二章：承接首章后果，不重复解释背景；让对手、规则或现实代价第一次正面升级，并给出新的阶段结果。'
      : input.order === 3
        ? '第三章：兑现前三章的第一个明确承诺，让两位主角赢下一小局或付出真实代价，再打开中段主线。'
        : input.order >= input.book.chapterTarget
          ? '收官章：解决主要冲突、回收关键事实并完成双方选择；结尾完整，不用突然加新反派制造悬空。'
          : '连载中段：本章必须有独立小目标、阻碍、转折和阶段结果；前半章就推进事件，章末留下下一章必须回应的具体问题。';
  return [
    '你是原创中文女频连载网文作者，同时负责生成虚构读者评论。一次性生成一章完整正文、该章高潮锚点、对应章评；如果是第一章，同时生成整本书的首批书评。目标是清楚、直给、好读、能追更，不是散文、电影分镜、文学实验或编辑点评。',
    `唯一双主角真名：${input.book.userName}、${input.book.characterName}。两人必须拥有同等叙事重量；不得使用昵称、替代名或让配角成为主角。`,
    `抽象人物 DNA：${JSON.stringify(creativeDnaForWriter(input.book.creativeDna))}`,
    `本书原创世界圣经：${JSON.stringify(input.book.storyBible)}`,
    `本书信息：${JSON.stringify({ title: input.book.title, summary: input.book.summary, genre: input.book.genre, tags: input.book.tags, topicTitle: input.book.topicTitle, topicPitch: input.book.topicPitch, tone: input.book.tone, pov: input.book.pov, endingPreference: input.book.endingPreference, contentBoundaries: input.book.contentBoundaries })}`,
    `本章序号：${input.order}；本章大纲：${JSON.stringify(outline ?? {})}`,
    `前文摘要与连续性：${JSON.stringify(previousContext)}；全书事实账本：${JSON.stringify(input.book.continuity)}`,
    input.direction?.trim() ? `用户选择的发展方向：${input.direction.trim()}` : '发展方向：严格沿本章大纲自然推进。',
    `正文要求：去除空白后目标 2500 个中文字符，允许范围 ${input.strictLength ? '2300-2750' : '2200-2850'}；分成 16-28 个自然段。不能用梗概、列表、章节预告代替正文。`,
    `本章连载节奏：${chapterStage}`,
    '正文写法：先写人物正在做什么、出了什么问题、现在要怎么办，再补必要设定；多用具体动作、有效对白、选择和结果。单段通常 40-180 字，对话要推动决定或暴露立场。每 400-600 字至少发生一次新信息、阻碍、反击或关系变化。',
    '禁止写法：不要用长篇景物、梦境、意识流或空泛内心独白开场；不要堆叠“宿命、深渊、月光、寂静、雾、时间尽头”等抽象意象；不要故作深奥、连续设问、只说氛围不说事件，也不要让角色反复复盘读者已经知道的内容。',
    `关系要求：${noRomance ? '这是无 CP 双主角故事，只写事业伙伴、战友或知己羁绊，不安排暧昧、亲吻、告白、吃醋或恋爱结局。' : '感情通过共同做事、有效对话、边界变化和公开选择推进；本章至少有一次能看见的关系进展，但不要突然告白或只靠旁白说心动。'}`,
    '章名必须用 4-18 个汉字直接表达本章事件、行动、冲突、结果或疑问，避免只有天气、花、月、梦、回声等意象的抽象章名。高潮锚点必须对应正文真实段落，标签用“当众反击、真相出现、第一次并肩”等直白短语。三个下一章方向都要写成可执行的行动选择。',
    '剧情要求：本章必须有完整的小目标、升级过程、明确高潮和阶段结果；双主角都要主动行动；高潮必须改变事实或关系；结尾钩子必须是新证据、新对手、新期限或一个无法回避的选择。',
    '原创要求：只使用本书世界圣经，不得引入任何原角色背景、聊天经历、世界书、现实明星、真实作者、现成 IP 或榜单作品元素。不得解释创作规则。',
    '章评要求：选择 2-3 个真正改变局面的自然段，总计生成 12-16 条评论。读者语气要像正在追网文：有 4-12 字短反应、针对具体动作的站队或吐槽、关系嗑点或事业高光、伏笔猜测、催更，也要有 2-4 条回复前面评论的楼中楼。长短和语气必须不同，允许口语和感叹，但不要全是“啊啊啊”，不要写成文学赏析、剧情总结或编辑审稿。',
    '评论只能讨论本章已经出现的细节，不得剧透大纲或编造正文里没有发生的事。虚构读者名要像普通网络昵称，彼此不同，不得使用双主角真名、作者名或“官方、编辑部、管理员”。replyTo 只能指向当前评论之前的有效下标。',
    input.includeBookComments ? '另生成 5-6 条整本书评论，围绕标签是否清楚、简介卖点、首章节奏、双主角表现和是否想追更；语气自然简短，不评价模型、提示词或创作规则，不剧透后续大纲。' : 'bookComments 输出空数组。',
    '输出单行紧凑 JSON：{"chapter":{"title":"章名","paragraphs":["自然段"],"summary":"80-120字本章摘要","continuity":["新增事实或未解伏笔"],"hotspots":[{"key":"h1","paragraphIndex":从1开始的段落序号,"label":"高潮短标签","excerpt":"对应短摘录","reason":"为何是高潮"}],"nextDirections":["三个下一章可选方向"]},"comments":[{"hotspotKey":"h1","authorName":"虚构读者名","content":"具体评论","replyTo":-1或此前评论下标,"likes":数字}],"bookComments":[同结构但无需hotspotKey]}。只输出 JSON。'
  ].filter(Boolean).join('\n\n');
}

export async function generateFanficChapterWithComments(input: {
  book: FanficBook;
  order: number;
  previousChapters: FanficChapter[];
  direction?: string;
  settings?: AppSettings;
}): Promise<FanficChapterBundle> {
  const includeBookComments = input.order === 1;
  let bestBundle: FanficChapterBundle | null = null;
  let lastStructureError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = buildChapterPrompt({ ...input, strictLength: attempt > 0, includeBookComments });
    const parsed = await requestFanficJson(
      input.settings,
      prompt,
      {
        temperature: attempt ? 0.68 : 0.82,
        maxTokens: attempt ? 8192 : 7800
      },
      (value) => isRecord(value) && isRecord(value.chapter) && Array.isArray(value.chapter.paragraphs) && value.chapter.paragraphs.length >= 6
    );
    let bundle: FanficChapterBundle;
    try {
      bundle = normalizeChapterBundle(isRecord(parsed) ? parsed as RawChapterBundle : {}, { book: input.book, order: input.order, includeBookComments });
    } catch (error) {
      lastStructureError = error;
      if (attempt === 1) throw error;
      continue;
    }
    bundle.chapter.model = input.settings?.model || undefined;
    if (!bestBundle || Math.abs(bundle.chapter.wordCount - 2500) < Math.abs(bestBundle.chapter.wordCount - 2500)) bestBundle = bundle;
    if (bundle.chapter.wordCount >= 2100 && bundle.chapter.wordCount <= 3000) return bundle;
  }
  if (!bestBundle) {
    throw lastStructureError instanceof Error ? lastStructureError : new Error('章节与评论生成失败。');
  }
  if (bestBundle.chapter.wordCount < 1800) throw new Error(`章节仅生成 ${bestBundle.chapter.wordCount} 字，未达到可发布长度，请重试。`);
  return bestBundle;
}

export async function fetchFanficTrendKeywords() {
  const response = await fetch('/api/fanfic/trends', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(response.status === 401 ? '联网题材需要先通过访问验证。' : '暂时无法获取联网题材，请稍后重试。');
  const payload = await response.json() as { keywords?: unknown; fetchedAt?: unknown; sourceLabel?: unknown };
  return {
    keywords: asStringArray(payload.keywords, 14).length ? asStringArray(payload.keywords, 14) : fallbackTrendKeywords,
    fetchedAt: Number(payload.fetchedAt) || Date.now(),
    sourceLabel: asString(payload.sourceLabel, '公开榜单趋势')
  };
}

export async function generateFanficTrendTopics(input: { keywords: string[]; settings?: AppSettings }): Promise<FanficTopic[]> {
  if (!hasTextGenerationConfig(input.settings)) return [];
  const prompt = [
    '根据公开通用女频分类标签生成 6 个完全原创、清楚直给、适合连载的双主角小说题材卡。趋势标签只能作为类型参考，禁止提及、拼接或改写任何榜单作品、IP、明星、作者、书名、简介和正文。',
    `趋势标签：${JSON.stringify(input.keywords)}`,
    '每个题材必须创造全新的时代、地点、职业、身份、世界规则和核心冲突，适合任意两位真名主角代入，且两个主角同等重要。题材之间的开局事件、行动目标和读者回报必须明显不同。',
    '题材卡规则：开局不是抽象意象，而是两位主角当场遇到的具体麻烦；目标能在前三章获得第一次结果；升级压力来自清楚的对手、期限、规则或现实代价；卖点明确告诉读者会看到甜宠、打脸、事业升级、查案、经营或求生中的哪一种回报。',
    '输出 JSON 对象：{"topics":[{"title":"6-14字直白题材名","hook":"包含开局麻烦、行动目标和预期回报的80-140字钩子","setting":"全新原创背景","conflict":"可持续升级的核心冲突","relationship":"由行动推进的关系动力","tags":[5-7个清晰标签],"trendKeywords":[使用的趋势词],"commercialSeed":{"openingProblem":"当场发生的具体麻烦","immediateGoal":"前三章要完成的目标","escalation":"后续对手或代价","readerPromise":"读者会持续看到的回报"}}]}。只输出 JSON。'
  ].join('\n\n');
  const parsed = await requestFanficJson(
    input.settings,
    prompt,
    { temperature: 0.88, maxTokens: 3600 },
    (value) => isRecord(value) && Array.isArray(value.topics)
  );
  const entries = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.topics) ? parsed.topics : [];
  const now = Date.now();
  return entries.flatMap((entry, index) => {
    if (!isRecord(entry)) return [];
    const title = asString(entry.title);
    const hook = asString(entry.hook);
    if (!title || !hook) return [];
    const rawSeed = isRecord(entry.commercialSeed) ? entry.commercialSeed : {};
    return [{
      id: createId('fanfic_topic_trend'),
      source: 'trend' as const,
      title,
      hook,
      setting: asString(entry.setting),
      conflict: asString(entry.conflict),
      relationship: asString(entry.relationship),
      tags: asStringArray(entry.tags, 6),
      trendKeywords: asStringArray(entry.trendKeywords, 4),
      commercialSeed: {
        openingProblem: asString(rawSeed.openingProblem, hook),
        immediateGoal: asString(rawSeed.immediateGoal, '前三章内完成第一次有效反击或阶段成果'),
        escalation: asString(rawSeed.escalation, '对手、期限或现实代价继续升级'),
        readerPromise: asString(rawSeed.readerPromise, '清晰冲突、阶段兑现和章末追更钩子')
      },
      builtIn: false,
      createdAt: now + index,
      expiresAt: now + 24 * 60 * 60 * 1000
    }];
  }).slice(0, 6);
}

export async function generateFanficCover(book: FanficBook, settings?: AppSettings) {
  if (!settings?.imageGenerationEnabled) return '';
  const selectedModel = getSelectedImageModelOption(settings, 'voom');
  if (!selectedModel) return '';
  const result = await generateImageByProvider(selectedModel.provider, settings, {
    positivePrompt: `${book.coverPrompt}, vertical editorial book cover artwork, symbolic scene for two protagonists, muted Korean indie magazine palette, premium paper texture, no letters, no words, no typography, no logo, no watermark`,
    negativePrompt: 'text, letters, title, logo, watermark, celebrity, copyrighted character, photorealistic identifiable person, extra limbs, low quality',
    model: selectedModel.model,
    width: 768,
    height: 1152,
    size: settings.imageOpenAi.size
  });
  return result.imageUrl;
}
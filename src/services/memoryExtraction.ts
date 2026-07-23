import { hasTextGenerationConfig, requestTextGeneration } from '@/services/ai';
import type { AppSettings, ChatMessage } from '@/types/domain';
import type {
  MemoryAssertion,
  MemoryAssertionKind,
  MemoryEntityType,
  MemoryEpistemicKind,
  MemoryExtractionAssertionDraft,
  MemoryExtractionEntityDraft,
  MemoryExtractionResult,
  MemoryExtractionStateDelta,
  MemoryStateKind,
  MemoryTheme,
} from '@/types/memory';
import { fallbackMemoryExtraction } from '@/utils/memoryGraph';

export interface ExtractTemporalMemoryInput {
  settings: AppSettings | undefined;
  modelOverride?: string;
  characterName: string;
  characterAliases?: string[];
  userName: string;
  userAliases?: string[];
  messages: ChatMessage[];
  currentAssertions?: MemoryAssertion[];
  signal?: AbortSignal;
}

const entityTypes = new Set<MemoryEntityType>(['character', 'user', 'person', 'place', 'object', 'organization', 'event', 'concept']);
const assertionKinds = new Set<MemoryAssertionKind>(['fact', 'preference', 'promise', 'conflict', 'relationship', 'impression', 'growth', 'emotion', 'open-loop', 'interpretation', 'boundary']);
const epistemicKinds = new Set<MemoryEpistemicKind>(['told', 'observed', 'inferred', 'hearsay', 'canon']);
const stateKinds = new Set<MemoryStateKind>(['relationship', 'user-impression', 'adaptive-personality', 'mood', 'current-context']);

export async function extractTemporalMemory(input: ExtractTemporalMemoryInput): Promise<MemoryExtractionResult> {
  const fallback = canonicalizeExtractionIdentities(
    fallbackMemoryExtraction(input.messages, input.characterName, input.userName),
    input,
  );
  if (!hasTextGenerationConfig(input.settings, input.modelOverride)) return fallback;
  const prompt = buildMemoryExtractionPrompt(input);
  try {
    const response = await requestTextGeneration(input.settings, prompt, input.modelOverride, {
      temperature: 0.1,
      maxTokens: 2_400,
      jsonMode: true,
      signal: input.signal,
    });
    return canonicalizeExtractionIdentities(normalizeExtractionResult(parseJsonObject(response), fallback), input);
  } catch (error) {
    console.warn('Temporal memory extraction fell back to local rules.', error);
    return fallback;
  }
}

export interface ConsolidateMemoryThemeInput {
  settings: AppSettings | undefined;
  modelOverride?: string;
  characterName: string;
  userName: string;
  theme: MemoryTheme;
  assertions: MemoryAssertion[];
}

export async function consolidateMemoryThemeReport(input: ConsolidateMemoryThemeInput): Promise<string> {
  const activeAssertions = input.assertions
    .filter((assertion) => input.theme.assertionIds.includes(assertion.id))
    .filter((assertion) => assertion.status === 'current' || assertion.status === 'open' || assertion.status === 'disputed')
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 18);
  const fallback = canonicalizeThemeReport(
    activeAssertions.map((assertion) => assertion.perspectiveText).join('；') || input.theme.report,
    input.userName,
  );
  if (!activeAssertions.length || !hasTextGenerationConfig(input.settings, input.modelOverride)) return fallback;
  const evidence = activeAssertions
    .map((assertion, index) => `${index + 1}. ${assertion.perspectiveText}（${assertion.kind}；确信度${Math.round(assertion.confidence * 100)}%）`)
    .join('\n');
  const prompt = `你是${input.characterName}的长期记忆整理者。请把“${input.theme.name}”主题下的原子记忆整合成一段可供${input.characterName}自然回忆的主题报告，只输出 JSON：{"report":"..."}。
要求：
1. 全文使用${input.characterName}第一人称，像我对这件事的当前理解，不要写成数据库摘要。
2. 必须只依据证据，概括稳定模式、最近变化、矛盾或仍未完成的事；不要把推测写成事实。
3. 提及用户这个人时只能使用真名“${input.userName}”，禁止使用“用户”“对方”“TA”、昵称、备注名或网名。
4. 120-320 字，避免逐条复述；这段报告会替代多条重复断言进入 prompt。

主题：${input.theme.name}
证据：
${evidence}`;
  try {
    const response = await requestTextGeneration(input.settings, prompt, input.modelOverride, {
      temperature: 0.15,
      maxTokens: 500,
      jsonMode: true,
    });
    const parsed = parseJsonObject(response);
    return canonicalizeThemeReport(cleanText(parsed.report, 700) || fallback, input.userName);
  } catch (error) {
    console.warn('Memory theme consolidation fell back to local report.', error);
    return fallback;
  }
}

function canonicalizeThemeReport(value: string, userName: string): string {
  return cleanText(String(value ?? '').replace(/用户|对方|TA|ta/g, userName), 700);
}

function buildMemoryExtractionPrompt(input: ExtractTemporalMemoryInput): string {
  const messageRows = input.messages
    .map((message) => JSON.stringify({
      id: message.id,
      sender: message.sender === 'user' ? input.userName : message.sender === 'char' ? input.characterName : '系统',
      sentAt: new Date(message.createdAt).toISOString(),
      content: renderMessageContent(message),
    }))
    .join('\n');
  const assertionRows = (input.currentAssertions ?? [])
    .filter((assertion) => assertion.status === 'current' || assertion.status === 'open' || assertion.status === 'disputed')
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 60)
    .map((assertion) => JSON.stringify({
      id: assertion.id,
      kind: assertion.kind,
      status: assertion.status,
      text: assertion.perspectiveText,
      confidence: assertion.confidence,
      validFrom: assertion.validFrom,
    }))
    .join('\n');

  return `你是${input.characterName}的“主观记忆编码器”，不是故事续写者，也不是全知数据库。请将本轮对话编码成时序知识图谱，只输出一个 JSON 对象。

视角规则：
1. narrative 与 perspectiveText 必须使用${input.characterName}的第一人称视角（我）；提及对方这个人时只能写真名“${input.userName}”。禁止用“用户”“对方”“TA”、昵称、备注名、主页名或网名代替${input.userName}。需要写出角色姓名时只能写真名“${input.characterName}”，不能写角色昵称、备注名、主页名或网名。
2. 只记录本轮消息有直接证据的信息。角色不知道的事不能记录；推断必须标为 inferred 并降低 confidence。
3. 区分 told（用户告知）、observed（角色亲历/观察）、inferred（角色推断）、hearsay（转述）、canon（明确设定）。
4. 不记录寒暄、措辞细节和无长期价值内容。优先记录偏好、边界、承诺、冲突、重要事件、关系变化、未完成事项。
5. 单条 assertion 只表达一个原子含义，同一条可属于多个 themes。
6. evidenceMessageIds 只能使用下方给出的消息 id。没有证据就不要输出断言。
7. 新信息明确替代旧认知时，把旧 id 放入 supersedesAssertionIds；信息互相冲突但无法判断时放入 contradictsAssertionIds。不要因为对象不同就擅自覆盖可并存的喜好。
8. adaptive-personality 只描述${input.characterName}在反复经历后形成的缓慢适应，不能修改核心人设。relationship/user-impression 也只输出小幅 delta；一次普通对话不得人格突变。
9. narrative 要像${input.characterName}当天写下的一则私人日记：保留事件顺序、感受、关系变化与未完成的牵挂，约 300-700 字；不要写成技术摘要或全知旁白。
10. 所有数值必须在指定范围内。不要输出 Markdown 或解释。

身份规范化信息（这些别名仅用于识别，绝不能出现在输出中）：
- ${input.characterName}的旧昵称/备注/主页名：${identityAliasDescription(input.characterAliases)}
- ${input.userName}的旧昵称/主页名：${identityAliasDescription(input.userAliases)}

JSON 结构：
{
  "title": "简短经历标题",
  "narrative": "我的第一人称情景记忆，完整但简洁",
  "location": "地点或空字符串",
  "emotion": "我的主要情绪或空字符串",
  "valence": -1到1,
  "arousal": 0到1,
  "salience": 0到1,
  "entities": [{"key":"本次唯一键","name":"名称","type":"character|user|person|place|object|organization|event|concept","aliases":[],"description":""}],
  "assertions": [{
    "subjectKey":"self|user|实体key",
    "predicate":"短谓词",
    "objectKey":"可选实体key",
    "objectText":"对象文本",
    "kind":"fact|preference|promise|conflict|relationship|impression|growth|emotion|open-loop|interpretation|boundary",
    "epistemicKind":"told|observed|inferred|hearsay|canon",
    "perspectiveText":"我的第一人称记忆句",
    "confidence":0到1,
    "importance":0到1,
    "emotionalWeight":0到1,
    "relationshipImpact":-1到1,
    "evidenceMessageIds":["消息id"],
    "themes":["主题名"],
    "supersedesAssertionIds":["旧断言id"],
    "contradictsAssertionIds":["旧断言id"],
    "validFrom":毫秒时间戳或省略,
    "validTo":毫秒时间戳或省略,
    "dueAt":毫秒时间戳或省略
  }],
  "themes":["主题名"],
  "stateDeltas":[{
    "kind":"relationship|user-impression|adaptive-personality|mood|current-context",
    "summary":"我的第一人称状态概括",
    "confidence":0到1,
    "facets":[{"key":"稳定英文或中文键","label":"显示名","delta":-1到1}]
  }]
}

当前已有认知（可能为空；只能引用这里出现的旧断言 id）：
${assertionRows || '无'}

本轮带证据消息（每行一个 JSON）：
${messageRows || '无'}

现在仅输出 JSON。`;
}

function renderMessageContent(message: ChatMessage): string {
  const parts = [String(message.content ?? '').trim()];
  if (message.sticker) parts.push(`[表情：${message.sticker.description}]`);
  if (message.image) parts.push(`[图片：${message.image.description}]`);
  if (message.voice) parts.push(`[语音：${message.voice.transcript}]`);
  if (message.location) parts.push(`[位置：${message.location.name || message.location.address || ''}]`);
  if (message.transfer) parts.push(`[转账：${message.transfer.amount} ${message.transfer.note || ''}]`);
  if (message.commerce) parts.push(`[共同事件：${message.commerce.storeName} ${message.commerce.items.map((item) => item.name).join('、')}]`);
  if (message.musicListenInvite) parts.push(`[一起听：${message.musicListenInvite.track?.name || message.musicListenInvite.note || ''}]`);
  if (message.theaterLink) parts.push(`[分享内容：${message.theaterLink.title} ${message.theaterLink.summary}]`);
  if (message.offlineInvitation) parts.push(`[线下情景：${message.offlineInvitation.prompt || message.offlineInvitation.status || ''}]`);
  if (message.call) parts.push(`[通话：${message.call.status || ''}]`);
  if (message.gobang) parts.push(`[五子棋：${message.gobang.status || ''}]`);
  return parts.filter(Boolean).join(' ').slice(0, 2_000);
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const text = String(raw ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const value = JSON.parse(text);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const value = JSON.parse(text.slice(start, end + 1));
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    }
  }
  throw new Error('记忆抽取结果不是有效 JSON 对象。');
}

function normalizeExtractionResult(raw: Record<string, unknown>, fallback: MemoryExtractionResult): MemoryExtractionResult {
  const entities = arrayOfRecords(raw.entities).slice(0, 30).flatMap(normalizeEntityDraft);
  const assertions = arrayOfRecords(raw.assertions).slice(0, 40).flatMap(normalizeAssertionDraft);
  const stateDeltas = arrayOfRecords(raw.stateDeltas).slice(0, 10).flatMap(normalizeStateDelta);
  return {
    title: cleanText(raw.title, 80) || fallback.title,
    narrative: cleanText(raw.narrative, 900) || fallback.narrative,
    location: cleanText(raw.location, 80),
    emotion: cleanText(raw.emotion, 80),
    valence: clamp(raw.valence, -1, 1),
    arousal: clamp(raw.arousal, 0, 1),
    salience: clamp(raw.salience, 0, 1),
    entities,
    assertions,
    themes: unique(stringArray(raw.themes).map((item) => cleanText(item, 60)).filter(Boolean)).slice(0, 12),
    stateDeltas,
  };
}

function canonicalizeExtractionIdentities(
  result: MemoryExtractionResult,
  input: Pick<ExtractTemporalMemoryInput, 'characterName' | 'characterAliases' | 'userName' | 'userAliases'>,
): MemoryExtractionResult {
  const canonicalize = (value: string) => canonicalizeIdentityText(value, input);
  return {
    ...result,
    title: canonicalize(result.title),
    narrative: canonicalize(result.narrative),
    location: canonicalize(result.location),
    entities: result.entities.map((entity) => ({
      ...entity,
      name: entity.key === 'self'
        ? input.characterName
        : entity.key === 'user'
          ? input.userName
          : canonicalize(entity.name),
      description: canonicalize(entity.description ?? ''),
    })),
    assertions: result.assertions.map((assertion) => ({
      ...assertion,
      predicate: canonicalize(assertion.predicate),
      objectText: canonicalize(assertion.objectText),
      perspectiveText: canonicalize(assertion.perspectiveText),
      themes: assertion.themes.map(canonicalize),
    })),
    themes: result.themes.map(canonicalize),
    stateDeltas: result.stateDeltas.map((delta) => ({
      ...delta,
      summary: canonicalize(delta.summary),
      facets: delta.facets.map((facet) => ({ ...facet, label: canonicalize(facet.label) })),
    })),
  };
}

function canonicalizeIdentityText(
  value: string,
  input: Pick<ExtractTemporalMemoryInput, 'characterName' | 'characterAliases' | 'userName' | 'userAliases'>,
): string {
  let text = String(value ?? '');
  const characterAliases = normalizedIdentityAliases(input.characterAliases, input.characterName);
  const userAliases = normalizedIdentityAliases(
    [...(input.userAliases ?? []), '用户', '对方', 'TA', 'ta'],
    input.userName,
  );
  const sharedAliases = new Set(characterAliases.filter((alias) => userAliases.includes(alias)));
  for (const alias of characterAliases.filter((item) => !sharedAliases.has(item))) {
    text = replaceIdentityAlias(text, alias, input.characterName);
  }
  for (const alias of userAliases.filter((item) => !sharedAliases.has(item))) {
    text = replaceIdentityAlias(text, alias, input.userName);
  }
  return cleanText(text, 2_000);
}

function normalizedIdentityAliases(aliases: string[] | undefined, canonicalName: string): string[] {
  const canonical = canonicalName.trim().toLocaleLowerCase();
  return unique((aliases ?? [])
    .map((alias) => alias.trim())
    .filter((alias) => alias.length >= 2 && alias.toLocaleLowerCase() !== canonical))
    .sort((left, right) => right.length - left.length);
}

function replaceIdentityAlias(value: string, alias: string, canonicalName: string): string {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(escaped, /[a-z]/i.test(alias) ? 'gi' : 'g'), canonicalName);
}

function identityAliasDescription(aliases: string[] | undefined): string {
  const values = unique((aliases ?? []).map((alias) => alias.trim()).filter(Boolean));
  return values.length ? values.join('、') : '无';
}

function normalizeEntityDraft(raw: Record<string, unknown>): MemoryExtractionEntityDraft[] {
  const key = cleanText(raw.key, 60);
  const name = cleanText(raw.name, 80);
  const type = cleanText(raw.type, 30) as MemoryEntityType;
  if (!key || !name || !entityTypes.has(type)) return [];
  return [{
    key,
    name,
    type,
    aliases: unique(stringArray(raw.aliases).map((item) => cleanText(item, 80)).filter(Boolean)).slice(0, 12),
    description: cleanText(raw.description, 400),
  }];
}

function normalizeAssertionDraft(raw: Record<string, unknown>): MemoryExtractionAssertionDraft[] {
  const subjectKey = cleanText(raw.subjectKey, 60);
  const predicate = cleanText(raw.predicate, 80);
  const objectText = cleanText(raw.objectText, 240);
  const perspectiveText = cleanText(raw.perspectiveText, 520);
  const kind = cleanText(raw.kind, 30) as MemoryAssertionKind;
  const epistemicKind = cleanText(raw.epistemicKind, 30) as MemoryEpistemicKind;
  const evidenceMessageIds = unique(stringArray(raw.evidenceMessageIds).map((item) => cleanText(item, 120)).filter(Boolean)).slice(0, 20);
  if (!subjectKey || !predicate || !objectText || !perspectiveText || !evidenceMessageIds.length || !assertionKinds.has(kind) || !epistemicKinds.has(epistemicKind)) return [];
  return [{
    subjectKey,
    predicate,
    objectKey: cleanText(raw.objectKey, 60) || undefined,
    objectText,
    kind,
    epistemicKind,
    perspectiveText,
    confidence: clamp(raw.confidence, 0, 1),
    importance: clamp(raw.importance, 0, 1),
    emotionalWeight: clamp(raw.emotionalWeight, 0, 1),
    relationshipImpact: clamp(raw.relationshipImpact, -1, 1),
    evidenceMessageIds,
    themes: unique(stringArray(raw.themes).map((item) => cleanText(item, 60)).filter(Boolean)).slice(0, 10),
    supersedesAssertionIds: unique(stringArray(raw.supersedesAssertionIds).map((item) => cleanText(item, 140)).filter(Boolean)).slice(0, 20),
    contradictsAssertionIds: unique(stringArray(raw.contradictsAssertionIds).map((item) => cleanText(item, 140)).filter(Boolean)).slice(0, 20),
    validFrom: positiveTime(raw.validFrom),
    validTo: positiveTime(raw.validTo),
    dueAt: positiveTime(raw.dueAt),
  }];
}

function normalizeStateDelta(raw: Record<string, unknown>): MemoryExtractionStateDelta[] {
  const kind = cleanText(raw.kind, 40) as MemoryStateKind;
  const summary = cleanText(raw.summary, 240);
  if (!stateKinds.has(kind) || !summary) return [];
  const facets = arrayOfRecords(raw.facets).slice(0, 16).flatMap((facet) => {
    const key = cleanText(facet.key, 60);
    const label = cleanText(facet.label, 60) || key;
    if (!key) return [];
    return [{ key, label, delta: clamp(facet.delta, -1, 1) }];
  });
  return [{ kind, summary, confidence: clamp(raw.confidence, 0, 1), facets }];
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function positiveTime(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function clamp(value: unknown, minimum: number, maximum: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

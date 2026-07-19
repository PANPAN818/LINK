export function normalizeTranslationText(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/^(?:普通话翻译|中文翻译|简体中文翻译|简中翻译|翻译|译文|释义|translation|translated text|chinese translation)\s*[:：]\s*/i, '')
    .replace(/^[（(]\s*/, '')
    .replace(/\s*[）)]$/, '')
    .trim();
}

function hasHanText(value: string) {
  return /[\u3400-\u9fff]/u.test(value);
}

function hasKanaOrHangul(value: string) {
  return /[\u3040-\u30ff\uac00-\ud7af]/u.test(value);
}

function hasForeignLetters(value: string) {
  return Array.from(value).some((character) => /\p{L}/u.test(character) && !/\p{Script=Han}/u.test(character));
}

function looksCantonese(value: string) {
  return /(?:係|唔|喺|嘅|佢|哋|冇|啲|嚟|咗|咁|咩|嗰|呢|乜|睇|攞|畀|俾|有冇|点解|點解|边个|邊個)/u.test(value);
}

function looksLikeChineseTranslation(value: string) {
  return hasHanText(value) && !hasKanaOrHangul(value);
}

function hasInlineChineseTranslation(content: string) {
  return /[（(][^（）()]*[\u3400-\u9fff][^（）()]*[）)]/u.test(content);
}

export function shouldTranslateContent(content: string) {
  if (hasKanaOrHangul(content)) return true;
  if (looksCantonese(content)) return true;
  if (hasForeignLetters(content)) return true;
  return false;
}

export function needsChineseTranslation(content: string, translation?: string) {
  const normalizedContent = content.trim();
  return Boolean(
    normalizedContent
    && shouldTranslateContent(normalizedContent)
    && !normalizeTranslationText(translation)
    && !hasInlineChineseTranslation(normalizedContent)
  );
}

export function shouldShowChineseTranslation(content: string, translation?: string) {
  const normalizedContent = content.trim();
  const normalizedTranslation = normalizeTranslationText(translation);
  return Boolean(
    normalizedContent
    && normalizedTranslation
    && normalizedTranslation !== normalizedContent
    && shouldTranslateContent(normalizedContent)
    && looksLikeChineseTranslation(normalizedTranslation)
  );
}

export function formatContentWithChineseTranslation(content: string, translation?: string) {
  const normalizedTranslation = normalizeTranslationText(translation);
  return shouldShowChineseTranslation(content, normalizedTranslation)
    ? `${content}（${normalizedTranslation}）`
    : content;
}
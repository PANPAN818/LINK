export function normalizeTranslationText(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/^(?:普通话翻译|中文翻译|简体中文翻译|简中翻译|翻译|译文|释义)\s*[:：]\s*/i, '')
    .replace(/^[（(]\s*/, '')
    .replace(/\s*[）)]$/, '')
    .trim();
}

export function shouldShowChineseTranslation(content: string, translation?: string) {
  const normalizedContent = content.trim();
  const normalizedTranslation = normalizeTranslationText(translation);
  return Boolean(
    normalizedContent
    && normalizedTranslation
    && normalizedTranslation !== normalizedContent
  );
}

export function formatContentWithChineseTranslation(content: string, translation?: string) {
  const normalizedTranslation = normalizeTranslationText(translation);
  return shouldShowChineseTranslation(content, normalizedTranslation)
    ? `${content}（${normalizedTranslation}）`
    : content;
}
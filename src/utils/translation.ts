const nonChineseTextPattern = /[A-Za-z\u00c0-\u024f\u0370-\u03ff\u0400-\u04ff\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u0e00-\u0e7f]/;

export function normalizeTranslationText(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/^[（(]\s*/, '')
    .replace(/\s*[）)]$/, '')
    .trim();
}

export function hasNonChineseText(value: string) {
  return nonChineseTextPattern.test(value);
}

export function shouldShowChineseTranslation(content: string, translation?: string) {
  const normalizedContent = content.trim();
  const normalizedTranslation = normalizeTranslationText(translation);
  return Boolean(
    normalizedContent
    && normalizedTranslation
    && hasNonChineseText(normalizedContent)
    && normalizedTranslation !== normalizedContent
  );
}

export function formatContentWithChineseTranslation(content: string, translation?: string) {
  const normalizedTranslation = normalizeTranslationText(translation);
  return shouldShowChineseTranslation(content, normalizedTranslation)
    ? `${content}（${normalizedTranslation}）`
    : content;
}
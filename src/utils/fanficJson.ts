import { jsonrepair } from 'jsonrepair';

function extractJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  const objectStart = candidate.indexOf('{');
  const arrayStart = candidate.indexOf('[');
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (!starts.length) return candidate;
  const rootStart = Math.min(...starts);
  const opening = candidate[rootStart];
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = rootStart; index < candidate.length; index += 1) {
    const character = candidate[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === opening) depth += 1;
    if (character === closing) depth -= 1;
    if (depth === 0) return candidate.slice(rootStart, index + 1);
  }
  return candidate.slice(rootStart).trim();
}

export function parseFanficJsonResponse(content: string) {
  const candidate = extractJsonContent(content);
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    try {
      return JSON.parse(jsonrepair(candidate)) as unknown;
    } catch {
      throw new Error('文本模型返回的 JSON 被截断或格式错误。');
    }
  }
}
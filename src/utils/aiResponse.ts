function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function findJsonObjectCandidates(value: string) {
  const candidates: string[] = [];
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"' && depth > 0) {
      inString = true;
      continue;
    }

    if (character === '{') {
      if (depth === 0) startIndex = index;
      depth += 1;
      continue;
    }

    if (character !== '}' || depth === 0) continue;
    depth -= 1;
    if (depth === 0 && startIndex >= 0) {
      const candidate = value.slice(startIndex, index + 1).trim();
      if (isValidJson(candidate)) candidates.push(candidate);
      startIndex = -1;
    }
  }

  return candidates;
}

export function extractJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const source = fenced?.[1].trim() ?? trimmed;

  if (isValidJson(source)) return source;

  const candidates = findJsonObjectCandidates(source);
  if (candidates.length) {
    return candidates.reduce((longest, candidate) => candidate.length > longest.length ? candidate : longest);
  }

  return source;
}

export function normalizeLooseModelReply(content: string) {
  return content
    .replace(/<Logic_Trace\b[^>]*>[\s\S]*?<\/Logic_Trace>/gi, '')
    .replace(/^\s*```(?:json)?\s*$/gim, '')
    .replace(/^\s*(?:\{\s*message\s*\}|<message>|\[message\])\s*[:：]?\s*/i, '')
    .replace(/\s*(?:\{\s*\/message\s*\}|<\/message>|\[\/message\])\s*$/i, '')
    .trim();
}
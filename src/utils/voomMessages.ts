import type { ChatMessage } from '@/types/domain';

export function isVoomNarrationMessage(message: ChatMessage) {
  return message.sender === 'system'
    && message.displayStyle === 'narration'
    && (Boolean(message.voomEventType) || Boolean(message.voomPostId) || Boolean(message.voomCommentId));
}

function isVoomLikeMessage(message: ChatMessage) {
  return message.sender === 'system'
    && message.voomEventType === 'like'
    && Boolean(message.voomPostId)
    && !message.voomCommentId;
}

function canMergeVoomLikeMessage(first: ChatMessage, next: ChatMessage) {
  return isVoomLikeMessage(first)
    && isVoomLikeMessage(next)
    && first.conversationId === next.conversationId
    && first.mode === next.mode
    && first.voomPostId === next.voomPostId;
}

function formatMergedVoomLikeContent(messages: ChatMessage[]) {
  const parsed = messages.map((message) => message.content.match(/^【VOOM】(.+?) 赞了 (.+?) 的动态。$/));
  const authorName = parsed[0]?.[2];
  if (authorName && parsed.every((match) => match?.[2] === authorName)) {
    const names = parsed.flatMap((match) => (match?.[1] ?? '').split('、').map((name) => name.trim()).filter(Boolean));
    if (names.length) return `【VOOM】${[...new Set(names)].join('、')} 赞了 ${authorName} 的动态。`;
  }
  return messages.map((message) => message.content).join('\n');
}

function flushVoomLikeGroup(group: ChatMessage[], output: ChatMessage[]) {
  if (!group.length) return;
  if (group.length === 1) {
    output.push(group[0]);
    return;
  }
  output.push({
    ...group[0],
    id: group.map((message) => message.id).join('__'),
    content: formatMergedVoomLikeContent(group)
  });
}

export function mergeVoomLikeMessages(messages: ChatMessage[]) {
  const output: ChatMessage[] = [];
  let group: ChatMessage[] = [];

  for (const message of messages) {
    if (group.length && canMergeVoomLikeMessage(group[0], message)) {
      group.push(message);
      continue;
    }

    flushVoomLikeGroup(group, output);
    group = isVoomLikeMessage(message) ? [message] : [];
    if (!group.length) output.push(message);
  }

  flushVoomLikeGroup(group, output);
  return output;
}
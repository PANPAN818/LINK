import type { ChatMessage } from '@/types/domain';

export function firstUnreadCharacterMessageId(messages: readonly ChatMessage[]) {
  const unreadIndex = messages.findIndex((message) => message.sender === 'char' && message.readAt === null);
  if (unreadIndex < 0) return '';
  const unreadMessage = messages[unreadIndex];
  if (!unreadMessage?.replyBatchId) return unreadMessage?.id ?? '';
  return messages.find((message) => message.replyBatchId === unreadMessage.replyBatchId)?.id ?? unreadMessage.id;
}

export function scrollMessageContainerToMessage(container: HTMLElement, messageId: string) {
  if (!messageId) return false;
  const target = [...container.querySelectorAll<HTMLElement>('[data-message-id]')]
    .find((element) => element.dataset.messageId === messageId);
  if (!target) return false;
  container.scrollTop = Math.max(0, container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top);
  return true;
}

export function scrollMessageContainerToUnreadOrBottom(
  container: HTMLElement,
  messages: readonly ChatMessage[],
  unreadMessageId = firstUnreadCharacterMessageId(messages)
) {
  if (!scrollMessageContainerToMessage(container, unreadMessageId)) container.scrollTop = container.scrollHeight;
  return unreadMessageId;
}

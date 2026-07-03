import type { AppSnapshot } from '@/types/domain';
import { createLinkBackupFile } from '@/utils/backup';

interface CreateBackupRequest {
  type: 'create-backup';
  snapshot: AppSnapshot;
}

function postProgress(label: string, percent: number) {
  self.postMessage({ type: 'progress', label, percent });
}

self.addEventListener('message', (event: MessageEvent<CreateBackupRequest>) => {
  const message = event.data;
  if (message.type !== 'create-backup') return;

  try {
    postProgress('正在清洗备份数据', 55);
    const backup = createLinkBackupFile(message.snapshot);
    postProgress('正在生成备份 JSON', 85);
    self.postMessage({ type: 'complete', backup });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : '备份生成失败。' });
  }
});

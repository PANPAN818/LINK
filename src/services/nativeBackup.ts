import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNativeFileShareAvailable, shareNativeFile } from '@/services/nativeFile';

interface NativeBackupPlugin {
  saveArchive(options: { dataUrl: string; fileName: string }): Promise<{ saved: boolean; fileName: string }>;
}

const LinkBackup = registerPlugin<NativeBackupPlugin>('LinkBackup');

export function isNativeBackupSaveAvailable() {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LinkBackup')
    || isNativeFileShareAvailable();
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('备份文件读取失败。')));
    reader.readAsDataURL(blob);
  });
}

export async function saveNativeBackupArchive(blob: Blob, fileName: string) {
  if (!isNativeBackupSaveAvailable()) return false;
  if (Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LinkBackup')) {
    const result = await LinkBackup.saveArchive({ dataUrl: await blobToDataUrl(blob), fileName });
    return result.saved;
  }
  return await shareNativeFile(blob, fileName);
}

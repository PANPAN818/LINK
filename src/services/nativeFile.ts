import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(-160)
    || 'BabyLink-export';
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = String(reader.result ?? '');
      const commaIndex = result.indexOf(',');
      if (commaIndex < 0) {
        reject(new Error('导出文件编码失败。'));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('导出文件读取失败。')));
    reader.readAsDataURL(blob);
  });
}

export function isNativeFileShareAvailable() {
  return Capacitor.isNativePlatform()
    && Capacitor.isPluginAvailable('Filesystem')
    && Capacitor.isPluginAvailable('Share');
}

export async function shareNativeFile(blob: Blob, fileName: string) {
  if (!isNativeFileShareAvailable()) return false;
  const safeFileName = sanitizeFileName(fileName);
  const path = `exports/${Date.now()}-${safeFileName}`;
  const writtenFile = await Filesystem.writeFile({
    path,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
    recursive: true
  });

  try {
    await Share.share({
      title: safeFileName,
      files: [writtenFile.uri],
      dialogTitle: '导出 BabyLink 文件'
    });
    return true;
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
  }
}

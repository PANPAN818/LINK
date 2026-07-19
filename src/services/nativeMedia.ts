import { Capacitor, registerPlugin } from '@capacitor/core';
import { isNativeFileShareAvailable, shareNativeFile } from '@/services/nativeFile';

interface NativeMediaPlugin {
  saveImage(options: { dataUrl: string; fileName: string }): Promise<{ saved: boolean; fileName: string }>;
}

const LinkMedia = registerPlugin<NativeMediaPlugin>('LinkMedia');

export function isNativeImageSaveAvailable() {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LinkMedia')
    || isNativeFileShareAvailable();
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('图片读取失败。')));
    reader.readAsDataURL(blob);
  });
}

export async function saveNativeImage(blob: Blob, fileName: string) {
  if (!isNativeImageSaveAvailable()) return false;
  if (Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LinkMedia')) {
    const result = await LinkMedia.saveImage({ dataUrl: await blobToDataUrl(blob), fileName });
    return result.saved;
  }
  return await shareNativeFile(blob, fileName);
}
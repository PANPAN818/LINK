import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeDisplayPlugin {
  setFullscreen(options: { enabled: boolean }): Promise<{ enabled: boolean }>;
}

const LinkDisplay = registerPlugin<NativeDisplayPlugin>('LinkDisplay');

export function isNativeDisplayAvailable() {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('LinkDisplay');
}

export async function setNativeDisplayFullscreen(enabled: boolean) {
  if (!isNativeDisplayAvailable()) return false;
  const result = await LinkDisplay.setFullscreen({ enabled });
  return result.enabled === enabled;
}
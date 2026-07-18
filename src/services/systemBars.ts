import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { setNativeDisplayFullscreen } from './nativeDisplay';

const fullscreenStorageKey = 'link:fullscreen-enabled';
let listenersInstalled = false;
let fullscreenEnabled = readFullscreenPreference();

type WebkitFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function readFullscreenPreference() {
  try {
    return localStorage.getItem(fullscreenStorageKey) === 'true';
  } catch {
    return false;
  }
}

function saveFullscreenPreference(enabled: boolean) {
  try {
    localStorage.setItem(fullscreenStorageKey, String(enabled));
  } catch {
    return;
  }
}

async function waitForFullscreenOperation(operation: Promise<void> | void) {
  await Promise.race([
    Promise.resolve(operation),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1_500))
  ]);
}

async function syncNativeStatusBar() {
  try {
    if (await setNativeDisplayFullscreen(fullscreenEnabled)) return true;
    await SystemBars.setStyle({ style: SystemBarsStyle.Light });
    if (fullscreenEnabled) await SystemBars.hide();
    else await SystemBars.show();
    return true;
  } catch {
    return false;
  }
}

async function enterBrowserFullscreen() {
  const fullscreenDocument = document as WebkitFullscreenDocument;
  if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) return true;
  const root = document.documentElement as WebkitFullscreenElement;
  try {
    if (root.requestFullscreen) await waitForFullscreenOperation(root.requestFullscreen());
    else if (root.webkitRequestFullscreen) await waitForFullscreenOperation(root.webkitRequestFullscreen());
    else return false;
    return Boolean(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement);
  } catch {
    return false;
  }
}

async function exitBrowserFullscreen() {
  const fullscreenDocument = document as WebkitFullscreenDocument;
  try {
    if (document.fullscreenElement && document.exitFullscreen) await waitForFullscreenOperation(document.exitFullscreen());
    else if (fullscreenDocument.webkitFullscreenElement && fullscreenDocument.webkitExitFullscreen) await waitForFullscreenOperation(fullscreenDocument.webkitExitFullscreen());
    return !document.fullscreenElement && !fullscreenDocument.webkitFullscreenElement;
  } catch {
    return false;
  }
}

export async function setFullscreenEnabled(enabled: boolean, options: { requestBrowserFullscreen?: boolean } = {}) {
  fullscreenEnabled = enabled;
  saveFullscreenPreference(enabled);
  document.documentElement.classList.toggle('is-link-fullscreen', enabled);
  if (Capacitor.isNativePlatform()) return await syncNativeStatusBar();
  if (!enabled) return await exitBrowserFullscreen();
  if (options.requestBrowserFullscreen) return await enterBrowserFullscreen();
  return Boolean(document.fullscreenElement || (document as WebkitFullscreenDocument).webkitFullscreenElement);
}

export function installNativeSystemBars() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('is-native-app');
  document.documentElement.classList.toggle('is-link-fullscreen', fullscreenEnabled);
  void syncNativeStatusBar();
  if (listenersInstalled) return;
  listenersInstalled = true;
  const restore = () => void syncNativeStatusBar();
  window.addEventListener('pageshow', restore, { passive: true });
  window.addEventListener('focus', restore, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') restore();
  });
}
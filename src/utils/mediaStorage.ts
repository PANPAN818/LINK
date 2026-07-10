export const linkMediaRouteSegment = '__link-media';
export const linkMediaCacheName = 'link-large-media-v1';

type LinkMediaBackend = 'opfs' | 'cache';

interface LinkMediaLocator {
  backend: LinkMediaBackend;
  id: string;
}

interface LinkFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface LinkDirectoryHandle {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LinkDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LinkFileHandle>;
  removeEntry(name: string): Promise<void>;
  keys?: () => AsyncIterable<string>;
}

interface LinkStorageManager {
  getDirectory?: () => Promise<LinkDirectoryHandle>;
}

const opfsDirectoryName = 'link-large-media-v1';
const externalizeMinBytes = 128 * 1024;
const recentlyStoredMediaRetainMs = 5 * 60 * 1000;
const objectUrlSourceMap = new Map<string, string>();
const recentlyStoredMediaLocators = new Map<string, number>();

function getBasePath() {
  const base = String(import.meta.env.BASE_URL || '/').trim() || '/';
  if (base === '.' || base === './') return '/';
  const normalizedBase = /^https?:\/\//i.test(base)
    ? new URL(base).pathname
    : base.startsWith('/') ? base : `/${base}`;
  return normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`;
}

function getCurrentOrigin() {
  return typeof window === 'undefined' ? 'https://link.local' : window.location.origin;
}

function createStoredMediaUrl(backend: LinkMediaBackend, id: string) {
  return `${getBasePath()}${linkMediaRouteSegment}/${backend}/${encodeURIComponent(id)}`;
}

function toAbsoluteMediaUrl(url: string) {
  return new URL(url, getCurrentOrigin()).href;
}

function getStorageManager() {
  return typeof navigator === 'undefined' ? undefined : navigator.storage as LinkStorageManager | undefined;
}

async function getOpfsMediaDirectory(create = false) {
  const root = await getStorageManager()?.getDirectory?.();
  if (!root) return null;
  return await root.getDirectoryHandle(opfsDirectoryName, { create });
}

function parseStoredMediaLocator(value: string): LinkMediaLocator | null {
  const rawValue = value.trim();
  if (!rawValue) return null;

  try {
    const url = new URL(rawValue, getCurrentOrigin());
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) return null;
    const marker = `/${linkMediaRouteSegment}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const [backendValue = '', ...idParts] = url.pathname.slice(markerIndex + marker.length).split('/');
    const backend = backendValue === 'opfs' ? 'opfs' : backendValue === 'cache' ? 'cache' : '';
    const id = decodeURIComponent(idParts.join('/')).trim();
    return backend && id ? { backend, id } : null;
  } catch {
    return null;
  }
}

function mediaLocatorKey(locator: LinkMediaLocator) {
  return `${locator.backend}/${locator.id}`;
}

function rememberStoredMediaUrl(url: string) {
  const locator = parseStoredMediaLocator(url);
  if (locator) recentlyStoredMediaLocators.set(mediaLocatorKey(locator), Date.now());
}

function collectProtectedMediaLocators(liveLocators: Set<string>) {
  const now = Date.now();
  const protectedLocators = new Set(liveLocators);
  recentlyStoredMediaLocators.forEach((createdAt, key) => {
    if (now - createdAt > recentlyStoredMediaRetainMs) {
      recentlyStoredMediaLocators.delete(key);
      return;
    }
    protectedLocators.add(key);
  });
  return protectedLocators;
}

function isInlineMediaDataUrl(value: string) {
  return /^data:(?:image|audio)\//i.test(value.trim());
}

function dataUrlByteLength(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return dataUrl.length;
  const meta = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1).replace(/\s+/g, '');
  if (/;base64/i.test(meta)) return Math.floor(payload.length * 0.75);
  try {
    return new TextEncoder().encode(decodeURIComponent(payload)).byteLength;
  } catch {
    return payload.length;
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [meta = '', payload = ''] = dataUrl.split(',', 2);
  const mimeType = meta.match(/^data:([^;]+)/i)?.[1] || 'application/octet-stream';
  if (/;base64/i.test(meta)) {
    const binary = atob(payload.replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mimeType });
  }

  return new Blob([decodeURIComponent(payload)], { type: mimeType });
}

function extensionFromMimeType(mimeType: string) {
  const normalized = mimeType.toLocaleLowerCase();
  if (normalized.includes('svg')) return 'svg';
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('avif')) return 'avif';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('wav')) return 'wav';
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('ogg') || normalized.includes('opus')) return 'ogg';
  if (normalized.includes('aac')) return 'aac';
  if (normalized.includes('flac')) return 'flac';
  return 'bin';
}

function mimeTypeFromMediaId(id: string) {
  const extension = id.split('.').pop()?.toLocaleLowerCase() ?? '';
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'avif') return 'image/avif';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'webm') return 'audio/webm';
  if (extension === 'ogg') return 'audio/ogg';
  if (extension === 'aac') return 'audio/aac';
  if (extension === 'flac') return 'audio/flac';
  return 'application/octet-stream';
}

async function blobHash(blob: Blob) {
  const bytes = await blob.arrayBuffer();
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle?.digest) return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

async function writeMediaToOpfs(id: string, blob: Blob) {
  const directory = await getOpfsMediaDirectory(true);
  if (!directory) return false;
  const fileHandle = await directory.getFileHandle(id, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

async function writeMediaToCache(url: string, blob: Blob) {
  if (typeof caches === 'undefined') return false;
  const cache = await caches.open(linkMediaCacheName);
  await cache.put(toAbsoluteMediaUrl(url), new Response(blob, {
    headers: {
      'Content-Type': blob.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
      'X-Link-Media-Storage': 'cache'
    }
  }));
  return true;
}

async function readMediaFromOpfs(id: string) {
  try {
    const directory = await getOpfsMediaDirectory(false);
    if (!directory) return null;
    const file = await (await directory.getFileHandle(id)).getFile();
    return file.type ? file : new Blob([file], { type: mimeTypeFromMediaId(id) });
  } catch {
    return null;
  }
}

async function readMediaFromCache(url: string) {
  if (typeof caches === 'undefined') return null;
  try {
    const response = await (await caches.open(linkMediaCacheName)).match(toAbsoluteMediaUrl(url));
    return response ? await response.blob() : null;
  } catch {
    return null;
  }
}

async function storeMediaBlob(blob: Blob) {
  const id = `${await blobHash(blob)}.${extensionFromMimeType(blob.type)}`;
  const opfsUrl = createStoredMediaUrl('opfs', id);
  try {
    if (await writeMediaToOpfs(id, blob)) {
      await writeMediaToCache(opfsUrl, blob).catch(() => undefined);
      rememberStoredMediaUrl(opfsUrl);
      return opfsUrl;
    }
  } catch {
    // Fall back to Cache Storage below.
  }

  const cacheUrl = createStoredMediaUrl('cache', id);
  if (await writeMediaToCache(cacheUrl, blob)) {
    rememberStoredMediaUrl(cacheUrl);
    return cacheUrl;
  }
  return '';
}

async function externalizeMediaString(value: string, minBytes: number) {
  const mappedUrl = objectUrlSourceMap.get(value);
  if (mappedUrl) return mappedUrl;
  if (parseStoredMediaLocator(value)) return value.trim();
  if (!isInlineMediaDataUrl(value) || dataUrlByteLength(value) < minBytes) return value;

  try {
    return await storeMediaBlob(dataUrlToBlob(value)) || value;
  } catch {
    return value;
  }
}

async function hydrateMediaString(value: string) {
  const locator = parseStoredMediaLocator(value);
  if (!locator) return value;

  const blob = locator.backend === 'opfs'
    ? await readMediaFromOpfs(locator.id) ?? await readMediaFromCache(value)
    : await readMediaFromCache(value) ?? await readMediaFromOpfs(locator.id);
  if (!blob) return value;

  const objectUrl = URL.createObjectURL(blob);
  objectUrlSourceMap.set(objectUrl, value.trim());
  return objectUrl;
}

async function transformMediaStrings<T>(value: T, transform: (entry: string) => Promise<string>): Promise<T> {
  if (typeof value === 'string') return await transform(value) as T;
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date || value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value;

  if (Array.isArray(value)) {
    let changed = false;
    const entries = [] as unknown[];
    for (const entry of value) {
      const nextEntry = await transformMediaStrings(entry, transform);
      changed ||= nextEntry !== entry;
      entries.push(nextEntry);
    }
    return (changed ? entries : value) as T;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  let changed = false;
  const nextValue: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const nextEntry = await transformMediaStrings(entry, transform);
    changed ||= nextEntry !== entry;
    nextValue[key] = nextEntry;
  }

  return (changed ? nextValue : value) as T;
}

function collectMediaLocators(value: unknown, locators: Set<string>) {
  if (typeof value === 'string') {
    const mappedUrl = objectUrlSourceMap.get(value) ?? value;
    const locator = parseStoredMediaLocator(mappedUrl);
    if (locator) locators.add(mediaLocatorKey(locator));
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (value instanceof Date || value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectMediaLocators(entry, locators));
    return;
  }
  Object.values(value).forEach((entry) => collectMediaLocators(entry, locators));
}

async function pruneCacheMedia(liveLocators: Set<string>) {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(linkMediaCacheName);
  const requests = await cache.keys();
  await Promise.all(requests.map(async (request) => {
    const locator = parseStoredMediaLocator(request.url);
    if (locator && !liveLocators.has(mediaLocatorKey(locator))) await cache.delete(request);
  }));
}

async function pruneOpfsMedia(liveLocators: Set<string>) {
  const directory = await getOpfsMediaDirectory(false).catch(() => null);
  if (!directory?.keys) return;

  for await (const id of directory.keys()) {
    if (!liveLocators.has(mediaLocatorKey({ backend: 'opfs', id }))) {
      await directory.removeEntry(id).catch(() => undefined);
    }
  }
}

export function isStoredLinkMediaUrl(value: string | undefined) {
  return Boolean(parseStoredMediaLocator(String(value ?? '')));
}

export function isLocalMediaCacheUrl(value: string | undefined) {
  const normalizedValue = String(value ?? '').trim();
  return Boolean(
    isInlineMediaDataUrl(normalizedValue)
    || parseStoredMediaLocator(normalizedValue)
    || objectUrlSourceMap.has(normalizedValue)
    || /^blob:/i.test(normalizedValue)
  );
}

export async function externalizeLargeMediaRefs<T>(value: T, minBytes = externalizeMinBytes): Promise<T> {
  return await transformMediaStrings(value, (entry) => externalizeMediaString(entry, minBytes));
}

function shouldHydrateMediaRefsInWindow() {
  if (typeof window === 'undefined') return false;
  return !navigator.serviceWorker?.controller;
}

export async function hydrateStoredMediaRefs<T>(value: T, force = false): Promise<T> {
  if (!force && !shouldHydrateMediaRefsInWindow()) return value;
  return await transformMediaStrings(value, hydrateMediaString);
}

export function collectStoredMediaLocators(value: unknown) {
  const locators = new Set<string>();
  collectMediaLocators(value, locators);
  return locators;
}

export async function pruneStoredMediaCache(liveLocators: Set<string>) {
  const protectedLocators = collectProtectedMediaLocators(liveLocators);
  await Promise.all([
    pruneCacheMedia(protectedLocators),
    pruneOpfsMedia(protectedLocators)
  ]);
}

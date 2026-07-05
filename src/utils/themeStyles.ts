import type { ThemeStylePreset } from '@/types/domain';

export const defaultOnlineThemePresetId = 'online-default';
export const defaultOfflineThemePresetId = 'offline-default';
export const onlineThemeExportMime = 'application/link-online-theme+json';
const exportMagic = 'LINK_ONLINE_THEME_V1';
const pngChannelCount = 3;
const pngPayloadWidth = 256;

export const defaultOnlineThemeCss = `/* LINK 线上页默认完整样式。
   复制后可自由修改；建议所有选择器都保留 .chat-room 前缀，避免影响其他页面。 */
.chat-room {
  background: #f4f7f2;
  color: #111111;
}

.chat-room .chat-header {
  min-height: 42px;
  padding: calc(3px + var(--safe-top)) calc(10px + var(--safe-right)) 3px calc(10px + var(--safe-left));
  background: transparent;
  backdrop-filter: none;
}

.chat-room .chat-header .chat-title-row,
.chat-room .chat-header .icon-row {
  display: flex;
  align-items: center;
  gap: var(--top-icon-gap);
}

.chat-room .chat-header .chat-person strong {
  color: #111111;
  font-size: var(--compact-heading-font-size);
  font-weight: 800;
}

.chat-room .chat-header .icon-button,
.chat-room .composer .icon-button,
.chat-room .composer .voice-button {
  color: #141414;
  background: transparent;
  border-radius: 8px;
}

.chat-room .message-list {
  padding: 10px 10px 8px;
  background: transparent;
}

.chat-room .history-loader,
.chat-room .typing-indicator,
.chat-room .message-meta {
  color: #727a82;
}

.chat-room .message-row {
  gap: 10px;
  margin: 7px 0;
}

.chat-room .message-row.user {
  justify-content: flex-end;
}

.chat-room .avatar-button,
.chat-room .avatar.mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.chat-room .bubble-wrap {
  max-width: min(80%, 300px);
  gap: 5px;
}

.chat-room .bubble {
  min-width: 32px;
  max-width: 100%;
  padding: 7px 11px;
  border-radius: 15px;
  background: #ffffff;
  color: #111111;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.chat-room .message-row.user .bubble {
  background: #5ce46f;
  color: #111111;
}

.chat-room .bubble.narration,
.chat-room .message-row.system .bubble.narration {
  background: rgba(17, 17, 17, 0.06);
  color: #5f6872;
  font-style: italic;
}

.chat-room .bubble.sticker,
.chat-room .bubble.image {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.chat-room .sticker-image {
  max-width: min(132px, 38vw);
  max-height: min(132px, 38vw);
  object-fit: contain;
}

.chat-room .chat-image-card {
  overflow: hidden;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(17, 20, 24, 0.08);
}

.chat-room .chat-image-card img {
  display: block;
  max-width: min(220px, 64vw);
  max-height: min(280px, 72vw);
  object-fit: cover;
}

.chat-room .chat-image-card figcaption {
  padding: 12px;
  color: #4a5158;
}

.chat-room .voice-message {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 120px;
  padding: 9px 10px;
  border-radius: 15px;
  background: #ffffff;
  color: #111111;
  border: 1px solid rgba(17, 17, 17, 0.05);
  box-shadow: 0 8px 24px rgba(17, 20, 24, 0.08);
}

.chat-room .voice-wave span,
.chat-room .voice-preview-wave span {
  background: currentColor;
}

.chat-room .voice-transcript,
.chat-room .quote-card {
  max-width: 100%;
  margin: 0;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: #59616a;
}

.chat-room .line-location-card,
.chat-room .link-location-card {
  overflow: hidden;
  width: min(202px, 59vw);
  border-radius: 10px;
  background: #ffffff;
  color: #111111;
  box-shadow: 0 9px 22px rgba(22, 27, 33, 0.08);
}

.chat-room .line-location-map,
.chat-room .link-location-map {
  display: block;
  position: relative;
  height: 112px;
  overflow: hidden;
  background: #dce8d8;
}

.chat-room .line-location-body,
.chat-room .line-location-footer,
.chat-room .link-location-address {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
}

.chat-room .line-location-kicker,
.chat-room .line-website-kicker,
.chat-room .transfer-request-chip,
.chat-room .transfer-settled-chip {
  color: #7a828b;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.chat-room .transfer-request-card,
.chat-room .transfer-settled-card,
.chat-room .transfer-receipt-card,
.chat-room .transfer-compose-preview {
  display: grid;
  gap: 10px;
  width: min(212px, 62vw);
  padding: 12px;
  border-radius: 10px;
  background: #ffffff;
  color: #111111;
  box-shadow: 0 9px 22px rgba(22, 27, 33, 0.08);
}

.chat-room .transfer-request-brand,
.chat-room .transfer-compose-brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 900;
}

.chat-room .transfer-request-mark,
.chat-room .transfer-settled-icon,
.chat-room .transfer-receipt-icon {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #06c755;
  color: #ffffff;
}

.chat-room .transfer-request-main strong,
.chat-room .transfer-compose-main strong {
  font-size: 28px;
  line-height: 1;
}

.chat-room .transfer-request-actions,
.chat-room .offline-invitation-actions,
.chat-room .location-actions,
.chat-room .transfer-actions,
.chat-room .selection-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-room .transfer-request-action,
.chat-room .primary-action,
.chat-room .secondary-action,
.chat-room .danger-action {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 800;
}

.chat-room .transfer-request-action--accept,
.chat-room .primary-action {
  background: #06c755;
  color: #ffffff;
}

.chat-room .transfer-request-action--reject,
.chat-room .secondary-action {
  background: #eef0f2;
  color: #2b3036;
}

.chat-room .line-website-card,
.chat-room .offline-invitation-message {
  display: grid;
  gap: 10px;
  width: min(222px, 64vw);
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  color: #202329;
  box-shadow: 0 8px 20px rgba(17, 20, 24, 0.06);
}

.chat-room .composer {
  min-height: calc(52px + var(--safe-bottom));
  padding: 6px calc(8px + var(--safe-right)) calc(6px + var(--safe-bottom)) calc(8px + var(--safe-left));
  background: transparent;
  transform: translate3d(0, calc(0px - var(--keyboard-inset)), 0);
}

.chat-room .composer-input {
  height: 34px;
  padding: 0 10px;
  border-radius: 17px;
  background: #f0f1f2;
  color: #777b80;
}

.chat-room .composer-input input {
  color: #111111;
}

.chat-room .composer-quote,
.chat-room .sticker-suggestions .suggestion-chip {
  background: rgba(240, 241, 242, 0.96);
  color: #2d333a;
}

.chat-room .text-action,
.chat-room .send-button {
  background: #06c755;
  color: #ffffff;
}
`;

export const defaultOfflineThemeCss = `/* LINK 线下页默认完整样式。
   复制后可自由修改；建议所有选择器都保留 .offline-room 前缀，避免影响其他页面。 */
.offline-room {
  --offline-ink: #252226;
  --offline-muted: #8f858c;
  --offline-line: rgba(46, 37, 43, 0.09);
  color: var(--offline-ink);
  background:
    linear-gradient(135deg, rgba(255, 229, 237, 0.74) 0%, rgba(247, 242, 255, 0.58) 38%, rgba(237, 250, 244, 0.74) 100%),
    #fbf8fa;
}

.offline-room .offline-topbar {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) 84px;
  align-items: center;
  gap: 8px;
  padding: calc(10px + var(--safe-top)) calc(14px + var(--safe-right)) 10px calc(14px + var(--safe-left));
  border-bottom: 1px solid rgba(255, 255, 255, 0.56);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(22px);
}

.offline-room .offline-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-room .offline-topbar-actions--right {
  justify-content: flex-end;
}

.offline-room .offline-icon-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  color: #2d282d;
  box-shadow: 0 10px 24px rgba(77, 58, 71, 0.08);
}

.offline-room .offline-title-block {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 0;
}

.offline-room .offline-title-block span {
  color: #b28b99;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.offline-room .offline-title-block strong {
  max-width: 100%;
  overflow: hidden;
  color: #211d21;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offline-room .offline-scroll {
  padding: 14px calc(14px + var(--safe-right)) 18px calc(14px + var(--safe-left));
  scroll-padding-bottom: calc(112px + var(--keyboard-inset));
}

.offline-room .chapter-stream {
  display: grid;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
}

.offline-room .chapter-entry {
  display: grid;
  gap: 9px;
  padding: 15px;
  border: 1px solid var(--offline-line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 14px 34px rgba(96, 74, 88, 0.08);
}

.offline-room .chapter-entry--user {
  background: rgba(255, 250, 252, 0.82);
}

.offline-room .chapter-entry--char {
  background: rgba(255, 255, 255, 0.78);
}

.offline-room .chapter-entry--hidden {
  border-style: dashed;
  border-color: rgba(143, 133, 140, 0.24);
  background: rgba(245, 241, 244, 0.56);
}

.offline-room .chapter-entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #a59aa1;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.1;
}

.offline-room .chapter-entry-tools,
.offline-room .reply-variant-switcher,
.offline-room .floor-edit-actions,
.offline-room .floor-jump-actions,
.offline-room .regenerate-prompt-actions,
.offline-room .delete-confirm-actions {
  display: grid;
  gap: 8px;
}

.offline-room .chapter-entry-tools {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.offline-room .chapter-entry p {
  margin: 0;
  color: #282328;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.offline-room .chapter-entry--user p {
  font-weight: 800;
}

.offline-room .inner-voice-segment {
  padding: 0 0.28em;
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(255, 236, 244, 0.12) 18%, rgba(214, 155, 178, 0.28) 100%);
  color: #7e4d5f;
  font-style: italic;
  font-weight: 800;
  box-decoration-break: clone;
}

.offline-room .dialogue-segment {
  padding: 0.02em 0.38em 0.08em;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 15%, rgba(171, 143, 158, 0.2) 100%);
  color: #241f24;
  font-weight: 850;
  box-shadow: inset 0 -1px 0 rgba(38, 33, 38, 0.12);
  box-decoration-break: clone;
}

.offline-room .plot-choice-panel,
.offline-room .floor-edit-panel,
.offline-room .typing-card {
  border: 1px solid rgba(182, 154, 166, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.58);
}

.offline-room .plot-choice-panel,
.offline-room .floor-edit-panel {
  display: grid;
  gap: 7px;
  padding: 6px;
}

.offline-room .plot-choice-toggle,
.offline-room .plot-choice-list button,
.offline-room .floor-edit-actions button {
  min-height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.64);
  color: #4d454c;
  font-size: 10px;
  font-weight: 800;
}

.offline-room .floor-edit-panel textarea,
.offline-room .regenerate-prompt-sheet textarea,
.offline-room .floor-jump-sheet input {
  border: 1px solid rgba(182, 154, 166, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  color: #262126;
}

.offline-room .offline-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 38vh;
  padding: 28px 18px;
  color: #a09299;
  text-align: center;
}

.offline-room .offline-empty strong {
  color: #383139;
  font-size: 16px;
}

.offline-room .offline-empty span {
  font-size: 12px;
  line-height: 1.45;
}

.offline-room .typing-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 13px 15px;
  color: #695d65;
  box-shadow: 0 14px 34px rgba(96, 74, 88, 0.08);
}

.offline-room .offline-dock {
  display: grid;
  gap: 8px;
  padding: 10px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(255, 255, 255, 0.62);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(22px);
  transform: translate3d(0, calc(0px - var(--keyboard-inset)), 0);
}

.offline-room .offline-toolbar {
  display: grid;
  grid-template-columns: repeat(3, minmax(40px, 1.15fr)) repeat(5, minmax(29px, 0.85fr));
  gap: 4px;
}

.offline-room .tool-button,
.offline-room .icon-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 32px;
  padding: 0 4px;
  border: 1px solid rgba(182, 154, 166, 0.26);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #685b63;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}

.offline-room .tool-button.active,
.offline-room .icon-tool-button.active {
  border-color: #262126;
  background: #262126;
  color: #ffffff;
}

.offline-room .tool-button--danger.active {
  border-color: #a64d5b;
  background: #a64d5b;
}

.offline-room .tool-button:disabled,
.offline-room .icon-tool-button:disabled {
  opacity: 0.42;
}

.offline-room .offline-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  align-items: end;
  gap: 8px;
}

.offline-room .offline-composer textarea {
  min-height: 42px;
  max-height: 118px;
  resize: none;
  padding: 11px 12px;
  border: 1px solid rgba(182, 154, 166, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #262126;
  font-size: 14px;
  line-height: 1.45;
}

.offline-room .offline-composer textarea::placeholder {
  color: #aaa0a7;
}

.offline-room .send-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #222026;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(34, 32, 38, 0.18);
}

.offline-room .send-button:disabled {
  background: rgba(34, 32, 38, 0.24);
  box-shadow: none;
}

.offline-room .floor-jump-sheet,
.offline-room .regenerate-prompt-sheet,
.offline-room .delete-confirm-sheet {
  width: min(100%, 360px);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 52px rgba(79, 58, 72, 0.2);
}
`;

interface ThemeExportPayload {
  magic: string;
  version: 1;
  exportedAt: number;
  presets: ThemeStylePreset[];
}

function normalizePresetForExport(preset: ThemeStylePreset): ThemeStylePreset {
  return {
    id: preset.id,
    name: preset.name,
    css: preset.css,
    source: preset.source,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt
  };
}

export function createOnlineThemeExportPayload(presets: ThemeStylePreset[]) {
  return JSON.stringify({
    magic: exportMagic,
    version: 1,
    exportedAt: Date.now(),
    presets: presets.map(normalizePresetForExport)
  } satisfies ThemeExportPayload);
}

export const createThemeStyleExportPayload = createOnlineThemeExportPayload;

function getCanvasContext(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建 PNG 画布。');
  return { canvas, context };
}

export function encodeOnlineThemePresetsToPng(presets: ThemeStylePreset[]) {
  const encoded = new TextEncoder().encode(createOnlineThemeExportPayload(presets));
  const payload = new Uint8Array(4 + encoded.length);
  const view = new DataView(payload.buffer);
  view.setUint32(0, encoded.length, false);
  payload.set(encoded, 4);

  const pixelCount = Math.ceil(payload.length / pngChannelCount);
  const width = pngPayloadWidth;
  const height = Math.max(1, Math.ceil(pixelCount / width));
  const { canvas, context } = getCanvasContext(width, height);
  const imageData = context.createImageData(width, height);

  for (let index = 0; index < imageData.data.length; index += 4) {
    const byteIndex = (index / 4) * pngChannelCount;
    imageData.data[index] = payload[byteIndex] ?? 255;
    imageData.data[index + 1] = payload[byteIndex + 1] ?? 255;
    imageData.data[index + 2] = payload[byteIndex + 2] ?? 255;
    imageData.data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export const encodeThemeStylePresetsToPng = encodeOnlineThemePresetsToPng;

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('PNG 样式图片读取失败。')), { once: true });
    image.src = dataUrl;
  });
}

export async function decodeOnlineThemePresetsFromPng(dataUrl: string) {
  const image = await loadImageFromDataUrl(dataUrl);
  const { context } = getCanvasContext(image.naturalWidth || image.width, image.naturalHeight || image.height);
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.naturalWidth || image.width, image.naturalHeight || image.height);
  const bytes: number[] = [];
  for (let index = 0; index < data.length; index += 4) {
    bytes.push(data[index], data[index + 1], data[index + 2]);
  }

  if (bytes.length < 4) throw new Error('这张 PNG 不包含 LINK 样式数据。');
  const lengthView = new DataView(new Uint8Array(bytes.slice(0, 4)).buffer);
  const length = lengthView.getUint32(0, false);
  if (!Number.isFinite(length) || length <= 0 || length > bytes.length - 4) throw new Error('这张 PNG 的样式数据不完整。');

  const payloadBytes = new Uint8Array(bytes.slice(4, 4 + length));
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<ThemeExportPayload>;
  if (payload.magic !== exportMagic || payload.version !== 1 || !Array.isArray(payload.presets)) {
    throw new Error('这张 PNG 不是 LINK 样式预设。');
  }
  return payload.presets;
}

export const decodeThemeStylePresetsFromPng = decodeOnlineThemePresetsFromPng;
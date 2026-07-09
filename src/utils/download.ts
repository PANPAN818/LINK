function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('svg')) return 'svg';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return '';
}

function extensionFromUrl(url: string) {
  const path = url.split('?')[0]?.split('#')[0] ?? '';
  const extension = path.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  return extension && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) ? extension : '';
}

function safeDownloadName(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    || 'link-image';
}

function clickDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadImageUrl(source: string, filenameBase: string) {
  const imageUrl = source.trim();
  if (!imageUrl) throw new Error('没有可下载的图片。');
  const baseName = safeDownloadName(filenameBase);

  if (imageUrl.startsWith('data:')) {
    const mimeType = imageUrl.match(/^data:([^;,]+)/)?.[1] ?? 'image/jpeg';
    clickDownload(imageUrl, `${baseName}.${extensionFromMimeType(mimeType) || 'jpg'}`);
    return;
  }

  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const extension = extensionFromMimeType(blob.type || '') || extensionFromUrl(imageUrl) || 'jpg';
    const objectUrl = URL.createObjectURL(blob);
    try {
      clickDownload(objectUrl, `${baseName}.${extension}`);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  } catch {
    clickDownload(imageUrl, `${baseName}.${extensionFromUrl(imageUrl) || 'jpg'}`);
  }
}

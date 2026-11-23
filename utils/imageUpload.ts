export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preserveAnimationForSmallGif?: boolean;
}

const DEFAULT_MAX_WIDTH = 768;
const DEFAULT_MAX_HEIGHT = 768;
const DEFAULT_QUALITY = 0.82;
const OVERSIZED_DATA_URL_BYTES = 180 * 1024; // ~180KB threshold for legacy migration

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
};

export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const body = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    if (header.includes(';base64')) {
      const binary = atob(body);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } else {
      const decoded = decodeURIComponent(body);
      return new Blob([decoded], { type: mime });
    }
  } catch {
    return null;
  }
};

const drawScaledToCanvasBlob = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const srcW = img.naturalWidth || img.width || maxWidth;
    const srcH = img.naturalHeight || img.height || maxHeight;
    if (!srcW || !srcH) {
      resolve(null);
      return;
    }

    const scale = Math.min(1, maxWidth / srcW, maxHeight / srcH);
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.size > 0) {
          resolve(webpBlob);
        } else {
          canvas.toBlob(
            (jpegBlob) => resolve(jpegBlob),
            'image/jpeg',
            quality
          );
        }
      },
      'image/webp',
      quality
    );
  });
};

const loadImageFromObjectUrl = (objectUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = objectUrl;
  });
};

export const compressUploadedFileToBlob = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> => {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const preserveGif = options.preserveAnimationForSmallGif ?? true;

  // Keep small animated GIFs intact as blobs
  if (preserveGif && file.type === 'image/gif' && file.size <= 800 * 1024) {
    const dataUrl = await blobToDataUrl(file);
    return { blob: file, dataUrl };
  }

  // Keep small SVGs intact
  if (file.type === 'image/svg+xml' && file.size <= 64 * 1024) {
    const dataUrl = await blobToDataUrl(file);
    return { blob: file, dataUrl };
  }

  const tempUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageFromObjectUrl(tempUrl);
    const compressedBlob = await drawScaledToCanvasBlob(img, maxWidth, maxHeight, quality);
    if (compressedBlob && (compressedBlob.size < file.size || img.naturalWidth > maxWidth || img.naturalHeight > maxHeight)) {
      const dataUrl = await blobToDataUrl(compressedBlob);
      return { blob: compressedBlob, dataUrl };
    }
    const fallbackDataUrl = await blobToDataUrl(file);
    return { blob: file, dataUrl: fallbackDataUrl };
  } catch {
    const fallbackDataUrl = await blobToDataUrl(file);
    return { blob: file, dataUrl: fallbackDataUrl };
  } finally {
    URL.revokeObjectURL(tempUrl);
  }
};

export const compressRasterDataUrlIfOversized = async (
  dataUrl: string,
  maxWidth: number = DEFAULT_MAX_WIDTH,
  maxHeight: number = DEFAULT_MAX_HEIGHT,
  quality: number = DEFAULT_QUALITY
): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  // Never rasterize SVGs or already compact images
  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.length < OVERSIZED_DATA_URL_BYTES) {
    return dataUrl;
  }

  const sourceBlob = dataUrlToBlob(dataUrl);
  if (!sourceBlob) return dataUrl;

  const tempUrl = URL.createObjectURL(sourceBlob);
  try {
    const img = await loadImageFromObjectUrl(tempUrl);
    const compressedBlob = await drawScaledToCanvasBlob(img, maxWidth, maxHeight, quality);
    if (!compressedBlob) return dataUrl;
    const newDataUrl = await blobToDataUrl(compressedBlob);
    return newDataUrl.length < dataUrl.length ? newDataUrl : dataUrl;
  } catch {
    return dataUrl;
  } finally {
    URL.revokeObjectURL(tempUrl);
  }
};

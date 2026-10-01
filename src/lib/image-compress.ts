/**
 * Shrink an image in the browser before it is uploaded.
 *
 * Why this exists: product images are stored in Postgres as base64 text. A
 * 4 MB photo off a phone becomes roughly 5.4 MB of base64 in the request body,
 * another 5.4 MB in the database row, and it has to be decoded again on every
 * read. That is the single reason adding a product felt slow.
 *
 * Resizing to 1600px and re-encoding as WebP (JPEG on older Safari) typically
 * turns 4 MB into 150-300 KB — a 90%+ cut — with no visible difference at the
 * sizes the site actually renders.
 *
 * Everything happens on a canvas in the browser; nothing is sent anywhere.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export type CompressedImage = {
  /** Full data URL, ready to POST as `imageData`. */
  dataUrl: string;
  /** Matching `imageMimeType` for the API. */
  mimeType: string;
  originalBytes: number;
  compressedBytes: number;
};

/** Rough byte count of the payload inside a data URL. */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = src;
  });
}

/** Does this browser actually produce WebP from a canvas? Safari < 14 does not. */
function supportsWebp(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

export async function compressImageFile(
  file: File,
  options: { preserveAlpha?: boolean } = {},
): Promise<CompressedImage> {
  const originalDataUrl = await readAsDataUrl(file);
  const originalBytes = file.size;

  // SVG and GIF don't survive a canvas round trip (vectors rasterise, animation
  // is flattened to one frame), so pass them through untouched.
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type,
      originalBytes,
      compressedBytes: originalBytes,
    };
  }

  let image: HTMLImageElement;
  try {
    image = await loadImage(originalDataUrl);
  } catch {
    // Corrupt or unsupported: let the server's own validation answer.
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type,
      originalBytes,
      compressedBytes: originalBytes,
    };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type,
      originalBytes,
      compressedBytes: originalBytes,
    };
  }

  // Flatten onto white: PNG transparency becomes black under JPEG otherwise.
  //
  // A LOGO MUST NOT BE FLATTENED. This white rectangle is exactly what put a
  // white box behind the header logo: upload a transparent PNG through
  // /admin/settings and the canvas painted white underneath it before encoding,
  // baking the box into the stored image. Photographs are opaque so flattening
  // them costs nothing; brand marks are the case that needs the alpha kept.
  if (!options.preserveAlpha) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  // JPEG has no alpha channel at all, so transparency has to fall back to PNG
  // rather than to JPEG. Both WebP and PNG keep it.
  const mimeType = options.preserveAlpha
    ? (supportsWebp() ? "image/webp" : "image/png")
    : (supportsWebp() ? "image/webp" : "image/jpeg");
  const dataUrl = canvas.toDataURL(mimeType, QUALITY);
  const compressedBytes = dataUrlBytes(dataUrl);

  // If compression somehow made it bigger (tiny images, flat graphics), keep
  // whichever is actually smaller.
  if (compressedBytes >= originalBytes) {
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type,
      originalBytes,
      compressedBytes: originalBytes,
    };
  }

  return { dataUrl, mimeType, originalBytes, compressedBytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

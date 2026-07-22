import { put } from '@vercel/blob';

/**
 * Storage Utility Helper
 * Supports Vercel Blob storage when BLOB_READ_WRITE_TOKEN is configured,
 * with fallback to local optimized data URLs for seamless development.
 */
export async function uploadImageToStorage(
  base64OrDataUrl: string,
  pathname: string
): Promise<string> {
  if (!base64OrDataUrl) return '';

  // If already a remote HTTPS URL, return as is
  if (base64OrDataUrl.startsWith('http://') || base64OrDataUrl.startsWith('https://')) {
    return base64OrDataUrl;
  }

  // If Vercel Blob Read/Write Token is present, upload to Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const matches = base64OrDataUrl.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'image/png';
      const buffer = matches
        ? Buffer.from(matches[2], 'base64')
        : Buffer.from(base64OrDataUrl, 'base64');

      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType,
      });

      return blob.url;
    } catch (err) {
      console.warn('Vercel Blob upload failed, falling back to local storage:', err);
    }
  }

  // Local fallback: Return optimized data URL string
  return base64OrDataUrl;
}

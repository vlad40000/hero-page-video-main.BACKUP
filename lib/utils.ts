import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const stripHtml = (html: string) => {
  if (typeof window === 'undefined') return html;
  // Pre-process common block tags to newlines to preserve structure
  let processed = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n');

  const tmp = document.createElement("DIV");
  tmp.innerHTML = processed;
  return (tmp.textContent || tmp.innerText || "").trim();
};
/**
 * Checks if a URL is a Vercel Blob URL
 */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('blob.vercel-storage.com');
}

/**
 * Transforms a URL for UI display.
 * Since we are now using a PUBLIC Vercel Blob store, we no longer need the proxy.
 * This function remains as a pass-through to avoid breaking component imports.
 */
export function getDisplayUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url; // Direct public URL access
}

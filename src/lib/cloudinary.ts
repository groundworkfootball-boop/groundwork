/**
 * Cloudinary Media Service
 * 
 * All media (profile photos, videos, club logos, documents) goes through Cloudinary.
 * Client-side uses unsigned upload presets for direct uploads.
 * Server-side Cloud Functions handle signed operations (delete, moderation, transforms).
 * 
 * Environment variables (VITE_ prefix for client-side):
 *   VITE_CLOUDINARY_CLOUD_NAME   - Your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET - Unsigned upload preset name
 */

// ─── Configuration ───────────────────────────────────────────────────────────

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

if (!CLOUDINARY_CLOUD_NAME) {
  console.warn(
    '[cloudinary] VITE_CLOUDINARY_CLOUD_NAME is not set. ' +
    'Media uploads will fail. See .env.example for setup instructions.'
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'raw';

export interface CloudinaryUploadOptions {
  /** File or Blob to upload */
  file: File | Blob;
  /** Resource type: image, video, or raw (for documents) */
  resourceType?: MediaType;
  /** Folder path in Cloudinary (e.g., 'groundwork/players/uid123/videos') */
  folder?: string;
  /** Custom public_id (without folder prefix) */
  publicId?: string;
  /** Transformation to apply on upload (eager transform) */
  transformation?: string;
  /** Tags to attach to the uploaded asset */
  tags?: string[];
  /** Context metadata (key=value pairs) */
  context?: Record<string, string>;
  /** Upload progress callback */
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CloudinaryUploadResult {
  /** Cloudinary public_id */
  publicId: string;
  /** Secure delivery URL */
  secureUrl: string;
  /** Original filename */
  originalFilename: string;
  /** Resource type */
  resourceType: MediaType;
  /** Format (jpg, mp4, pdf, etc.) */
  format: string;
  /** Size in bytes */
  bytes: number;
  /** Width (images/videos) */
  width?: number;
  /** Height (images/videos) */
  height?: number;
  /** Duration in seconds (videos only) */
  duration?: number;
  /** Cloudinary version number */
  version: number;
  /** Created timestamp */
  createdAt: string;
  /** ETag for cache busting */
  etag: string;
  /** Thumbnail URL (auto-generated for videos) */
  thumbnailUrl?: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop' | 'pad';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  quality?: number | 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best';
  format?: string;
  effect?: string;
  radius?: number | 'max';
  fetchFormat?: 'auto';
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a file directly to Cloudinary using an unsigned upload preset.
 * This is safe for client-side use — the upload preset controls what's allowed.
 */
export async function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const {
    file,
    resourceType = 'image',
    folder,
    publicId,
    transformation,
    tags,
    context,
    onProgress,
  } = options;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) formData.append('folder', folder);
  if (publicId) formData.append('public_id', publicId);
  if (transformation) formData.append('transformation', transformation);
  if (tags?.length) formData.append('tags', tags.join(','));
  if (context) {
    const contextStr = Object.entries(context)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
    formData.append('context', contextStr);
  }

  const uploadUrl = `${CLOUDINARY_UPLOAD_URL}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(mapCloudinaryResponse(data, resourceType));
        } catch {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

    xhr.send(formData);
  });
}

// ─── URL Transformation ─────────────────────────────────────────────────────

/**
 * Build a transformed Cloudinary URL.
 * All transforms happen on Cloudinary's edge — no server processing needed.
 */
export function getCloudinaryUrl(
  publicId: string,
  resourceType: MediaType = 'image',
  transforms?: CloudinaryTransformOptions
): string {
  if (!CLOUDINARY_CLOUD_NAME) return '';

  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

  if (!transforms) {
    return `${base}/${resourceType}/upload/${publicId}`;
  }

  const parts: string[] = [];

  if (transforms.width) parts.push(`w_${transforms.width}`);
  if (transforms.height) parts.push(`h_${transforms.height}`);
  if (transforms.crop) parts.push(`c_${transforms.crop}`);
  if (transforms.gravity) parts.push(`g_${transforms.gravity}`);
  if (transforms.quality) parts.push(`q_${transforms.quality}`);
  if (transforms.format) parts.push(`f_${transforms.format}`);
  if (transforms.effect) parts.push(`e_${transforms.effect}`);
  if (transforms.radius) parts.push(`r_${transforms.radius}`);
  if (transforms.fetchFormat) parts.push(`f_${transforms.fetchFormat}`);

  const transformStr = parts.join(',');

  return `${base}/${resourceType}/upload/${transformStr}/${publicId}`;
}

// ─── Prebuilt Transform URLs ─────────────────────────────────────────────────

/** Profile photo thumbnail (80x80, face-detection crop) */
export function getProfileThumbnail(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 80,
    height: 80,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Profile photo medium (240x240) */
export function getProfileMedium(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 240,
    height: 240,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Profile photo large (480x480) */
export function getProfileLarge(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 480,
    height: 480,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Club logo thumbnail (64x64) */
export function getClubLogoThumbnail(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 64,
    height: 64,
    crop: 'fill',
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Club logo medium (200x200) */
export function getClubLogoMedium(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 200,
    height: 200,
    crop: 'fit',
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Video thumbnail (320x180) */
export function getVideoThumbnail(publicId: string): string {
  return getCloudinaryUrl(publicId, 'video', {
    width: 320,
    height: 180,
    crop: 'fill',
    quality: 'auto',
    format: 'jpg',
  });
}

/** Video poster (960x540) */
export function getVideoPoster(publicId: string): string {
  return getCloudinaryUrl(publicId, 'video', {
    width: 960,
    height: 540,
    crop: 'fill',
    quality: 'auto:good',
    format: 'jpg',
  });
}

/** Video optimized streaming URL */
export function getVideoStreamUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'video', {
    quality: 'auto',
    fetchFormat: 'auto',
  });
}

/** Document preview thumbnail */
export function getDocumentThumbnail(publicId: string): string {
  return getCloudinaryUrl(publicId, 'image', {
    width: 200,
    height: 280,
    crop: 'fill',
    quality: 'auto',
    format: 'jpg',
  });
}

// ─── Upload Helpers ──────────────────────────────────────────────────────────

/** Upload a profile photo */
export function uploadProfilePhoto(
  file: File,
  userId: string,
  onProgress?: (p: UploadProgress) => void
) {
  return uploadToCloudinary({
    file,
    resourceType: 'image',
    folder: `groundwork/players/${userId}/photos`,
    tags: ['profile-photo', userId],
    context: { userId, type: 'profile-photo' },
    onProgress,
  });
}

/** Upload a club logo */
export function uploadClubLogo(
  file: File,
  clubId: string,
  onProgress?: (p: UploadProgress) => void
) {
  return uploadToCloudinary({
    file,
    resourceType: 'image',
    folder: `groundwork/clubs/${clubId}/logo`,
    tags: ['club-logo', clubId],
    context: { clubId, type: 'club-logo' },
    onProgress,
  });
}

/** Upload a player video clip */
export function uploadPlayerVideo(
  file: File,
  userId: string,
  onProgress?: (p: UploadProgress) => void
) {
  return uploadToCloudinary({
    file,
    resourceType: 'video',
    folder: `groundwork/players/${userId}/videos`,
    tags: ['player-video', userId],
    context: { userId, type: 'player-video' },
    onProgress,
  });
}

/** Upload a verification document */
export function uploadVerificationDoc(
  file: File,
  clubId: string,
  docType: string,
  onProgress?: (p: UploadProgress) => void
) {
  return uploadToCloudinary({
    file,
    resourceType: 'raw',
    folder: `groundwork/clubs/${clubId}/verification`,
    tags: ['verification-doc', clubId, docType],
    context: { clubId, type: docType },
    onProgress,
  });
}

// ─── Validation ──────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, WebP, or GIF image.' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image must be under ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): ValidationResult {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload an MP4, MOV, WebM, or AVI video.' };
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: `Video must be under ${MAX_VIDEO_SIZE / 1024 / 1024}MB.` };
  }
  return { valid: true };
}

export function validateDocumentFile(file: File): ValidationResult {
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a PDF, JPEG, PNG, or Word document.' };
  }
  if (file.size > MAX_DOC_SIZE) {
    return { valid: false, error: `Document must be under ${MAX_DOC_SIZE / 1024 / 1024}MB.` };
  }
  return { valid: true };
}

// ─── Internal ────────────────────────────────────────────────────────────────

function mapCloudinaryResponse(
  data: Record<string, unknown>,
  resourceType: MediaType
): CloudinaryUploadResult {
  const result: CloudinaryUploadResult = {
    publicId: data.public_id as string,
    secureUrl: data.secure_url as string,
    originalFilename: data.original_filename as string,
    resourceType,
    format: data.format as string,
    bytes: data.bytes as number,
    width: data.width as number | undefined,
    height: data.height as number | undefined,
    version: data.version as number,
    createdAt: data.created_at as string,
    etag: data.etag as string,
  };

  if (resourceType === 'video') {
    result.duration = data.duration as number | undefined;
    result.thumbnailUrl = (data.secure_url as string)?.replace(/\.[^.]+$/, '.jpg');
  }

  return result;
}

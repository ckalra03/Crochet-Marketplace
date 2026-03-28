/**
 * Cloudinary configuration.
 *
 * Sign up free at https://cloudinary.com
 * Get your cloud name, API key, and API secret from the dashboard.
 *
 * Environment variables:
 *   CLOUDINARY_CLOUD_NAME  — your cloud name
 *   CLOUDINARY_API_KEY     — API key
 *   CLOUDINARY_API_SECRET  — API secret
 *
 * If not configured, uploads fall back to local disk storage.
 */
import { v2 as cloudinary } from 'cloudinary';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('cloudinary');

// Check if Cloudinary credentials are configured
const isConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  log.info('Cloudinary configured successfully');
} else {
  log.warn('Cloudinary not configured — uploads will use local disk storage');
}

/**
 * Upload a file to Cloudinary.
 * Returns the secure URL and public ID.
 * Falls back to local path if Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  filePath: string,
  options?: { folder?: string; resourceType?: 'image' | 'video' }
): Promise<{ url: string; publicId: string }> {
  if (!isConfigured) {
    // Fallback: return local file path as-is
    return { url: filePath, publicId: '' };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder: options?.folder ?? 'crochet-hub/products',
    resource_type: options?.resourceType ?? 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
      { quality: 'auto', fetch_format: 'auto' },     // Auto-optimize format + quality
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isConfigured || !publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    log.error('Failed to delete from Cloudinary', { publicId, err });
  }
}

/**
 * Check if Cloudinary is configured and available.
 */
export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

export { cloudinary };

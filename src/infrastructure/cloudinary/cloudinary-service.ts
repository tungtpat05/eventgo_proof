import crypto from 'crypto';
import { env } from '@/config/env';

export interface CloudinarySignedParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export class CloudinaryService {
  public static readonly DEFAULT_FOLDER = 'eventgo/evidence';

  /**
   * Generates a secure upload signature for direct browser-to-Cloudinary upload.
   * CLOUDINARY_API_SECRET never leaves the server.
   */
  static generateUploadSignature(
    folder: string = CloudinaryService.DEFAULT_FOLDER
  ): CloudinarySignedParams | null {
    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const targetFolder = folder || CloudinaryService.DEFAULT_FOLDER;

    // Cloudinary signature calculation: sorted parameter string + api_secret hashed with SHA-1
    const paramsToSign = `folder=${targetFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder: targetFolder,
    };
  }

  /**
   * Uploads an image dataUrl or buffer directly to Cloudinary using signed authentication.
   * Uploads to the specified folder (default: 'eventgo/evidence').
   */
  static async uploadImage(
    fileDataUrl: string,
    folder: string = CloudinaryService.DEFAULT_FOLDER
  ): Promise<{ secureUrl: string; thumbnailUrl: string; publicId: string } | null> {
    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const targetFolder = folder || CloudinaryService.DEFAULT_FOLDER;

    const paramsToSign = `folder=${targetFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new FormData();
    formData.append('file', fileDataUrl);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', targetFolder);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary API upload error:', errorText);
      throw new Error(`Upload Cloudinary thất bại (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const publicId = data.public_id as string;
    const secureUrl = data.secure_url as string;
    const thumbnailUrl = CloudinaryService.getThumbnailUrl(publicId);

    return {
      secureUrl,
      thumbnailUrl,
      publicId,
    };
  }

  /**
   * Helper to format optimized image URLs from Cloudinary.
   */
  static getOptimizedUrl(publicIdOrUrl: string, width = 1200): string {
    if (!publicIdOrUrl) return '';
    // If already a full URL or data URI, return as-is
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://') || publicIdOrUrl.startsWith('data:')) {
      return publicIdOrUrl;
    }

    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return publicIdOrUrl;
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width},c_limit/${publicIdOrUrl}`;
  }

  static getThumbnailUrl(publicIdOrUrl: string): string {
    if (!publicIdOrUrl) return '';
    // If already a full URL or data URI, return as-is
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://') || publicIdOrUrl.startsWith('data:')) {
      return publicIdOrUrl;
    }

    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return publicIdOrUrl;
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_300,h_300,c_fill/${publicIdOrUrl}`;
  }
}


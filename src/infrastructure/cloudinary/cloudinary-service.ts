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
  /**
   * Generates a secure upload signature for direct browser-to-Cloudinary upload.
   * CLOUDINARY_API_SECRET never leaves the server.
   */
  static generateUploadSignature(
    organizationId: string,
    campaignId: string,
    locationId: string,
    submissionId: string
  ): CloudinarySignedParams | null {
    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `eventgo/org_${organizationId}/camp_${campaignId}/loc_${locationId}/sub_${submissionId}`;

    // Cloudinary signature calculation: sorted parameter string + api_secret hashed with SHA-1
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    };
  }

  /**
   * Helper to format optimized image URLs from Cloudinary.
   */
  static getOptimizedUrl(publicId: string, width = 1200): string {
    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return publicId;
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width},c_limit/${publicId}`;
  }

  static getThumbnailUrl(publicId: string): string {
    const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return publicId;
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_300,h_300,c_fill/${publicId}`;
  }
}

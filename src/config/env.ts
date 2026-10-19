import { z } from 'zod';

/**
 * Server-side environment variables schema.
 * Never expose these secrets to the client browser.
 */
const serverEnvSchema = z.object({
  // Supabase Server Secrets
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional(),

  // Cloudinary Secrets
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required').optional(),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required').optional(),
});

/**
 * Public client-side environment variables schema (prefixed with NEXT_PUBLIC_).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required').optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const isServer = typeof window === 'undefined';

export const env = {
  // Client-safe variables
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Server-only secrets
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    if (!isServer) {
      throw new Error('Attempted to access SUPABASE_SERVICE_ROLE_KEY from client bundle!');
    }
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },

  get CLOUDINARY_API_KEY(): string {
    if (!isServer) {
      throw new Error('Attempted to access CLOUDINARY_API_KEY from client bundle!');
    }
    return process.env.CLOUDINARY_API_KEY || '';
  },

  get CLOUDINARY_API_SECRET(): string {
    if (!isServer) {
      throw new Error('Attempted to access CLOUDINARY_API_SECRET from client bundle!');
    }
    return process.env.CLOUDINARY_API_SECRET || '';
  },

  get SMTP_HOST(): string {
    return process.env.SMTP_HOST || 'smtp.gmail.com';
  },

  get SMTP_PORT(): number {
    return Number(process.env.SMTP_PORT || '465');
  },

  get SMTP_SECURE(): boolean {
    return process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;
  },

  get SMTP_USER(): string {
    return process.env.SMTP_USER || '';
  },

  get SMTP_PASSWORD(): string {
    return process.env.SMTP_PASSWORD || '';
  },

  get SMTP_FROM(): string {
    return process.env.SMTP_FROM || (process.env.SMTP_USER ? `"EventGo Proof" <${process.env.SMTP_USER}>` : '"EventGo Proof" <noreply@eventgo.com>');
  },

  /**
   * Validate that all critical environment variables are present.
   * Useful during startup or before running server workflows.
   */
  validateServerEnv() {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn('⚠️ Server environment configuration incomplete:', parsed.error.format());
    }
    return parsed.success;
  },

  validateClientEnv() {
    const parsed = clientEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn('⚠️ Client environment configuration incomplete:', parsed.error.format());
    }
    return parsed.success;
  },
};

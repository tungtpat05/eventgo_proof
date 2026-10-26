import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple class names and resolve Tailwind CSS conflicts cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date according to locale standard (default 'vi-VN', supports 'en-US').
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = 'vi'
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const intlLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date & time according to locale standard (default 'vi-VN', supports 'en-US').
 * Accepts formatDateTime(date, locale) or formatDateTime(date, includeSeconds, locale).
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  includeSecondsOrLocale: boolean | string = false,
  locale: string = 'vi'
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const includeSeconds = typeof includeSecondsOrLocale === 'boolean' ? includeSecondsOrLocale : false;
  const resolvedLocale = typeof includeSecondsOrLocale === 'string' ? includeSecondsOrLocale : locale;
  const intlLocale = resolvedLocale === 'en' ? 'en-US' : 'vi-VN';
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(includeSeconds ? { second: '2-digit' } : {}),
  }).format(d);
}

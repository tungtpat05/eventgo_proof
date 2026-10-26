import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isValidLocale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('NEXT_LOCALE')?.value || '';
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    locale,
    messages: {
      common: (await import(`../../messages/${locale}/common.json`)).default,
      auth: (await import(`../../messages/${locale}/auth.json`)).default,
      roles: (await import(`../../messages/${locale}/roles.json`)).default,
      campaigns: (await import(`../../messages/${locale}/campaigns.json`)).default,
      operations: (await import(`../../messages/${locale}/operations.json`)).default,
      locations: (await import(`../../messages/${locale}/locations.json`)).default,
      billing: (await import(`../../messages/${locale}/billing.json`)).default,
      reports: (await import(`../../messages/${locale}/reports.json`)).default,
      admin: (await import(`../../messages/${locale}/admin.json`)).default,
      errors: (await import(`../../messages/${locale}/errors.json`)).default,
    },
  };
});

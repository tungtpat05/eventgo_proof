'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe, Loader2 } from 'lucide-react';
import { setLocaleAction } from '@/i18n/actions';
import { Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextLocale: Locale = currentLocale === 'vi' ? 'en' : 'vi';
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={currentLocale === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
      ) : (
        <Globe className="h-3.5 w-3.5 text-slate-500" />
      )}
      <span className="uppercase font-mono text-[11px] font-bold">
        {currentLocale === 'vi' ? 'VI' : 'EN'}
      </span>
      <span className="text-[10px] text-slate-400">
        {currentLocale === 'vi' ? '🇻🇳' : '🇬🇧'}
      </span>
    </button>
  );
}

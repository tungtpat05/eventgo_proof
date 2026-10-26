'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { setLocaleAction } from '@/i18n/actions';
import { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === currentLocale || isPending) return;
    setPendingLocale(nextLocale);
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
      setPendingLocale(null);
    });
  };

  return (
    <div
      role="group"
      aria-label="Chuyển đổi ngôn ngữ / Switch language"
      className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs select-none"
    >
      {/* English button (Left) */}
      <button
        type="button"
        onClick={() => handleSelect('en')}
        disabled={isPending || currentLocale === 'en'}
        aria-pressed={currentLocale === 'en'}
        title={currentLocale === 'en' ? 'English (Active)' : 'Switch to English'}
        className={cn(
          'min-w-[34px] sm:min-w-[36px] h-6 sm:h-6.5 px-2 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center justify-center cursor-pointer disabled:cursor-default',
          currentLocale === 'en'
            ? 'bg-white text-blue-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
        )}
      >
        {isPending && pendingLocale === 'en' ? (
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
        ) : (
          'EN'
        )}
      </button>

      {/* Tiếng Việt button (Right) */}
      <button
        type="button"
        onClick={() => handleSelect('vi')}
        disabled={isPending || currentLocale === 'vi'}
        aria-pressed={currentLocale === 'vi'}
        title={currentLocale === 'vi' ? 'Tiếng Việt (Đang dùng)' : 'Chuyển sang Tiếng Việt'}
        className={cn(
          'min-w-[34px] sm:min-w-[36px] h-6 sm:h-6.5 px-2 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center justify-center cursor-pointer disabled:cursor-default',
          currentLocale === 'vi'
            ? 'bg-white text-blue-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
        )}
      >
        {isPending && pendingLocale === 'vi' ? (
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
        ) : (
          'VI'
        )}
      </button>
    </div>
  );
}

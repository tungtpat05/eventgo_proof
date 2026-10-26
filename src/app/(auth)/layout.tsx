import React from 'react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}

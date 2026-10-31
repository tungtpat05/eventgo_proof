'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 2. Check if user dismissed previously (persisted for 7 days)
    const dismissedAt = localStorage.getItem('eventgo_pwa_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    // 3. Check iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    setIsIos(isIosDevice);

    // 4. Handle Android / Chromium prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and not standalone, show install guide
    if (isIosDevice && !isRunningStandalone) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('eventgo_pwa_dismissed_at', Date.now().toString());
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 shadow-md relative z-40 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192x192.png" alt="EventGo App" className="w-7 h-7 rounded-lg" />
          </div>
          <div>
            <h4 className="text-sm font-semibold leading-tight">
              Cài đặt EventGo Proof lên màn hình chính
            </h4>
            <p className="text-xs text-blue-100 mt-0.5">
              Chụp ảnh nghiệm thu nhanh chóng, khởi chạy mượt mà không cần mở trình duyệt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleInstallClick}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-xs flex items-center gap-1.5 h-8 text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Cài đặt ngay
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal / Popover */}
      {showIosGuide && (
        <div className="mt-3 pt-3 border-t border-white/15 text-xs text-blue-50 max-w-7xl mx-auto flex items-center gap-2">
          <span>Hướng dẫn iOS:</span>
          <span className="flex items-center gap-1 font-medium text-white">
            1. Bấm nút Chia sẻ <Share2 className="w-3.5 h-3.5 inline text-blue-200" /> trên Safari
          </span>
          <span>→</span>
          <span className="flex items-center gap-1 font-medium text-white">
            2. Chọn <PlusSquare className="w-3.5 h-3.5 inline text-blue-200" /> &quot;Thêm vào MH chính&quot;
          </span>
        </div>
      )}
    </div>
  );
}


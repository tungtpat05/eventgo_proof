'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface UpgradeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  onConfirm: () => void;
  isPending?: boolean;
}

export function UpgradeConfirmDialog({
  isOpen,
  onClose,
  planName,
  price,
  onConfirm,
  isPending = false,
}: UpgradeConfirmDialogProps) {
  const t = useTranslations('billing.upgradeDialog');
  const locale = useLocale();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {t('subtitle', { plan: planName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3 text-xs sm:text-sm text-slate-600">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{t('newPlan')}</span>
              <span className="text-blue-700">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('priceLabel')}</span>
              <span className="font-bold text-slate-900">
                {t('priceValue', { price: price.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN') })}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('explanation', { plan: planName })}
          </p>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            {t('btnCancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold shadow-xs"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            )}
            {t('btnProceed')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

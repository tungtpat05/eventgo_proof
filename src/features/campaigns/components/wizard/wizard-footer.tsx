'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, X } from 'lucide-react';

interface WizardFooterProps {
  currentStep: number;
  onBack?: () => void;
  onNext?: () => void;
  isNextLoading?: boolean;
  nextText?: string;
  showSaveDraft?: boolean;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  cancelText?: string;
}

export function WizardFooter({
  currentStep,
  onBack,
  onNext,
  isNextLoading = false,
  nextText = 'Tiếp tục',
  showSaveDraft = false,
  onSaveDraft,
  onCancel,
  cancelText = 'Hủy',
}: WizardFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 pt-6 border-t border-slate-200 mt-8">
      {/* Left controls: Back button or Cancel button */}
      <div>
        {currentStep > 1 && onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="text-xs font-medium text-slate-700 h-9 px-4 gap-1.5 border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        ) : onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="text-xs font-medium text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 h-9 px-4 gap-1.5 border-slate-200 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400 group-hover:text-red-500" />
            {cancelText}
          </Button>
        ) : (
          <div />
        )}
      </div>

      {/* Right controls: Notice & Next button */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="text-xs text-slate-400 hidden md:inline-block">
          Mọi thay đổi đã được tự động lưu
        </span>

        {showSaveDraft && onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            className="text-xs font-semibold text-slate-700 h-10 px-4 border-slate-200"
          >
            Lưu bản nháp & Thoát
          </Button>
        )}

        {onNext && (
          <Button
            type="button"
            onClick={onNext}
            isLoading={isNextLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm h-10 px-5 gap-1.5 shadow-sm"
          >
            {nextText}
            {currentStep === 5 ? (
              <CheckCircle className="h-4 w-4 ml-0.5" />
            ) : (
              <ArrowRight className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

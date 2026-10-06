'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep?: number;
}

const STEPS = [
  { step: 1, label: 'Thông tin' },
  { step: 2, label: 'Địa điểm & Booth' },
  { step: 3, label: 'Checklist' },
  { step: 4, label: 'Phân công' },
  { step: 5, label: 'Xem lại' },
];

export function WizardStepper({
  currentStep,
  onStepClick,
  maxAccessibleStep = 5,
}: WizardStepperProps) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between relative">
        {STEPS.map((item, index) => {
          const isCompleted = item.step < currentStep;
          const isActive = item.step === currentStep;
          const isClickable = item.step <= maxAccessibleStep && onStepClick;

          return (
            <React.Fragment key={item.step}>
              {/* Step item */}
              <div
                onClick={() => {
                  if (isClickable) onStepClick(item.step);
                }}
                className={cn(
                  'flex items-center gap-3 z-10 transition-all select-none',
                  isClickable ? 'cursor-pointer group' : 'cursor-default'
                )}
              >
                {/* Circle Icon */}
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isCompleted && 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500',
                    isActive && 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm',
                    !isCompleted &&
                      !isActive &&
                      'bg-slate-100 text-slate-400 border border-slate-200'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : item.step}
                </div>

                {/* Step Text Label */}
                <div className="hidden sm:block text-left">
                  <span
                    className={cn(
                      'block text-[10px] font-bold uppercase tracking-wider',
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    )}
                  >
                    BƯỚC {item.step}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold block leading-tight',
                      isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </div>

              {/* Connecting line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-4 transition-colors',
                    item.step < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

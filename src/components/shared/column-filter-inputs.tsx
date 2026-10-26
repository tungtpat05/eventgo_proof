'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface ColumnSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function ColumnSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: ColumnSearchInputProps) {
  const t = useTranslations('common.filters');
  const isFiltered = Boolean(value && value.trim().length > 0);
  const placeholderText = placeholder || t('searchPlaceholder');

  return (
    <div className={cn('relative w-full min-w-[120px]', className)}>
      <Search
        className={cn(
          'absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors pointer-events-none',
          isFiltered ? 'text-blue-600' : 'text-slate-400'
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderText}
        className={cn(
          'w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border transition-all text-slate-800 placeholder:text-slate-400 font-normal focus:outline-none focus:ring-2',
          isFiltered
            ? 'border-blue-400 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20'
            : 'border-slate-200 bg-white/80 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-blue-500/20'
        )}
      />
      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          title={t('clearSearch')}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export interface ColumnSelectOption {
  value: string;
  label: string;
}

export interface ColumnSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: ColumnSelectOption[];
  allLabel?: string;
  className?: string;
}

export function ColumnSelect({
  value,
  onChange,
  options,
  allLabel,
  className,
}: ColumnSelectProps) {
  const t = useTranslations('common.filters');
  const isFiltered = Boolean(value && value !== 'ALL' && value !== '');
  const displayAllLabel = allLabel || t('allOption');

  return (
    <div className={cn('relative w-full min-w-[120px]', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full py-1.5 pl-2.5 pr-6 text-xs rounded-lg border appearance-none transition-all font-normal cursor-pointer focus:outline-none focus:ring-2',
          isFiltered
            ? 'border-blue-400 bg-blue-50/50 text-blue-900 font-medium ring-2 ring-blue-500/20'
            : 'border-slate-200 bg-white/80 hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 text-slate-700'
        )}
      >
        <option value="ALL">{displayAllLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

export interface ColumnHeaderTitleProps {
  label: string;
  isFiltered?: boolean;
  className?: string;
}

export function ColumnHeaderTitle({
  label,
  isFiltered = false,
  className,
}: ColumnHeaderTitleProps) {
  const t = useTranslations('common.filters');

  return (
    <div className={cn('flex items-center gap-1.5 font-semibold text-slate-700', className)}>
      <span>{label}</span>
      {isFiltered && (
        <span
          className="inline-flex items-center justify-center p-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px]"
          title={t('filterApplied')}
        >
          <Filter className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  );
}

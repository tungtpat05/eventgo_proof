'use client';

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
}

export interface DataTableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  // Batch selection support
  selectedCount?: number;
  onClearSelection?: () => void;
  batchActions?: React.ReactNode;
  // Extra right actions (e.g. Export Excel, Add New)
  actions?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
  activeFiltersCount = 0,
  onResetFilters,
  selectedCount = 0,
  onClearSelection,
  batchActions,
  actions,
  className,
}: DataTableToolbarProps) {
  const t = useTranslations('common.toolbar');
  const isSearchActive = searchValue.trim().length > 0;
  const placeholderText = searchPlaceholder || t('searchPlaceholder');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Batch Action Banner (visible when rows are selected) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
              {selectedCount}
            </span>
            <span>{t('selectedRows', { count: selectedCount })}</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-blue-700 underline hover:text-blue-900 ml-1 cursor-pointer"
              >
                {t('clearSelection')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {batchActions}
          </div>
        </div>
      )}

      {/* Main Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search & Filter Selectors */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Universal Search Input */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors',
                isSearchActive ? 'text-blue-600' : 'text-slate-400'
              )}
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholderText}
              className={cn(
                'w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 font-normal transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                isSearchActive
                  ? 'border-blue-400 bg-blue-50/20 focus:border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'
              )}
            />
            {isSearchActive && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                title={t('clearSearch')}
                aria-label={t('clearSearch')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Filter Dropdowns */}
          {filters.map((f) => {
            const isFiltered = f.value && f.value !== 'ALL' && f.value !== '';
            return (
              <div key={f.id} className="relative min-w-[130px]">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className={cn(
                    'w-full py-2 pl-3 pr-8 text-xs sm:text-sm rounded-xl border appearance-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                    isFiltered
                      ? 'border-blue-400 bg-blue-50/40 text-blue-900 font-semibold ring-2 ring-blue-500/15'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-blue-500'
                  )}
                >
                  <option value="ALL">{f.allLabel || t('allPrefix', { label: f.label.toLowerCase() })}</option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            );
          })}

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && onResetFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-2.5 rounded-xl gap-1.5 font-medium cursor-pointer"
              title={t('resetFilters', { count: activeFiltersCount })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('resetFilters', { count: activeFiltersCount })}</span>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WizardPersonnelOption } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { ChevronDown, Search, Check, UserPlus, X, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PersonnelComboboxProps {
  value: string | null | undefined;
  options: WizardPersonnelOption[];
  placeholder: string;
  isBatchMode?: boolean;
  onChange: (value: string | null | undefined) => void;
  onInviteNew?: () => void;
  disabled?: boolean;
  roleLabel: 'Supervisor' | 'Approver';
  className?: string;
}

export function PersonnelCombobox({
  value,
  options,
  placeholder,
  isBatchMode = false,
  onChange,
  onInviteNew,
  disabled = false,
  roleLabel,
  className,
}: PersonnelComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value || value === '' || value === '__UNASSIGN__') return null;
    return options.find((opt) => opt.id === value) || null;
  }, [options, value]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (opt) =>
        (opt.fullName && opt.fullName.toLowerCase().includes(q)) ||
        (opt.email && opt.email.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const activeOptions = useMemo(
    () => filteredOptions.filter((opt) => !opt.isPending),
    [filteredOptions]
  );

  const pendingOptions = useMemo(
    () => filteredOptions.filter((opt) => opt.isPending),
    [filteredOptions]
  );

  const handleSelect = (val: string | null | undefined) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-8 px-2.5 rounded-md border text-xs text-left flex items-center justify-between gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
          !selectedOption && !isBatchMode && 'border-amber-300 bg-amber-50/30 text-amber-900',
          !selectedOption && isBatchMode && 'border-slate-200 bg-white text-slate-500',
          selectedOption && selectedOption.isPending && 'border-blue-300 bg-blue-50/30 text-blue-900',
          selectedOption && !selectedOption.isPending && 'border-slate-200 bg-white text-slate-800'
        )}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {isBatchMode && value === undefined && (
            <span className="text-slate-500 truncate font-medium">-- Giữ nguyên phân công hiện tại --</span>
          )}

          {(!isBatchMode && !selectedOption) && (
            <span className="text-amber-800 font-medium truncate">-- Chưa gán {roleLabel} --</span>
          )}

          {(isBatchMode && value === null) && (
            <span className="text-slate-700 font-medium truncate">-- Bỏ phân công (Xóa tất cả) --</span>
          )}

          {selectedOption && (
            <>
              {selectedOption.isPending ? (
                <span className="flex h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Chờ kích hoạt" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Đã kích hoạt" />
              )}
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.isPending ? selectedOption.email : selectedOption.fullName}
              </span>
              {selectedOption.isPending ? (
                <span className="text-[10px] text-blue-600 shrink-0 font-medium">(Chờ login)</span>
              ) : (
                <span className="text-[10px] text-slate-400 truncate">({selectedOption.email})</span>
              )}
            </>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] sm:min-w-[320px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm ${roleLabel} theo tên hoặc email...`}
                className="w-full h-8 pl-8 pr-7 text-xs bg-white rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/60 text-xs">
            {/* Special Options */}
            <div className="py-1">
              {isBatchMode && (
                <button
                  type="button"
                  onClick={() => handleSelect(undefined)}
                  className={cn(
                    'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
                    value === undefined && 'bg-blue-50 text-blue-700 font-semibold'
                  )}
                >
                  <span>-- Giữ nguyên phân công hiện tại --</span>
                  {value === undefined && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
                  value === null && 'bg-blue-50 text-blue-700 font-semibold'
                )}
              >
                <span>-- Chưa phân công (Bỏ gán) --</span>
                {value === null && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              </button>
            </div>

            {/* Active Members Group */}
            {activeOptions.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Đã tham gia (Active)
                </div>
                {activeOptions.map((opt) => {
                  const isSelected = value === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      className={cn(
                        'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer',
                        isSelected && 'bg-blue-50/80 font-semibold text-blue-700'
                      )}
                    >
                      <div className="truncate pr-2">
                        <div className="text-slate-900 font-medium truncate">{opt.fullName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{opt.email}</div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pending Invites Group */}
            {pendingOptions.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  Chờ xác nhận (Pending Invite)
                </div>
                {pendingOptions.map((opt) => {
                  const isSelected = value === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      className={cn(
                        'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between hover:bg-blue-50/40 transition-colors cursor-pointer',
                        isSelected && 'bg-blue-50/80 font-semibold text-blue-700'
                      )}
                    >
                      <div className="truncate pr-2">
                        <div className="text-slate-900 font-medium truncate">{opt.email}</div>
                        <div className="text-[10px] text-blue-600 font-medium">Chờ đăng nhập Google</div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty state when searching */}
            {filteredOptions.length === 0 && (
              <div className="py-4 text-center text-slate-400 text-xs">
                Không tìm thấy nhân sự nào khớp với &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Quick Invite Footer */}
          {onInviteNew && (
            <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onInviteNew();
                }}
                className="w-full px-2.5 py-1.5 rounded-md text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Mời nhân sự mới qua email...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { WizardPersonnelOption } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { ChevronDown, Search, Check, UserPlus, X, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface PersonnelComboboxProps {
  value: string | null | undefined;
  options: WizardPersonnelOption[];
  placeholder?: string;
  isBatchMode?: boolean;
  onChange: (value: string | null | undefined) => void;
  onInviteNew?: () => void;
  disabled?: boolean;
  roleLabel: 'Supervisor' | 'Approver';
  className?: string;
}

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
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
  const tCombobox = useTranslations('campaigns.combobox');
  const tRoles = useTranslations('roles');
  const roleDisplayName =
    roleLabel === 'Supervisor'
      ? tRoles('roleShort.SUPERVISOR')
      : tRoles('roleShort.APPROVER');

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 320 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const width = Math.max(rect.width, 320);

    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, rect.right - width);
    }
    if (left < 12) left = 12;

    // Dropdown estimated height is around 280px
    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        top: undefined,
        left,
        width,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        bottom: undefined,
        left,
        width,
      });
    }
  };

  // When open, compute position and focus search input
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside and scroll/resize listeners
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value || value === '' || value === '__UNASSIGN__') return null;
    return options.find((opt) => opt.id === value) || null;
  }, [options, value]);

  // Filter options based on query (accent-insensitive)
  const isSearching = searchQuery.trim().length > 0;
  const filteredOptions = useMemo(() => {
    const q = normalizeVietnamese(searchQuery);
    if (!q) return options;
    return options.filter((opt) => {
      const name = normalizeVietnamese(opt.fullName || '');
      const email = normalizeVietnamese(opt.email || '');
      return name.includes(q) || email.includes(q);
    });
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

  const showKeepOption =
    isBatchMode &&
    (!isSearching ||
      normalizeVietnamese('giữ nguyên phân công hiện tại').includes(
        normalizeVietnamese(searchQuery)
      ));

  const showUnassignOption =
    !isSearching ||
    normalizeVietnamese('chưa phân công bỏ gán xóa').includes(
      normalizeVietnamese(searchQuery)
    );

  return (
    <div className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-8 px-2.5 rounded-md border text-xs text-left flex items-center justify-between gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
          !selectedOption && !isBatchMode && 'border-amber-300 bg-amber-50/30 text-amber-900',
          !selectedOption && isBatchMode && 'border-slate-200 bg-white text-slate-500',
          selectedOption && selectedOption.isPending && 'border-blue-300 bg-blue-50/30 text-blue-900',
          selectedOption && !selectedOption.isPending && 'border-slate-200 bg-white text-slate-800'
        )}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {isBatchMode && value === undefined && (
            <span className="text-slate-500 truncate font-medium">{tCombobox('keepCurrent')}</span>
          )}

          {!isBatchMode && !selectedOption && (
            <span className="text-amber-800 font-medium truncate">
              {placeholder || tCombobox('unassignedRole', { role: roleDisplayName })}
            </span>
          )}

          {isBatchMode && value === null && (
            <span className="text-slate-700 font-medium truncate">{tCombobox('removeAll')}</span>
          )}

          {selectedOption && (
            <>
              {selectedOption.isPending ? (
                <span className="flex h-2 w-2 rounded-full bg-blue-500 shrink-0" title={tCombobox('pendingGroup')} />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" title={tCombobox('activeGroup')} />
              )}
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.isPending ? selectedOption.email : selectedOption.fullName}
              </span>
              {selectedOption.isPending ? (
                <span className="text-[10px] text-blue-600 shrink-0 font-medium">{tCombobox('waitingLogin')}</span>
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

      {/* Dropdown Menu Popover via React Portal directly into document.body */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[380px]"
          >
            {/* Search Header */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholder || tCombobox('searchPlaceholder', { role: roleDisplayName })}
                  className="w-full h-8 pl-8 pr-7 text-xs bg-white rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-1 divide-y divide-slate-100/60 text-xs flex-1">
              {/* Special Options */}
              {(showKeepOption || showUnassignOption) && (
                <div className="py-1">
                  {showKeepOption && (
                    <button
                      type="button"
                      onClick={() => handleSelect(undefined)}
                      className={cn(
                        'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
                        value === undefined && 'bg-blue-50 text-blue-700 font-semibold'
                      )}
                    >
                      <span>{tCombobox('keepCurrent')}</span>
                      {value === undefined && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </button>
                  )}

                  {showUnassignOption && (
                    <button
                      type="button"
                      onClick={() => handleSelect(null)}
                      className={cn(
                        'w-full px-2.5 py-1.5 rounded-md text-left flex items-center justify-between text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
                        value === null && 'bg-blue-50 text-blue-700 font-semibold'
                      )}
                    >
                      <span>{tCombobox('unassign')}</span>
                      {value === null && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    </button>
                  )}
                </div>
              )}

              {/* Active Members Group */}
              {activeOptions.length > 0 && (
                <div className="py-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {tCombobox('activeGroup')}
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
                    {tCombobox('pendingGroup')}
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
                          <div className="text-[10px] text-blue-600 font-medium">{tCombobox('pendingGoogle')}</div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty state when searching */}
              {filteredOptions.length === 0 && !showKeepOption && !showUnassignOption && (
                <div className="py-5 text-center text-slate-400 text-xs">
                  {tCombobox('emptySearch', { query: searchQuery })}
                </div>
              )}
            </div>

            {/* Quick Invite Footer */}
            {onInviteNew && (
              <div className="p-1.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onInviteNew();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>{tCombobox('inviteNew')}</span>
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

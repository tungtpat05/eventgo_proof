'use client';

import React, { useState, useMemo } from 'react';
import { Campaign } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';
import { CampaignCard } from './campaign-card';
import { TablePagination } from '@/components/shared/table-pagination';
import { Input } from '@/components/ui/input';
import { Search, FolderKanban, ScanEye, CheckCheck, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface DashboardCampaignConsoleProps {
  campaigns: Campaign[];
}

type RoleFilterType = 'ALL' | CampaignRole.MANAGER | CampaignRole.SUPERVISOR | CampaignRole.APPROVER;

export function DashboardCampaignConsole({ campaigns }: DashboardCampaignConsoleProps) {
  const t = useTranslations('campaigns.dashboard');
  const tCommon = useTranslations('common');

  const [activeRole, setActiveRole] = useState<RoleFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Role counts
  const roleCounts = useMemo(() => {
    return {
      all: campaigns.length,
      managed: campaigns.filter((c) => c.currentUserRole === CampaignRole.MANAGER).length,
      supervised: campaigns.filter((c) => c.currentUserRole === CampaignRole.SUPERVISOR).length,
      approving: campaigns.filter((c) => c.currentUserRole === CampaignRole.APPROVER).length,
    };
  }, [campaigns]);

  // 2. Filter campaigns by role and search
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Role filter
      if (activeRole !== 'ALL' && c.currentUserRole !== activeRole) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesBrand = c.brandName?.toLowerCase().includes(q);
        const matchesCompany = c.companyName?.toLowerCase().includes(q);
        return Boolean(matchesTitle || matchesBrand || matchesCompany);
      }

      return true;
    });
  }, [campaigns, activeRole, searchQuery]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Console Toolbar: Role tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Role Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setActiveRole('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeRole === 'ALL'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t('tabRoleAll')}</span>
            <span className="opacity-70 text-[11px]">({roleCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole(CampaignRole.MANAGER);
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeRole === CampaignRole.MANAGER
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>{t('tabRoleManaged')}</span>
            <span className="opacity-70 text-[11px]">({roleCounts.managed})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole(CampaignRole.SUPERVISOR);
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeRole === CampaignRole.SUPERVISOR
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <ScanEye className="h-3.5 w-3.5" />
            <span>{t('tabRoleSupervised')}</span>
            <span className="opacity-70 text-[11px]">({roleCounts.supervised})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole(CampaignRole.APPROVER);
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeRole === CampaignRole.APPROVER
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>{t('tabRoleApproving')}</span>
            <span className="opacity-70 text-[11px]">({roleCounts.approving})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder={t('searchCampaignsPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
          {searchQuery ? tCommon('actions.search') : t('groupManagedEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredCampaigns.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCampaigns.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          className="rounded-xl border border-slate-200 bg-white shadow-2xs"
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CampaignStatus } from '@/domain/enums';
import { StatusBadge } from '@/components/shared/status-badge';
import { TablePagination } from '@/components/shared/table-pagination';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ScanEye,
  Calendar,
  ArrowRight,
  Tag,
  MapPin,
  Search,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

export interface SupervisionCampaignItem {
  id: string;
  title: string;
  brandName?: string | null;
  companyName?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: CampaignStatus;
  assignedBoothsCount: number;
}

interface SupervisionCampaignListProps {
  campaigns: SupervisionCampaignItem[];
}

type TabType = 'ALL' | 'ACTIVE' | 'COMPLETED';

export function SupervisionCampaignList({ campaigns }: SupervisionCampaignListProps) {
  const t = useTranslations('operations.supervision');
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. KPI Counts
  const counts = useMemo(() => {
    const active = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length;
    const completed = campaigns.filter((c) => c.status === CampaignStatus.COMPLETED).length;
    const totalBooths = campaigns.reduce((acc, c) => acc + (c.assignedBoothsCount || 0), 0);
    return {
      all: campaigns.length,
      active,
      completed,
      totalBooths,
    };
  }, [campaigns]);

  // 2. Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && c.status !== CampaignStatus.ACTIVE) return false;
      if (activeTab === 'COMPLETED' && c.status !== CampaignStatus.COMPLETED) return false;

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
  }, [campaigns, activeTab, searchQuery]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiTotalCampaigns')}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{counts.all}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ScanEye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiActive')}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-blue-600">{counts.active}</span>
                {counts.active > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang chạy
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiTotalBooths')}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{counts.totalBooths}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Store className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'ALL'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t('tabAll')} <span className="ml-1 opacity-70">({counts.all})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ACTIVE');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'ACTIVE'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t('tabActive')} <span className="ml-1 opacity-70">({counts.active})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('COMPLETED');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'COMPLETED'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t('tabCompleted')} <span className="ml-1 opacity-70">({counts.completed})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Campaign Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {t('filterEmpty')}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/supervision/${campaign.id}`}
                className="block group cursor-pointer"
              >
                <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-blue-300 rounded-xl flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        <Tag className="h-3 w-3" />
                        {campaign.brandName || campaign.companyName || 'Brand'}
                      </span>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {campaign.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campaign.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                    )}

                    {/* Operational Metrics: Assigned booths badge */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Store className="h-3.5 w-3.5 text-blue-600" />
                        {t('assignedBoothsBadge', { count: campaign.assignedBoothsCount || 0 })}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        GPS Check
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                        {t('btnStartWork')} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
          />
        )}
      </div>
    </div>
  );
}

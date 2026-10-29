'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CampaignStatus } from '@/domain/enums';
import { StatusBadge } from '@/components/shared/status-badge';
import { TablePagination } from '@/components/shared/table-pagination';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  CheckCheck,
  Calendar,
  ArrowRight,
  Tag,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

export interface ApprovalCampaignItem {
  id: string;
  title: string;
  brandName?: string | null;
  companyName?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: CampaignStatus;
  pendingReviewsCount: number;
}

interface ApprovalCampaignListProps {
  campaigns: ApprovalCampaignItem[];
}

type TabType = 'ALL' | 'ACTIVE' | 'PENDING_ONLY' | 'COMPLETED';

export function ApprovalCampaignList({ campaigns }: ApprovalCampaignListProps) {
  const t = useTranslations('operations.approvals');
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. KPI Counts
  const counts = useMemo(() => {
    const active = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length;
    const completed = campaigns.filter((c) => c.status === CampaignStatus.COMPLETED).length;
    const pendingOnly = campaigns.filter((c) => (c.pendingReviewsCount || 0) > 0).length;
    const totalPending = campaigns.reduce((acc, c) => acc + (c.pendingReviewsCount || 0), 0);

    return {
      all: campaigns.length,
      active,
      completed,
      pendingOnly,
      totalPending,
    };
  }, [campaigns]);

  // 2. Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && c.status !== CampaignStatus.ACTIVE) return false;
      if (activeTab === 'COMPLETED' && c.status !== CampaignStatus.COMPLETED) return false;
      if (activeTab === 'PENDING_ONLY' && (c.pendingReviewsCount || 0) <= 0) return false;

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiTotalPending')}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    counts.totalPending > 0 ? 'text-amber-600' : 'text-slate-900'
                  )}
                >
                  {counts.totalPending}
                </span>
                {counts.totalPending > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Cần duyệt
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiNeedAction')}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {counts.pendingOnly}
                </span>
                <span className="text-xs text-slate-400">/ {counts.all} cam</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                activeTab === 'ALL'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t('tabAll')} <span className="ml-1 opacity-70">({counts.all})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING_ONLY');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'PENDING_ONLY'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-amber-700 hover:bg-amber-50'
              )}
            >
              <Clock className="h-3 w-3" />
              {t('tabPendingOnly')} <span className="ml-0.5 opacity-90">({counts.pendingOnly})</span>
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
                  ? 'bg-white text-emerald-700 shadow-2xs'
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
                  ? 'bg-white text-emerald-700 shadow-2xs'
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
            {paginatedCampaigns.map((campaign) => {
              const hasPending = (campaign.pendingReviewsCount || 0) > 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/approvals/${campaign.id}`}
                  className="block group cursor-pointer"
                >
                  <Card
                    className={cn(
                      'h-full border transition-all duration-200 hover:shadow-md rounded-xl flex flex-col justify-between',
                      hasPending
                        ? 'border-amber-300 bg-amber-50/10 hover:border-amber-400'
                        : 'border-slate-200 hover:border-emerald-300'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <Tag className="h-3 w-3" />
                          {campaign.brandName || campaign.companyName || 'Brand'}
                        </span>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {campaign.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {campaign.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {campaign.description}
                        </p>
                      )}

                      {/* Operational Metrics: Pending reviews badge */}
                      <div className="flex items-center justify-between text-[11px] p-2 rounded-lg border">
                        {hasPending ? (
                          <div className="flex items-center gap-2 font-bold text-amber-900">
                            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>
                              {t('pendingCountBadge', { count: campaign.pendingReviewsCount })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{t('allDoneBadge')}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t('roleCardTitle')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(campaign.startDate, locale)} – {formatDate(campaign.endDate, locale)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform text-xs',
                            hasPending ? 'text-amber-700' : 'text-emerald-700'
                          )}
                        >
                          {t('btnReview')} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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

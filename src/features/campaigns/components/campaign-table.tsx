'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CampaignWithProgress } from '@/application/use-cases/campaigns/get-managed-campaigns-with-progress';
import { CampaignStatus } from '@/domain/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Calendar,
  Building2,
  Store,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignTableProps {
  campaigns: CampaignWithProgress[];
}

type TabType = 'ALL' | 'DRAFT' | 'ACTIVE' | 'COMPLETED';

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: campaigns.length,
      draft: campaigns.filter((c) => c.status === CampaignStatus.DRAFT).length,
      active: campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length,
      completed: campaigns.filter((c) => c.status === CampaignStatus.COMPLETED).length,
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // 1. Tab filter
      if (activeTab === 'DRAFT' && c.status !== CampaignStatus.DRAFT) return false;
      if (activeTab === 'ACTIVE' && c.status !== CampaignStatus.ACTIVE) return false;
      if (activeTab === 'COMPLETED' && c.status !== CampaignStatus.COMPLETED) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesBrand = c.brandName?.toLowerCase().includes(q);
        const matchesCompany = c.companyName?.toLowerCase().includes(q);
        return matchesTitle || matchesBrand || matchesCompany;
      }

      return true;
    });
  }, [campaigns, activeTab, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Bản nháp
          </span>
        );
      case CampaignStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </span>
        );
      case CampaignStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Đã hoàn thành
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* 1. Header Toolbar: Tabs + Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-slate-100">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              activeTab === 'ALL'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Tất cả <span className="ml-1 opacity-70">{counts.all}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('DRAFT');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              activeTab === 'DRAFT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Bản nháp <span className="ml-1 opacity-70">{counts.draft}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ACTIVE');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              activeTab === 'ACTIVE'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Đang hoạt động <span className="ml-1 opacity-70">{counts.active}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('COMPLETED');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              activeTab === 'COMPLETED'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Đã hoàn thành <span className="ml-1 opacity-70">{counts.completed}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm chiến dịch..."
            className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-blue-600"
          />
        </div>
      </div>

      {/* 2. Campaign Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-5">Chiến dịch</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Quy mô</th>
              <th className="py-3 px-4">Tiến độ thiết lập</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Không tìm thấy chiến dịch nào</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang tab lọc khác.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedCampaigns.map((c) => {
                const isDraft = c.status === CampaignStatus.DRAFT;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Cột 1: Chiến dịch */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={isDraft ? `/campaigns/${c.id}/wizard?step=${c.wizardStep || 1}` : `/campaigns/${c.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block max-w-xs sm:max-w-sm"
                          >
                            {c.title}
                          </Link>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{c.companyName || c.brandName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Thời gian */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {formatDate(c.startDate)} – {formatDate(c.endDate)}
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Quy mô */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{c.locationCount} địa điểm</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{c.boothCount} booth</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Tiến độ */}
                    <td className="py-4 px-4 whitespace-nowrap min-w-[150px]">
                      {isDraft ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Bước {c.wizardStep || 1}/5
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {c.setupProgress}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-500"
                              style={{ width: `${Math.max(c.setupProgress, 10)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Đang vận hành
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              100%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                            <div className="h-full rounded-full bg-emerald-500 w-full" />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Cột 5: Trạng thái */}
                    <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>

                    {/* Cột 6: Hành động */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {isDraft ? (
                        <Link href={`/campaigns/${c.id}/wizard?step=${c.wizardStep || 1}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 font-medium"
                          >
                            Tiếp tục bước {c.wizardStep || 1}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/campaigns/${c.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                          >
                            Mở Workspace
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      {filteredCampaigns.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/40">
          <div>
            Hiển thị{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(filteredCampaigns.length, (currentPage - 1) * itemsPerPage + 1)}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(filteredCampaigns.length, currentPage * itemsPerPage)}
            </span>{' '}
            trong tổng số <span className="font-semibold text-slate-800">{filteredCampaigns.length}</span> chiến dịch
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-600"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'h-8 w-8 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {page}
                </button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-600"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

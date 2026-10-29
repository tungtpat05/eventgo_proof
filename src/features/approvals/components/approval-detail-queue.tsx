'use client';

import React, { useState, useMemo } from 'react';
import { Submission, ChecklistItem, Booth } from '@/domain/entities';
import { ReviewPanel } from './review-panel';
import { TablePagination } from '@/components/shared/table-pagination';
import { Input } from '@/components/ui/input';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  CheckCheck,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface EnrichedSubmissionItem {
  submission: Submission;
  booth: Booth | null;
  boothName: string;
  checklistItem: ChecklistItem | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any;
}

interface ApprovalDetailQueueProps {
  campaignId: string;
  submissions: EnrichedSubmissionItem[];
}

type TabType = 'PENDING' | 'NEEDS_REVISION' | 'APPROVED' | 'ALL';

export function ApprovalDetailQueue({ campaignId, submissions }: ApprovalDetailQueueProps) {
  const t = useTranslations('operations.approvals');

  // Derive initial tab from submissions data
  const initialTab: TabType = useMemo(() => {
    const hasPending = submissions.some((s) => s.submission.status === 'SUBMITTED');
    if (hasPending) return 'PENDING';
    const hasRevision = submissions.some((s) => s.submission.status === 'NEEDS_REVISION');
    if (hasRevision) return 'NEEDS_REVISION';
    const hasApproved = submissions.some((s) => s.submission.status === 'APPROVED');
    if (hasApproved) return 'APPROVED';
    return 'ALL';
  }, [submissions]);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Group counts
  const counts = useMemo(() => {
    return {
      pending: submissions.filter((s) => s.submission.status === 'SUBMITTED').length,
      revision: submissions.filter((s) => s.submission.status === 'NEEDS_REVISION').length,
      approved: submissions.filter((s) => s.submission.status === 'APPROVED').length,
      all: submissions.length,
    };
  }, [submissions]);

  // 2. Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Tab filter
      if (activeTab === 'PENDING' && item.submission.status !== 'SUBMITTED') return false;
      if (activeTab === 'NEEDS_REVISION' && item.submission.status !== 'NEEDS_REVISION') return false;
      if (activeTab === 'APPROVED' && item.submission.status !== 'APPROVED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBooth = item.boothName?.toLowerCase().includes(q);
        const matchesLocation = item.location?.name?.toLowerCase().includes(q) || item.location?.city?.toLowerCase().includes(q);
        const matchesCriteria = item.checklistItem?.title?.toLowerCase().includes(q);
        return Boolean(matchesBooth || matchesLocation || matchesCriteria);
      }

      return true;
    });
  }, [submissions, activeTab, searchQuery]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / itemsPerPage));
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Queue Toolbar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PENDING');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-2xs font-bold'
                : 'text-amber-800 hover:bg-amber-50'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{t('tabPending')}</span>
            <span className="opacity-90 text-[11px]">({counts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('NEEDS_REVISION');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'NEEDS_REVISION'
                ? 'bg-red-600 text-white shadow-2xs font-bold'
                : 'text-red-700 hover:bg-red-50'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{t('tabNeedsRevision')}</span>
            <span className="opacity-90 text-[11px]">({counts.revision})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('APPROVED');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-50'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t('tabApproved')}</span>
            <span className="opacity-90 text-[11px]">({counts.approved})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'ALL'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{t('tabAllSubmissions')}</span>
            <span className="opacity-70 text-[11px]">({counts.all})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder={t('searchSubmissionsPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Review Panels List */}
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center bg-white shadow-2xs">
          {activeTab === 'PENDING' ? (
            <>
              <CheckCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">{t('emptyPendingTitle')}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{t('emptyPendingDesc')}</p>
            </>
          ) : activeTab === 'NEEDS_REVISION' ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">{t('emptyRevisionTitle')}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{t('emptyRevisionDesc')}</p>
            </>
          ) : activeTab === 'APPROVED' ? (
            <>
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">{t('emptyApprovedTitle')}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{t('emptyApprovedDesc')}</p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Không tìm thấy bài nộp nào phù hợp.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedSubmissions.map(({ submission, location, checklistItem, boothName }) => (
            <ReviewPanel
              key={submission.id}
              submission={submission}
              location={location}
              checklistItem={checklistItem}
              boothName={boothName}
              campaignId={campaignId}
            />
          ))}

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSubmissions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            className="rounded-xl border border-slate-200 bg-white shadow-2xs"
          />
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Campaign, Location } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Clock, Download, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export interface LocationAuditStat {
  totalChecklists: number;
  approvedCount: number;
  boothCount: number;
}

interface ReportViewProps {
  campaign: Campaign;
  locations: Location[];
  locationStats?: Record<string, LocationAuditStat>;
}

export function ReportView({ campaign, locations, locationStats }: ReportViewProps) {
  const t = useTranslations('reports.view');
  const tExcel = useTranslations('reports.excel');
  const locale = useLocale();

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = locations.map((loc, idx) => {
      const stat = locationStats?.[loc.id] || { totalChecklists: 0, approvedCount: 0, boothCount: 0 };
      let statusText = tExcel('statusNotConfigured');
      if (stat.totalChecklists > 0) {
        if (stat.approvedCount >= stat.totalChecklists) {
          statusText = tExcel('statusExcelCompleted');
        } else {
          statusText = tExcel('statusExcelInProgress', {
            percent: Math.round((stat.approvedCount / stat.totalChecklists) * 100),
            approved: stat.approvedCount,
            total: stat.totalChecklists,
          });
        }
      } else {
        statusText = tExcel('statusExcelNoCriteria');
      }

      return {
        [tExcel('colSTT')]: idx + 1,
        [tExcel('colCampaign')]: campaign.title,
        [tExcel('colBrand')]: campaign.brandName,
        [tExcel('colBoothName')]: loc.name,
        [tExcel('colAddress')]: loc.address,
        [tExcel('colCity')]: loc.city,
        [tExcel('colDeadline')]: loc.deadline ? formatDate(loc.deadline, locale) : '—',
        [tExcel('colPassed')]: `${stat.approvedCount}/${stat.totalChecklists}`,
        [tExcel('colStatus')]: statusText,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tExcel('sheetName'));
    XLSX.writeFile(wb, `EventGo_Report_${campaign.brandName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
            <Download className="h-4 w-4 text-emerald-600" />
            {t('btnExportExcel')}
          </Button>

          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="h-4 w-4" />
            {t('btnPrint')}
          </Button>
        </div>
      </div>

      {/* Printable Audit Document Canvas */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">EventGo Proof</span>
            </div>
            <p className="text-xs text-slate-500">{t('systemSub')}</p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-900">{t('reportCode', { code: campaign.id.substring(0, 8).toUpperCase() })}</p>
            <p>{t('issueDate', { date: formatDate(new Date(), locale) })}</p>
          </div>
        </div>

        {/* Campaign Executive Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400">{t('campaignName')} </span>
              <strong className="text-slate-900">{campaign.title}</strong>
            </div>
            <div>
              <span className="text-slate-400">{t('brand')} </span>
              <strong className="text-blue-700">{campaign.brandName}</strong>
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <div>
              <span className="text-slate-400">{t('period')} </span>
              <strong className="text-slate-900">
                {formatDate(campaign.startDate, locale)} — {formatDate(campaign.endDate, locale)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">{t('totalScale')} </span>
              <strong className="text-slate-900">{t('scaleCount', { count: locations.length })}</strong>
            </div>
          </div>
        </div>

        {/* Audit Verification Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t('tableTitle')}
          </h3>

          <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">{t('thIndex')}</th>
                  <th className="p-3">{t('thLocation')}</th>
                  <th className="p-3">{t('thAddress')}</th>
                  <th className="p-3">{t('thCriteria')}</th>
                  <th className="p-3 text-right">{t('thStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc, idx) => {
                  const stat = locationStats?.[loc.id] || { totalChecklists: 0, approvedCount: 0, boothCount: 0 };
                  const isFullyApproved = stat.totalChecklists > 0 && stat.approvedCount >= stat.totalChecklists;
                  const isInProgress = stat.approvedCount > 0 && stat.approvedCount < stat.totalChecklists;
                  const hasNoChecklists = stat.totalChecklists === 0;

                  return (
                    <tr key={loc.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-500">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{loc.name}</td>
                      <td className="p-3 text-slate-600">
                        {loc.address}, {loc.city}
                      </td>
                      <td className="p-3 text-slate-600">
                        {stat.totalChecklists > 0
                          ? t('criteriaCount', { approved: stat.approvedCount, total: stat.totalChecklists })
                          : t('zeroCriteria')}
                      </td>
                      <td className="p-3 text-right">
                        {isFullyApproved ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('statusCompleted')}
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {t('statusInProgress', { percent: Math.round((stat.approvedCount / stat.totalChecklists) * 100) })}
                          </span>
                        ) : hasNoChecklists ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {t('statusNoCriteria')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                            {t('statusNotAccepted')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature & Verification Block */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
          <div className="space-y-12">
            <p className="font-bold text-slate-900">{t('agencyRep')}</p>
            <p className="text-slate-400 italic">{t('signNote')}</p>
          </div>
          <div className="space-y-12">
            <p className="font-bold text-slate-900">{t('clientRep')}</p>
            <p className="text-slate-400 italic">{t('signNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

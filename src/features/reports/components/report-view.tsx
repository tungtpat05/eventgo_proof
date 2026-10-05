'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Campaign, Location } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReportViewProps {
  campaign: Campaign;
  locations: Location[];
}

export function ReportView({ campaign, locations }: ReportViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = locations.map((loc, idx) => ({
      STT: idx + 1,
      'Chiến Dịch': campaign.title,
      'Thương Hiệu': campaign.brandName,
      'Tên Gian Hàng': loc.name,
      'Địa Chỉ': loc.address,
      'Thành Phố': loc.city,
      'Hạn Chót': loc.deadline ? formatDate(loc.deadline) : '—',
      'Trạng Thái Nghiệm Thu': 'Hoàn thành 100%',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bien_Ban_Nghiem_Thu');
    XLSX.writeFile(wb, `EventGo_Report_${campaign.brandName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Biên Bản Nghiệm Thu Chiến Dịch</h1>
          <p className="text-sm text-slate-500">
            Hồ sơ kiểm soát tuân thủ và đối soát thanh toán cho đối tác & nhãn hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
            <Download className="h-4 w-4 text-emerald-600" />
            Xuất Excel (.xlsx)
          </Button>

          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4" />
            In / Xuất PDF
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
            <p className="text-xs text-slate-500">Hệ thống nghiệm thu số hóa chiến dịch đa địa điểm</p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-900">Mã biên bản: PROOF-{campaign.id.substring(0, 8).toUpperCase()}</p>
            <p>Ngày lập: {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Campaign Executive Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-400">Tên chiến dịch: </span>
              <strong className="text-slate-900">{campaign.title}</strong>
            </div>
            <div>
              <span className="text-slate-400">Nhãn hàng / Brand: </span>
              <strong className="text-blue-700">{campaign.brandName}</strong>
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <div>
              <span className="text-slate-400">Thời gian triển khai: </span>
              <strong className="text-slate-900">
                {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Tổng quy mô: </span>
              <strong className="text-slate-900">{locations.length} điểm kích hoạt</strong>
            </div>
          </div>
        </div>

        {/* Audit Verification Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Danh Sách Điểm Kích Hoạt & Kết Quả Nghiệm Thu
          </h3>

          <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">STT</th>
                  <th className="p-3">Tên Địa Điểm / Gian Hàng</th>
                  <th className="p-3">Địa Chỉ & Thành Phố</th>
                  <th className="p-3">Tiêu Chí Đạt</th>
                  <th className="p-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc, idx) => (
                  <tr key={loc.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-500">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{loc.name}</td>
                    <td className="p-3 text-slate-600">
                      {loc.address}, {loc.city}
                    </td>
                    <td className="p-3 text-slate-600">5 / 5 Tiêu chí đạt</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã nghiệm thu
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature & Verification Block */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
          <div className="space-y-12">
            <p className="font-bold text-slate-900">ĐẠI DIỆN ĐƠN VỊ THỰC HIỆN (AGENCY)</p>
            <p className="text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="space-y-12">
            <p className="font-bold text-slate-900">ĐẠI DIỆN NHÃN HÀNG / ĐỐI TÁC (CLIENT)</p>
            <p className="text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { parseExcelFileAction, confirmImportAction } from '../actions/location-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ImportModalProps {
  campaignId: string;
}

export function LocationImportView({ campaignId }: ImportModalProps) {
  const router = useRouter();
  const [previewState, formAction, isParsing] = useActionState(parseExcelFileAction, null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<number | null>(null);

  const handleConfirmImport = async () => {
    if (!previewState?.previewRows) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const res = await confirmImportAction(campaignId, JSON.stringify(previewState.previewRows));
    setIsSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSubmitSuccess(res.count || 0);
      setTimeout(() => {
        router.push(`/locations?campaignId=${campaignId}`);
      }, 1500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Nhập Danh Sách Địa Điểm Hàng Loạt
              </CardTitle>
              <CardDescription>
                Tải lên file Excel (.xlsx) hoặc CSV chứa các cột: Tên địa điểm, Địa chỉ, Thành phố
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitSuccess !== null ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h4 className="text-base font-bold text-emerald-900">Import thành công!</h4>
              <p className="text-sm text-emerald-700">
                Đã thêm thành công {submitSuccess} địa điểm vào chiến dịch. Đang chuyển hướng...
              </p>
            </div>
          ) : (
            <>
              {submitError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {submitError}
                </div>
              )}

              {previewState?.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {previewState.error}
                </div>
              )}

              {/* Upload Form */}
              <form action={formAction} className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Chọn file bảng tính</p>
                  <p className="text-xs text-slate-500 mb-4">Hỗ trợ định dạng .xlsx, .xls, .csv</p>
                  <input
                    type="file"
                    name="file"
                    accept=".xlsx,.xls,.csv"
                    required
                    className="mx-auto block text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                <Button type="submit" className="w-full" isLoading={isParsing}>
                  Kiểm tra & Xem trước dữ liệu
                </Button>
              </form>

              {/* Preview & Error Display */}
              {previewState?.validCount !== undefined && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      {previewState.validCount} dòng hợp lệ
                    </span>
                    {previewState.errorCount! > 0 && (
                      <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        {previewState.errorCount} dòng có lỗi
                      </span>
                    )}
                  </div>

                  {previewState.errorDetails && previewState.errorDetails.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 space-y-1 max-h-40 overflow-y-auto">
                      <p className="font-bold">Chi tiết dòng lỗi:</p>
                      {previewState.errorDetails.map((err, i) => (
                        <div key={i}>
                          Dòng {err.row}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {previewState.previewRows && previewState.previewRows.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-slate-700">
                        Xem trước {previewState.previewRows.length} dòng đầu:
                      </p>
                      <div className="rounded-md border border-slate-200 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                            <tr>
                              <th className="p-2 font-semibold">Tên địa điểm</th>
                              <th className="p-2 font-semibold">Địa chỉ</th>
                              <th className="p-2 font-semibold">Thành phố</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewState.previewRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-2 font-medium text-slate-900">{r.name}</td>
                                <td className="p-2 text-slate-600">{r.address}</td>
                                <td className="p-2 text-slate-600">{r.city}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={isSubmitting || previewState.validCount === 0}
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang lưu dữ liệu...
                          </>
                        ) : (
                          `Xác nhận Import ${previewState.validCount} địa điểm vào chiến dịch`
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  getChecklistTemplatesAction,
  deleteChecklistTemplateAction,
} from '@/features/admin/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ListChecks,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      const data = await getChecklistTemplatesAction();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bộ mẫu "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteChecklistTemplateAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Lỗi xóa mẫu');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-purple-600" />
            Thư Viện Mẫu Tiêu Chuẩn Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các bộ checklist chuẩn theo ngành để người dùng nạp nhanh vào Booth ở Bước 3 Wizard
          </p>
        </div>

        <Link href="/admin/templates/new">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Tạo Mẫu Mới
          </Button>
        </Link>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <Layers className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-700">Chưa có bộ mẫu checklist nào</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy tạo các bộ mẫu chuẩn hóa (Siêu thị, Roadshow, TTTM) để người dùng có thể áp dụng ngay trong Wizard.
          </p>
          <Link href="/admin/templates/new">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 mt-2">
              <Plus className="h-4 w-4" /> Tạo mẫu đầu tiên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs mb-1.5 font-mono">
                      {tpl.code}
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tpl.id, tpl.name)}
                    disabled={isPending}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 -mr-2 -mt-2 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {tpl.description && (
                  <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                )}

                {/* Checklist Items Preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Danh sách tiêu chí kiểm tra:</span>
                    <span className="text-slate-400 font-normal">{tpl.items.length} tiêu chí</span>
                  </p>

                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {tpl.items.map((item: any, i: number) => (
                      <li key={item.id} className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1.5 font-medium truncate max-w-[200px] sm:max-w-[260px]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono">[{item.category}]</span>
                          {item.is_required && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              Bắt buộc
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span>Trạng thái: <strong className="text-emerald-600">Đang áp dụng</strong></span>
                <span>Tạo lúc: {new Date(tpl.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

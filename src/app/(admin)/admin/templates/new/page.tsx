'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createChecklistTemplateAction } from '@/features/admin/actions/admin-actions';
import { ChecklistCategory } from '@/domain/enums';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface FormItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  isRequired: boolean;
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChecklistCategory>(ChecklistCategory.OTHER);
  const [items, setItems] = useState<FormItem[]>([
    {
      id: '1',
      title: 'Kiểm tra quầy kệ & kết cấu gian hàng',
      description: 'Chụp toàn cảnh mặt trước và 2 bên hông gian hàng',
      category: ChecklistCategory.STRUCTURE,
      isRequired: true,
    },
    {
      id: '2',
      title: 'Kiểm tra Logo & Vật phẩm POSM',
      description: 'Chụp cận cảnh logo nhãn hàng, standee và quà tặng',
      category: ChecklistCategory.BRANDING,
      isRequired: true,
    },
    {
      id: '3',
      title: 'Kiểm tra Nhân sự PG & Đồng phục',
      description: 'Chụp nhân viên PG/PB có mặt tại quầy đúng đồng phục',
      category: ChecklistCategory.STAFFING,
      isRequired: true,
    },
  ]);
  const [isPending, startTransition] = useTransition();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: '',
        description: '',
        category: ChecklistCategory.OTHER,
        isRequired: true,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Vui lòng điền đầy đủ Tên và Mã mẫu');
      return;
    }

    const validItems = items.filter((i) => i.title.trim().length > 0);
    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 tiêu chí hợp lệ');
      return;
    }

    startTransition(async () => {
      try {
        await createChecklistTemplateAction({
          name: name.trim(),
          code: code.trim(),
          description: description.trim(),
          category,
          items: validItems.map((i) => ({
            title: i.title.trim(),
            description: i.description.trim() || undefined,
            category: i.category,
            isRequired: i.isRequired,
          })),
        });
        router.push('/admin/templates');
      } catch (err: any) {
        alert(err.message || 'Lỗi tạo mẫu');
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header back link */}
      <div className="flex items-center gap-2">
        <Link href="/admin/templates">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-600 hover:text-slate-900 gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Thư viện mẫu
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-purple-700">
            1. Thông Tin Nhận Diện Mẫu
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên bộ mẫu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kiểm tra Activation Siêu Thị"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mã mẫu (Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TPL_SUPERMARKET_STD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Phân loại danh mục chính
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value={ChecklistCategory.STRUCTURE}>Kết cấu (STRUCTURE)</option>
              <option value={ChecklistCategory.BRANDING}>Thương hiệu (BRANDING)</option>
              <option value={ChecklistCategory.POSM}>Vật phẩm POSM</option>
              <option value={ChecklistCategory.STAFFING}>Nhân sự (STAFFING)</option>
              <option value={ChecklistCategory.CONDITION}>Hiện trạng (CONDITION)</option>
              <option value={ChecklistCategory.OTHER}>Khác (OTHER)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mô tả chi tiết mục đích áp dụng
            </label>
            <textarea
              rows={2}
              placeholder="Bộ tiêu chí áp dụng cho các booth activation tại kênh MT (Siêu thị Big C, Co.opmart)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Dynamic Checklist Items Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-purple-700">
              2. Danh Sách Tiêu Chí Con ({items.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm tiêu chí
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Tiêu chí #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Xóa tiêu chí"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tiêu đề tiêu chí <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kiểm tra đồng phục nhân viên PG"
                      value={item.title}
                      onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Danh mục
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(item.id, 'category', e.target.value as ChecklistCategory)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value={ChecklistCategory.STRUCTURE}>STRUCTURE</option>
                      <option value={ChecklistCategory.BRANDING}>BRANDING</option>
                      <option value={ChecklistCategory.POSM}>POSM</option>
                      <option value={ChecklistCategory.STAFFING}>STAFFING</option>
                      <option value={ChecklistCategory.CONDITION}>CONDITION</option>
                      <option value={ChecklistCategory.OTHER}>OTHER</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Hướng dẫn chụp bằng chứng
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chụp rõ mặt và bảng tên của nhân sự..."
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id={`req_${item.id}`}
                    checked={item.isRequired}
                    onChange={(e) => handleItemChange(item.id, 'isRequired', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor={`req_${item.id}`} className="text-xs text-slate-700 select-none">
                    Bắt buộc phải nộp ảnh mới được duyệt
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/templates">
            <Button type="button" variant="outline" className="text-xs">
              Hủy
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Lưu Bộ Mẫu Vào Hệ Thống
          </Button>
        </div>
      </form>
    </div>
  );
}

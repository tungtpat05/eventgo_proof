'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { createCampaignAction } from '../actions/campaign-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CampaignStatus } from '@/domain/enums';
import { ArrowLeft } from 'lucide-react';

export function CampaignForm() {
  const [state, formAction, isPending] = useActionState(createCampaignAction, null);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Tạo Chiến Dịch Mới</CardTitle>
          <CardDescription>
            Khởi tạo chiến dịch kích hoạt thương hiệu để thiết lập danh sách gian hàng và tiêu chí nghiệm thu.
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {state.error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="title">
                Tên chiến dịch *
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="VD: Summer Activation 2026 — Trưng Bày Đồ Uống"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="brandName">
                Thương hiệu / Nhãn hàng *
              </label>
              <Input
                id="brandName"
                name="brandName"
                required
                placeholder="VD: FreshJuice Co. / Samsung / Unilever"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="startDate">
                  Ngày bắt đầu *
                </label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  defaultValue={today}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="endDate">
                  Ngày kết thúc *
                </label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  defaultValue={today}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="status">
                Trạng thái khởi tạo
              </label>
              <select
                id="status"
                name="status"
                defaultValue={CampaignStatus.DRAFT}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <option value={CampaignStatus.DRAFT}>Bản nháp (Draft)</option>
                <option value={CampaignStatus.ACTIVE}>Đang triển khai (Active)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="description">
                Mô tả chi tiết / Yêu cầu chung
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Nhập ghi chú quy mô, mục tiêu nghiệm thu hoặc quy định đặc thù của chiến dịch..."
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href="/campaigns">
              <Button variant="outline" type="button">Hủy bỏ</Button>
            </Link>
            <Button type="submit" isLoading={isPending}>
              Tạo chiến dịch
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

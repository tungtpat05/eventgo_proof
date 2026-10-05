'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { createLocationAction } from '../actions/location-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Campaign } from '@/domain/entities';

interface LocationFormProps {
  campaigns: Campaign[];
  defaultCampaignId?: string;
}

export function LocationForm({ campaigns, defaultCampaignId }: LocationFormProps) {
  const [state, formAction, isPending] = useActionState(createLocationAction, null);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/locations">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Thêm Địa Điểm Mới</CardTitle>
              <CardDescription>
                Thiết lập thông tin gian hàng hoặc điểm kích hoạt cho chiến dịch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                <span className="font-semibold shrink-0">Lỗi:</span>
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="campaignId">
                Thuộc chiến dịch *
              </label>
              <select
                id="campaignId"
                name="campaignId"
                required
                defaultValue={defaultCampaignId || campaigns[0]?.id || ''}
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  state?.fieldErrors?.campaignId
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-slate-200 focus-visible:ring-blue-600'
                }`}
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.brandName})
                  </option>
                ))}
              </select>
              {state?.fieldErrors?.campaignId && (
                <p className="text-xs text-red-600 font-medium">{state.fieldErrors.campaignId[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="name">
                Tên địa điểm / gian hàng *
              </label>
              <Input
                id="name"
                name="name"
                required
                placeholder="VD: Gian Hàng Sảnh A — Vincom Center Bà Triệu"
                className={state?.fieldErrors?.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {state?.fieldErrors?.name && (
                <p className="text-xs text-red-600 font-medium">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="address">
                  Địa chỉ chi tiết *
                </label>
                <Input
                  id="address"
                  name="address"
                  required
                  placeholder="VD: 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng"
                  className={state?.fieldErrors?.address ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {state?.fieldErrors?.address && (
                  <p className="text-xs text-red-600 font-medium">{state.fieldErrors.address[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="city">
                  Thành phố *
                </label>
                <Input
                  id="city"
                  name="city"
                  required
                  placeholder="VD: Hà Nội / TP.HCM"
                  className={state?.fieldErrors?.city ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {state?.fieldErrors?.city && (
                  <p className="text-xs text-red-600 font-medium">{state.fieldErrors.city[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700" htmlFor="deadline">
                Hạn chót hoàn thành nghiệm thu (Deadline)
              </label>
              <Input
                id="deadline"
                name="deadline"
                type="datetime-local"
                className={state?.fieldErrors?.deadline ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {state?.fieldErrors?.deadline && (
                <p className="text-xs text-red-600 font-medium">{state.fieldErrors.deadline[0]}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href="/locations">
              <Button variant="outline" type="button">Hủy bỏ</Button>
            </Link>
            <Button type="submit" isLoading={isPending}>
              Lưu địa điểm
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

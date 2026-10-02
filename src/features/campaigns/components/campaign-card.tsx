import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/domain/entities';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Calendar, Tag, ArrowRight } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  locationsCount?: number;
}

export function CampaignCard({ campaign, locationsCount = 0 }: CampaignCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            <Tag className="h-3 w-3" />
            {campaign.brandName}
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
          {campaign.title}
        </CardTitle>
        {campaign.description && (
          <CardDescription className="line-clamp-2 text-xs text-slate-500 mt-1">
            {campaign.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>
            {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {locationsCount > 0 ? `${locationsCount} địa điểm` : 'Chưa có địa điểm'}
        </span>
        <Link href={`/campaigns/${campaign.id}`}>
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            Chi tiết
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

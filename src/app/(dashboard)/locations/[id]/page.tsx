import { notFound, redirect } from 'next/navigation';
import { getLocationDetailsUseCase } from '@/application/use-cases/locations/get-location-details';

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { id } = await params;
  let location;
  try {
    location = await getLocationDetailsUseCase(id);
  } catch {
    notFound();
  }

  // Chuyển hướng về trang chi tiết chiến dịch chứa địa điểm này
  redirect(`/campaigns/${location.campaignId}`);
}

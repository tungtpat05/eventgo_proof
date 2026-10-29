import { redirect } from 'next/navigation';

interface CampaignsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CampaignsRootRedirect({ searchParams }: CampaignsPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    }
  });

  const queryString = query.toString();
  redirect(queryString ? `/campaigns/managed?${queryString}` : '/campaigns/managed');
}

'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { statistiquesRevenusParCategorieEndpoint } from '@/services/api.service';

export interface RevenuDistributionDataPoint {
  _id: string;
  nom: string;
  total: number;
}

export const useRevenuDistributionByCategorie = (
  year: number,
  month: number,
  contexte?: 'moi' | 'couple',
) => {
  const formattedMonth = String(month).padStart(2, '0');
  let url = `${statistiquesRevenusParCategorieEndpoint}?annee=${year}&mois=${formattedMonth}`;
  if (contexte && contexte === 'couple') {
    url += `&contexte=couple`;
  }
  const { data, error, isLoading, mutate } = useSWR<
    RevenuDistributionDataPoint[]
  >(url, fetcher, { shouldRetryOnError: false });

  return {
    revenuDistribution: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};

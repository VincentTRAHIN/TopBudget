'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { statistiquesParCategorieEndpoint } from '@/services/api.service';

export interface CategoryDistributionDataPoint {
  _id: string;
  nom: string;
  total: number;
}

export const useCategoryDistribution = (
  year: number,
  month: number,
  contexte?: 'moi' | 'couple',
) => {
  const formattedMonth = String(month).padStart(2, '0');
  let url = `${statistiquesParCategorieEndpoint}?annee=${year}&mois=${formattedMonth}`;
  // Correction : n'ajoute le paramètre que si contexte est exactement 'couple'
  if (contexte && contexte === 'couple') {
    url += `&contexte=couple`;
  }
  const { data, error, isLoading, mutate } = useSWR<
    CategoryDistributionDataPoint[]
  >(url, fetcher, {
    shouldRetryOnError: false,
  });

  return {
    categoryDistribution: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};

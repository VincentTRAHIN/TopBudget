'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { statistiquesParCategorieEndpoint } from '@/services/api.service';
import { useEffect } from 'react';

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
  if (contexte && contexte === 'couple') {
    url += `&contexte=couple`;
  }
  const { data, error, isLoading, mutate } = useSWR<
    CategoryDistributionDataPoint[]
  >(url, fetcher, {
    shouldRetryOnError: false,
  });

  useEffect(() => {
    mutate();
  }, [year, month, contexte, mutate]);

  return {
    categoryDistribution: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};

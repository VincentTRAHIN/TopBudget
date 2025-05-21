'use client';

import useSWR from 'swr';
import { createSafeDataFetcher } from '@/utils/fetcher.utils';
import { statistiquesRevenusParCategorieEndpoint } from '@/services/api.service';
import { useEffect } from 'react';

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

  const safeFetcher = createSafeDataFetcher<RevenuDistributionDataPoint[]>(
    [],
    (error) => {
      if (error.status === 404) {
      }
    },
  );

  const { data, error, isLoading, mutate } = useSWR(url, safeFetcher, {
    shouldRetryOnError: false,
    fallbackData: [] as RevenuDistributionDataPoint[],
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    onError: (error) => {
      console.error('[useRevenuDistributionByCategorie] Error fetching data:', error);
    }
  });

  useEffect(() => {
    mutate();
  }, [contexte, year, month, mutate]);

  return {
    revenuDistribution: Array.isArray(data)
      ? data
      : ([] as RevenuDistributionDataPoint[]),
    isLoading,
    isError: error && error.status !== 404,
    error: error,
    mutate,
  };
};

'use client';

import useSWR from 'swr';
import { createSafeDataFetcher } from '@/utils/fetcher.utils';
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
  
  // Créer un fetcher sécurisé qui retourne un tableau vide en cas d'erreur 404
  const safeFetcher = createSafeDataFetcher<RevenuDistributionDataPoint[]>([], 
    (error) => {
      if (error.status === 404) {
        console.warn(`L'endpoint de statistiques par catégorie de revenus n'est pas disponible: ${url}`);
      }
    }
  );
  
  const { data, error, isLoading, mutate } = useSWR<RevenuDistributionDataPoint[]>(
    url, 
    safeFetcher,
    { 
      shouldRetryOnError: false,
      fallbackData: [],
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  return {
    revenuDistribution: Array.isArray(data) ? data : [],
    isLoading,
    // On ne considère pas une erreur 404 comme une "vraie" erreur pour l'UI
    isError: error && error.status !== 404,
    mutate,
  };
};

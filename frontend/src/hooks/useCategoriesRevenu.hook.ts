'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import { categoriesRevenuEndpoint } from '@/services/api.service';

export const useCategoriesRevenu = () => {
  const { data, error, isLoading, mutate } = useSWR<ICategorieRevenu[]>(
    categoriesRevenuEndpoint,
    fetcher,
    {
      fallbackData: [],
      onSuccess: (data) => {
        console.log('[DEBUG] useCategoriesRevenu - données reçues:', data);
        console.log('[DEBUG] useCategoriesRevenu - type de données:', typeof data, Array.isArray(data));
      },
      onError: (err) => {
        console.error('[ERROR] useCategoriesRevenu - erreur:', err);
      }
    },
  );

  return {
    categoriesRevenu: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refreshCategoriesRevenu: mutate,
  };
};

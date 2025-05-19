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
    },
  );

  return {
    categoriesRevenu: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refreshCategoriesRevenu: mutate,
  };
};

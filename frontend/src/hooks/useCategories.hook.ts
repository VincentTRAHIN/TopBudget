'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { ICategorie } from '@/types/categorie.type';
import { categoriesEndpoint } from '@/services/api.service';
import debug from 'debug';

const log = debug('app:frontend:useCategories');

export const useCategories = () => {
  log('Hook useCategories appelé');
  const { data, error, isLoading, mutate } = useSWR<ICategorie[]>(
    categoriesEndpoint,
    fetcher,
    {
      fallbackData: [],
    },
  );

  log('Retour de useCategories - isLoading: %s, isError: %s, nombre de catégories: %d', isLoading, !!error, data?.length || 0);

  return {
    categories: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

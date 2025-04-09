"use client";

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { ICategorie } from '@/types/categorie.type';
import { categoriesEndpoint } from '@/services/api.service';

export const useCategories = () => {
  const { data, error, isLoading, mutate } = useSWR<ICategorie[]>(
    categoriesEndpoint,
    fetcher,
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    refreshCategories: mutate,
  };
};

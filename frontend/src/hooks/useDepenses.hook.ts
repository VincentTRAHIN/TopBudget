'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { IDepense } from '@/types/depense.type';
import { depensesEndpoint } from '@/services/api.service';

export interface DepensesResponse {
  depenses: IDepense[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface DepenseFilters {
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  typeCompte?: string;
  typeDepense?: string;
  search?: string;
}

export interface DepenseSort {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const useDepenses = (
  page: number = 1,
  limit: number = 25,
  filters: DepenseFilters = {},
  sort: DepenseSort = {},
  vue: 'moi' | 'partenaire' | 'couple_complet' = 'moi',
) => {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });

  if (sort.sortBy) {
    queryParams.append('sortBy', sort.sortBy);
    queryParams.append('order', sort.order || 'asc');
  }

  if (vue && vue !== 'moi') {
    queryParams.append('vue', vue);
  }

  const url = `${depensesEndpoint}?${queryParams.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<DepensesResponse>(
    url,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  return {
    depenses: data?.depenses || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refreshDepenses: mutate,
  };
};

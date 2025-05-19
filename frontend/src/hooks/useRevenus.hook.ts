'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { IRevenu } from '@/types/revenu.type';
import { revenusEndpoint } from '@/services/api.service';

export interface RevenusResponse {
  revenus: IRevenu[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface RevenuFilters {
  dateDebut?: string;
  dateFin?: string;
  typeCompte?: string;
  search?: string;
  categorieRevenu?: string;
  estRecurrent?: 'true' | 'false' | '';
}

export interface RevenuSort {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const useRevenus = (
  page: number = 1,
  limit: number = 25,
  filters: RevenuFilters = {},
  sort: RevenuSort = {},
  vue: 'moi' | 'partenaire' | 'couple_complet' = 'moi',
) => {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      if (key === 'estRecurrent') {
        if (value === 'true' || value === 'false') {
          queryParams.append('estRecurrent', value);
        }
      } else if (key === 'search') {
        queryParams.append('search', value);
      } else {
        queryParams.append(key, value);
      }
    }
  });

  if (sort.sortBy) {
    queryParams.append('sortBy', sort.sortBy);
    queryParams.append('order', sort.order || 'asc');
  }

  if (vue && vue !== 'moi') {
    queryParams.append('vue', vue);
  }

  const url = `${revenusEndpoint}?${queryParams.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<RevenusResponse>(
    url,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  return {
    revenus: data?.revenus || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refreshRevenus: mutate,
  };
};

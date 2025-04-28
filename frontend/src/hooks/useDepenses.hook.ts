"use client";

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { IDepense } from '@/types/depense.type';
import { depensesEndpoint } from '@/services/api.service';

interface DepensesResponse {
  depenses: IDepense[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  }
}

export interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export const useDepenses = (page: number = 1, limit: number = 25) => {
  const url = `${depensesEndpoint}?page=${page}&limit=${limit}`;
  const { data, error, isLoading, mutate } = useSWR<DepensesResponse>(
    url,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  return {
    depenses: data?.depenses || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    refreshDepenses: mutate,
  };
};

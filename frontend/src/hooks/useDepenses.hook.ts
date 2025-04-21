"use client";

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { IDepense } from '@/types/depense.type';
import { depensesEndpoint } from '@/services/api.service';

interface DepensesResponse {
  depenses: IDepense[];
  total: number;
}

export const useDepenses = () => {
  const { data, error, isLoading, mutate } = useSWR<DepensesResponse>(
    depensesEndpoint,
    fetcher,
  );

  return {
    depenses: data?.depenses || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refreshDepenses: mutate,
  };
};

"use client";

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { totalMensuelEndpoint } from '@/services/api.service';
import { IDepense } from '@/types/depense.type';

export interface CurrentMonthTotalData {
  total: number;
  depenses?: IDepense[];
}

export const useCurrentMonthTotal = () => {
  const url = totalMensuelEndpoint;
  
  const { data, error, isLoading, mutate } = useSWR<CurrentMonthTotalData>(
    url,
    fetcher,
    {
      shouldRetryOnError: false,
    }
  );

  return {
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
};

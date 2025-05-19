'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { soldeMensuelEndpoint } from '@/services/api.service';

export interface CurrentMonthFlowsData {
  totalDepenses: number;
  totalRevenus: number;
  solde: number;
}

interface ApiResponse {
  status: string;
  message: string;
  data: CurrentMonthFlowsData;
}

export const useCurrentMonthFlows = (contexte: 'moi' | 'couple' = 'moi') => {
  const url = `${soldeMensuelEndpoint}${contexte !== 'moi' ? `?contexte=${contexte}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    url,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    },
  );

  const flowData = data?.data;

  return {
    totalDepenses: flowData?.totalDepenses || 0,
    totalRevenus: flowData?.totalRevenus || 0,
    solde: flowData?.solde || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
};

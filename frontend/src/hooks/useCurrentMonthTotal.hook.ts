'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { soldeMensuelEndpoint } from '@/services/api.service';

export interface CurrentMonthFlowsData {
  totalDepenses: number;
  totalRevenus: number;
  solde: number;
}

export const useCurrentMonthFlows = (contexte: 'moi' | 'couple' = 'moi') => {
  const url = `${soldeMensuelEndpoint}${contexte !== 'moi' ? `?contexte=${contexte}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<CurrentMonthFlowsData>(
    url,
    fetcher,
    {
      shouldRetryOnError: false,
    },
  );

  return {
    totalDepenses: data?.totalDepenses || 0,
    totalRevenus: data?.totalRevenus || 0,
    solde: data?.solde || 0,
    isLoading,
    isError: error,
    mutate,
  };
};

'use client';

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { soldeMensuelEndpoint } from '@/services/api.service';

export interface CurrentMonthFlowsData {
  totalDepenses: number;
  totalRevenus: number;
  solde: number;
  mois?: string;
}

export const useCurrentMonthFlows = (contexte: 'moi' | 'couple' = 'moi') => {
  const url = `${soldeMensuelEndpoint}${contexte !== 'moi' ? `?contexte=${contexte}` : ''}`;

  const {
    data: responseData,
    error,
    isLoading,
    mutate,
  } = useSWR<CurrentMonthFlowsData>(url, fetcher, {
    shouldRetryOnError: true,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  });

  const flowData = responseData;

  const returnObject = {
    totalDepenses: flowData?.totalDepenses || 0,
    totalRevenus: flowData?.totalRevenus || 0,
    solde: flowData?.solde || 0,
    isLoading,
    isError: !!error,
    mutate,
  };

  return returnObject;
};

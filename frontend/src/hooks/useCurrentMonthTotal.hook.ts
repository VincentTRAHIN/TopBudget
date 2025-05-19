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
  console.log(
    '[useCurrentMonthFlows] Appel API avec URL:',
    url,
    'et contexte:',
    contexte,
  );

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

  console.log(
    '[useCurrentMonthFlows] Données brutes reçues par SWR (responseData):',
    responseData,
  );

  const flowData = responseData;
  console.log(
    '[useCurrentMonthFlows] flowData assigné (directement depuis responseData):',
    flowData,
  );

  const returnObject = {
    totalDepenses: flowData?.totalDepenses || 0,
    totalRevenus: flowData?.totalRevenus || 0,
    solde: flowData?.solde || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
  console.log(
    '[useCurrentMonthFlows] Objet retourné par le hook:',
    returnObject,
  );

  return returnObject;
};

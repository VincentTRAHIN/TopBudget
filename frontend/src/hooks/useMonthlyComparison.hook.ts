import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

export const useMonthlyComparison = (
  contexte: 'moi' | 'couple' = 'moi',
  type: 'depenses' | 'revenus' | 'solde' = 'depenses',
) => {
  let url = `${comparaisonMoisEndpoint}`;
  const params = new URLSearchParams();
  if (contexte && contexte !== 'moi') params.append('contexte', contexte);
  if (type) params.append('type', type);
  if (params.toString()) url += `?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<MonthlyComparisonData>(
    url,
    fetcher,
  );

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
};

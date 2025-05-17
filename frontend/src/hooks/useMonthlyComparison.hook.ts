import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

export const useMonthlyComparison = (contexte: 'moi' | 'couple' = 'moi') => {
  const url = `${comparaisonMoisEndpoint}${contexte !== 'moi' ? `?contexte=${contexte}` : ''}`;
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

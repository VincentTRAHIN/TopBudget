import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

export const useMonthlyComparison = () => {
  const { data, error, isLoading, mutate } = useSWR<MonthlyComparisonData>(comparaisonMoisEndpoint, fetcher);

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
};
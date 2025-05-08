import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { evolutionMensuelleEndpoint } from '../services/api.service';
import { MonthlyEvolutionDataPoint } from '../types/statistiques.type';

export const useMonthlyExpensesEvolution = (nbMois: number = 6) => {
  const url = `${evolutionMensuelleEndpoint}?nbMois=${nbMois}`;
  const { data, error, isLoading, mutate } = useSWR<MonthlyEvolutionDataPoint[]>(url, fetcher);

  return {
    data: data || [],
    isLoading,
    isError: error,
    mutate,
    errorMessage: error ? error.message : null,
  };
};

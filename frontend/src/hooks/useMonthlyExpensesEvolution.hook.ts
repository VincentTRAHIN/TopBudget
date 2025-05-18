import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { evolutionMensuelleEndpoint } from '../services/api.service';
import { MonthlyEvolutionDataPoint } from '../types/statistiques.type';

export const useMonthlyFlowsEvolution = (
  nbMois: number = 6,
  contexte?: 'moi' | 'couple',
  dataType: 'depenses' | 'revenus' | 'solde' = 'depenses',
) => {
  let url = `${evolutionMensuelleEndpoint}?nbMois=${nbMois}`;
  if (contexte && contexte === 'couple') {
    url += `&contexte=couple`;
  }
  if (dataType) {
    url += `&dataType=${dataType}`;
  }
  const { data, error, isLoading, mutate } = useSWR<
    MonthlyEvolutionDataPoint[]
  >(url, fetcher);

  return {
    data: data || [],
    isLoading,
    isError: error,
    mutate,
    errorMessage: error ? error.message : null,
  };
};

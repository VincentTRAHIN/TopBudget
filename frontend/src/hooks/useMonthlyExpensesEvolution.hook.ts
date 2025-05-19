import useSWR from 'swr';
import { createSafeDataFetcher } from '../utils/fetcher.utils';
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

  const safeFetcher = createSafeDataFetcher<MonthlyEvolutionDataPoint[]>(
    [],
    (error) => {
      console.error(
        `Erreur lors du chargement des données d'évolution pour ${dataType}:`,
        error,
      );
    },
  );

  const { data, error, isLoading, mutate } = useSWR(url, safeFetcher, {
    fallbackData: [] as MonthlyEvolutionDataPoint[],
    shouldRetryOnError: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return {
    data: Array.isArray(data) ? data : [] as MonthlyEvolutionDataPoint[],
    isLoading,
    isError: !!error && error.status !== 404,
    mutate,
    errorMessage: error ? (error as Error).message : null,
  };
};

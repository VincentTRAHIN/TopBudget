import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

export const useMonthlyComparison = (
  contexte: 'moi' | 'couple' = 'moi',
  type: 'depenses' | 'revenus' | 'solde' = 'depenses',
) => {
  // Création des dates actuelles et précédentes au format ISO 8601
  const currentDate = new Date();
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);
  
  const dateActuelle = currentDate.toISOString().split('T')[0];
  const datePrecedente = previousDate.toISOString().split('T')[0];

  let url = `${comparaisonMoisEndpoint}`;
  const params = new URLSearchParams();
  
  // Ajout des paramètres obligatoires
  params.append('dateActuelle', dateActuelle);
  params.append('datePrecedente', datePrecedente);
  
  if (contexte && contexte !== 'moi') params.append('contexte', contexte);
  if (type) params.append('type', type);
  
  url += `?${params.toString()}`;

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

import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

interface BackendComparaisonResponse {
  status: string;
  message: string;
  data: {
    actuel:
      | number
      | { totalDepenses: number; totalRevenus: number; solde: number };
    precedent:
      | number
      | { totalDepenses: number; totalRevenus: number; solde: number };
    difference: number;
  };
}

export const useMonthlyComparison = (
  contexte: 'moi' | 'couple' = 'moi',
  type: 'depenses' | 'revenus' | 'solde' = 'depenses',
) => {
  const currentDate = new Date();
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);

  const dateActuelle = currentDate.toISOString().split('T')[0];
  const datePrecedente = previousDate.toISOString().split('T')[0];

  let url = `${comparaisonMoisEndpoint}`;
  const params = new URLSearchParams();

  params.append('dateActuelle', dateActuelle);
  params.append('datePrecedente', datePrecedente);

  if (contexte && contexte !== 'moi') params.append('contexte', contexte);
  if (type) params.append('type', type);

  url += `?${params.toString()}`;

  const {
    data: responseData,
    error,
    isLoading,
    mutate,
  } = useSWR<BackendComparaisonResponse>(url, fetcher);

  const data: MonthlyComparisonData | undefined = responseData?.data
    ? {
        totalMoisActuel:
          typeof responseData.data.actuel === 'number'
            ? responseData.data.actuel
            : type === 'depenses'
              ? responseData.data.actuel.totalDepenses
              : type === 'revenus'
                ? responseData.data.actuel.totalRevenus
                : responseData.data.actuel.solde,
        totalMoisPrecedent:
          typeof responseData.data.precedent === 'number'
            ? responseData.data.precedent
            : type === 'depenses'
              ? responseData.data.precedent.totalDepenses
              : type === 'revenus'
                ? responseData.data.precedent.totalRevenus
                : responseData.data.precedent.solde,
        difference: responseData.data.difference,
        pourcentageVariation:
          responseData.data.precedent &&
          ((typeof responseData.data.precedent === 'number' &&
            responseData.data.precedent !== 0) ||
            (typeof responseData.data.precedent !== 'number' &&
              ((type === 'depenses' &&
                responseData.data.precedent.totalDepenses !== 0) ||
                (type === 'revenus' &&
                  responseData.data.precedent.totalRevenus !== 0) ||
                (type === 'solde' && responseData.data.precedent.solde !== 0))))
            ? (responseData.data.difference /
                (typeof responseData.data.precedent === 'number'
                  ? responseData.data.precedent || 1
                  : type === 'depenses'
                    ? responseData.data.precedent.totalDepenses || 1
                    : type === 'revenus'
                      ? responseData.data.precedent.totalRevenus || 1
                      : responseData.data.precedent.solde || 1)) *
              100
            : 0,
      }
    : undefined;

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
};

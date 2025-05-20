import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

interface DirectFetcherData {
    actuel:
      | number
      | { totalDepenses: number; totalRevenus: number; solde: number };
    precedent:
      | number
      | { totalDepenses: number; totalRevenus: number; solde: number };
    difference: number;
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
  } = useSWR<DirectFetcherData>(url, fetcher, { 
    onSuccess: () => { 
     
    },
    onError: () => {
    }
  });

  let processedData: MonthlyComparisonData | undefined;

  if (responseData) { 
    const actualValue = responseData.actuel; 
    const previousValue = responseData.precedent; 
    const diff = responseData.difference; 

    const totalMoisActuel = 
      typeof actualValue === 'number'
        ? actualValue
        : type === 'depenses'
          ? actualValue.totalDepenses
          : type === 'revenus'
            ? actualValue.totalRevenus
            : actualValue.solde;

    const totalMoisPrecedent = 
      typeof previousValue === 'number'
        ? previousValue
        : type === 'depenses'
          ? previousValue.totalDepenses
          : type === 'revenus'
            ? previousValue.totalRevenus
            : previousValue.solde;
    
   

    let pourcentageVariation = 0;
    const denominator =
      typeof previousValue === 'number'
        ? previousValue
        : type === 'depenses'
          ? previousValue?.totalDepenses
          : type === 'revenus'
            ? previousValue?.totalRevenus
            : previousValue?.solde;

    if (denominator !== undefined && denominator !== 0) {
      pourcentageVariation = (diff / denominator) * 100;
    } else if (diff !== 0) {
      pourcentageVariation = (diff !==0 && totalMoisActuel !==0) ? (diff > 0 ? 100 : -100) : 0;
    }

    processedData = {
      totalMoisActuel,
      totalMoisPrecedent,
      difference: diff,
      pourcentageVariation,
    };
  }

  return {
    data: processedData,
    isLoading,
    isError: !!error,
    mutate,
  };
};

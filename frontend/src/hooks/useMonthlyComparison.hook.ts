import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { comparaisonMoisEndpoint } from '../services/api.service';
import { MonthlyComparisonData } from '../types/statistiques.type';

// interface BackendComparaisonResponse { // L'interface BackendComparaisonResponse n'est plus nécessaire si fetcher extrait déjà data
//   status: string;
//   message: string;
//   data: {
//     actuel:
//       | number
//       | { totalDepenses: number; totalRevenus: number; solde: number };
//     precedent:
//       | number
//       | { totalDepenses: number; totalRevenus: number; solde: number };
//     difference: number;
//   };
// }

// Type attendu directement de fetcher (si celui-ci extrait la propriété 'data' de la réponse backend)
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
  console.log('[useMonthlyComparison] URL construite:', url, 'Params:', { contexte, type, dateActuelle, datePrecedente });

  const {
    data: responseData, // responseData est maintenant de type DirectFetcherData | undefined
    error,
    isLoading,
    mutate,
  } = useSWR<DirectFetcherData>(url, fetcher, { // SWR attend maintenant DirectFetcherData
    onSuccess: (dataFromFetcher) => { 
      console.log('[useMonthlyComparison] Données BRUTES reçues du fetcher (onSuccess):', dataFromFetcher);
    },
    onError: (error) => {
      console.error('[useMonthlyComparison] Erreur SWR:', error);
    }
  });

  let processedData: MonthlyComparisonData | undefined;

  // MODIFICATION: Utiliser responseData directement, car fetcher a déjà extrait le champ 'data'
  if (responseData) { 
    const actualValue = responseData.actuel; // Accès direct
    const previousValue = responseData.precedent; // Accès direct
    const diff = responseData.difference; // Accès direct

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
    
    console.log('[useMonthlyComparison] Valeurs extraites:', { totalMoisActuel, totalMoisPrecedent, difference: diff });

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

  console.log('[useMonthlyComparison] Données retournées par le hook:', { data: processedData, isLoading, isError: !!error });
  return {
    data: processedData,
    isLoading,
    isError: !!error,
    mutate,
  };
};

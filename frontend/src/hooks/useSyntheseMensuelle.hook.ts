import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { syntheseMensuelleEndpoint } from '@/services/api.service';

export interface SyntheseMoiResponse {
  totaux: {
    personnelles: number;
    communesPayeesParMoi: number;
  };
  categoriesEnHausse: Array<{
    categorieId: string;
    nom: string;
    totalMoisActuel: number;
    totalMoisPrecedent: number;
    variationPourcent: number;
    variationValeur: number;
  }>;
}

export interface SyntheseCoupleResponse {
  totaux: {
    personnellesMoi: number;
    personnellesPartenaire: number;
    communesCouple: number;
  };
  categoriesEnHausse: Array<{
    categorieId: string;
    nom: string;
    totalMoisActuel: number;
    totalMoisPrecedent: number;
    variationPourcent: number;
    variationValeur: number;
  }>;
}

export function useSyntheseMensuelle(
  annee: number,
  mois: number,
  contexte: 'moi' | 'couple'
) {
  const url = `${syntheseMensuelleEndpoint}?annee=${annee}&mois=${mois.toString().padStart(2, '0')}&contexte=${contexte}`;
  const { data, error, isLoading } = useSWR<SyntheseMoiResponse | SyntheseCoupleResponse | null>(url, fetcher);
  return {
    data,
    isLoading,
    isError: !!error,
  };
}

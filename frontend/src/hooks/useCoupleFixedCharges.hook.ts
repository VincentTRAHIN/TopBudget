import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { API_BASE_URL } from '@/services/api.service';

export interface CoupleFixedCharge {
  _id: string;
  description: string;
  montant: number;
  categorie: { nom: string } | string;
  payePar: string;
}

export interface CoupleFixedChargesResponse {
  listeChargesFixes: CoupleFixedCharge[];
  totalChargesFixesCommunes: number;
}

interface ApiResponse {
  chargesUtilisateurPrincipal: Array<{
    _id: string;
    description: string;
    montant: number;
    categorie: { nom: string } | string;
  }>;
  chargesPartenaire: Array<{
    _id: string;
    description: string;
    montant: number;
    categorie: { nom: string } | string;
  }>;
  totalChargesCouple: number;
}

export const useCoupleFixedCharges = (annee: string, mois: string) => {
  const url = `${API_BASE_URL}/statistiques/couple/charges-fixes?annee=${annee}&mois=${mois}`;
  const { data: apiData, error, isLoading, mutate } = useSWR<ApiResponse>(
    url,
    fetcher,
  );
  
  const data: CoupleFixedChargesResponse | undefined = apiData ? {
    listeChargesFixes: [
      ...(apiData.chargesUtilisateurPrincipal || []).map((charge) => ({
        ...charge,
        payePar: 'Vous'
      })),
      ...(apiData.chargesPartenaire || []).map((charge) => ({
        ...charge,
        payePar: 'Partenaire'
      }))
    ],
    totalChargesFixesCommunes: apiData.totalChargesCouple || 0
  } : undefined;

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

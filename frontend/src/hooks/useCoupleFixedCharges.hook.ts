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

export const useCoupleFixedCharges = (annee: string, mois: string) => {
  const url = `${API_BASE_URL}/statistiques/couple/charges-fixes?annee=${annee}&mois=${mois}`;
  const { data, error, isLoading, mutate } = useSWR<CoupleFixedChargesResponse>(
    url,
    fetcher,
  );
  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

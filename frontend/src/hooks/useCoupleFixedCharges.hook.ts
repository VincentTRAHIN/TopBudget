import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';

export interface CoupleFixedCharge {
  _id: string;
  description: string;
  montant: number;
  categorie: { nom: string } | string;
  payePar: string;
}

export interface CoupleFixedChargesResponse {
  chargesFixes: CoupleFixedCharge[];
  totalChargesFixesCommunes: number;
}

export const useCoupleFixedCharges = (annee: string, mois: string) => {
  const url = `/api/statistiques/couple/charges-fixes?annee=${annee}&mois=${mois}`;
  const { data, error, isLoading, mutate } = useSWR<CoupleFixedChargesResponse>(url, fetcher);
  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

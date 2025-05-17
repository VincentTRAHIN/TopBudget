import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { API_BASE_URL } from '@/services/api.service';

export interface CoupleContributionsSummary {
  totalDepensesCommunes: number;
  contributionUtilisateurActuel: number;
  contributionPartenaire: number;
  ecartUtilisateurActuel: number;
}

export const useCoupleContributionsSummary = (annee: string, mois: string) => {
  const url = `${API_BASE_URL}/statistiques/couple/resume-contributions?annee=${annee}&mois=${mois}`;
  const { data, error, isLoading, mutate } = useSWR<CoupleContributionsSummary>(
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

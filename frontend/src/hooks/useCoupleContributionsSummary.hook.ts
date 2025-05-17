import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';

export interface CoupleContributionsSummary {
  totalDepensesCommunes: number;
  contributionUtilisateurActuel: number;
  contributionPartenaire: number;
  ecartUtilisateurActuel: number;
}

export const useCoupleContributionsSummary = (annee: string, mois: string) => {
  const url = `/api/statistiques/couple/resume-contributions?annee=${annee}&mois=${mois}`;
  const { data, error, isLoading, mutate } = useSWR<CoupleContributionsSummary>(url, fetcher);
  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

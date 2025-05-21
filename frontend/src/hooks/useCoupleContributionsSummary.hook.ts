import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { API_BASE_URL } from '@/services/api.service';
import { useAuth } from './useAuth.hook';

interface BackendContributionDetail {
  utilisateurId: string;
  nom: string;
  totalDepenses: number;
}

interface BackendCoupleContributionsResponse {
  contributionsUtilisateurs: BackendContributionDetail[];
  totalDepensesCouple: number;
}

interface CommonExpense {
  _id: string;
  utilisateur: string | { _id: string; nom?: string };
  montant: number;
  description?: string;
  date?: string;
  typeDepense: string;
  categorie?: string | { _id: string; nom: string };
}

interface CommonExpensesResponse {
  depenses: CommonExpense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CoupleContributionsSummary {
  totalDepensesCommunes: number;
  contributionUtilisateurActuel: number;
  contributionPartenaire: number;
  ecartUtilisateurActuel: number;
}

const getUserId = (user: string | { _id: string } | Record<string, unknown> | unknown): string => {
  if (!user) return '';
  
  if (typeof user === 'string') {
    return user;
  }
  
  if (typeof user === 'object' && user !== null && '_id' in user) {
    return (user as { _id: string })._id;
  }
  
  return '';
};

export const useCoupleContributionsSummary = (annee: string, mois: string) => {
  const { user } = useAuth();
  
  const anneeNum = parseInt(annee, 10);
  const moisNum = parseInt(mois, 10);
  
  const firstDayOfMonth = new Date(anneeNum, moisNum - 1, 1);
  const lastDayOfMonth = new Date(anneeNum, moisNum, 0);
  
  const dateDebut = firstDayOfMonth.toISOString().split('T')[0];
  const dateFin = lastDayOfMonth.toISOString().split('T')[0];
  
  const formattedMonth = moisNum.toString().padStart(2, '0');
  
  const summaryUrl = `${API_BASE_URL}/statistiques/couple/resume-contributions?annee=${annee}&mois=${formattedMonth}`;
  const { data: rawSummaryData, error: summaryError, isLoading: isSummaryLoading, mutate } = useSWR<BackendCoupleContributionsResponse>(
    summaryUrl,
    fetcher,
  );

  const commonExpensesUrl = `${API_BASE_URL}/depenses?dateDebut=${dateDebut}&dateFin=${dateFin}&typeDepense=Commune&contexte=couple_complet&limit=100`;
  const { data: commonExpensesData, error: commonExpensesError, isLoading: isCommonExpensesLoading } = useSWR<CommonExpensesResponse>(
    commonExpensesUrl,
    fetcher
  );

  const isLoading = isSummaryLoading || isCommonExpensesLoading;
  const error = summaryError || commonExpensesError;

  const data: CoupleContributionsSummary | undefined = (!isLoading && !error && rawSummaryData && commonExpensesData && user?._id) ? (() => {
    const currentUserContribution = rawSummaryData.contributionsUtilisateurs.find(
      (contrib) => contrib.utilisateurId === user._id
    );
    const partnerContribution = rawSummaryData.contributionsUtilisateurs.find(
      (contrib) => contrib.utilisateurId !== user._id
    );

    if (!currentUserContribution || !partnerContribution) {
      console.log('No contribution data found for one of the users');
      return undefined;
    }

    let contributionUtilisateurActuel = 0;
    let contributionPartenaire = 0;
    
    if (commonExpensesData && Array.isArray(commonExpensesData.depenses) && commonExpensesData.depenses.length > 0) {
      const communeExpenses = commonExpensesData.depenses;
      
      const userExpenses = communeExpenses.filter((expense) => {
        const expenseUserId = getUserId(expense.utilisateur);
        return expenseUserId === user._id;
      });
      
      contributionUtilisateurActuel = userExpenses.reduce((total, expense) => {
        return total + expense.montant;
      }, 0);
      
      const partnerId = partnerContribution.utilisateurId;
      
      const partnerExpenses = communeExpenses.filter((expense) => {
        const expenseUserId = getUserId(expense.utilisateur);
        return expenseUserId === partnerId;
      });
      
      contributionPartenaire = partnerExpenses.reduce((total, expense) => {
        return total + expense.montant;
      }, 0);
    }
    
    const totalDepensesCommunes = contributionUtilisateurActuel + contributionPartenaire;
    
    const partTheoriqueUtilisateur = totalDepensesCommunes / 2;
    
    const ecartUtilisateurActuel = contributionUtilisateurActuel - partTheoriqueUtilisateur;

    return {
      totalDepensesCommunes,
      contributionUtilisateurActuel,
      contributionPartenaire,
      ecartUtilisateurActuel,
    };
  })() : undefined;

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

import useSWR from "swr";

import { API_BASE_URL } from "../services/api.service";
import fetcher from "../utils/fetcher.utils";

/**
 * Interface pour une catégorie avec sa tendance
 */
export interface CategoryTrend {
  categorieId: string;
  nom: string;
  totalActuel: number;
  totalPrecedent: number;
  variation: number;
  variationPourcent: number;
  tendance: "hausse" | "baisse" | "stable";
}

/**
 * Interface pour l'évolution mensuelle d'une catégorie
 */
export interface MonthlyEvolution {
  mois: number;
  annee: number;
  categories: Array<{
    categorieId: string;
    nom: string;
    total: number;
  }>;
}

/**
 * Interface pour les données de tendances de dépenses
 */
export interface ExpensesTrendsData {
  topCategories: CategoryTrend[];
  evolutionMensuelle: MonthlyEvolution[];
}

/**
 * Hook pour récupérer les tendances de dépenses par catégorie
 *
 * @param contexte - Contexte des statistiques ('moi' ou 'couple')
 * @param nbMois - Nombre de mois à analyser (défaut: 6)
 * @returns Données de tendances, état de chargement et erreurs
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useExpensesTrends('moi', 6);
 *
 * if (isLoading) return <div>Chargement...</div>;
 * if (error) return <div>Erreur</div>;
 *
 * return (
 *   <div>
 *     {data?.topCategories.map(cat => (
 *       <div key={cat.categorieId}>
 *         {cat.nom}: {cat.totalActuel}€ ({cat.tendance})
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useExpensesTrends = (contexte: "moi" | "couple" = "moi", nbMois: number = 6) => {
  // Construire l'URL avec les paramètres
  const params = new URLSearchParams();
  params.append("nbMois", nbMois.toString());
  if (contexte && contexte !== "moi") {
    params.append("contexte", contexte);
  }

  const url = `${API_BASE_URL}/statistiques/expenses-trends?${params.toString()}`;

  // Utiliser SWR pour récupérer les données
  const { data, error, isLoading, mutate } = useSWR<ExpensesTrendsData>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    data,
    topCategories: data?.topCategories || [],
    evolutionMensuelle: data?.evolutionMensuelle || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
};

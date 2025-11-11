import { FinancialStats, computeFinancialStats } from "@/utils/stats.utils";
import { useMemo } from "react";

import { useCurrentMonthFlows } from "./useCurrentMonthTotal.hook";
import { useMonthlyFlowsEvolution } from "./useMonthlyFlowsEvolution.hook";

export interface UseFinancialStatsReturn {
  depensesStats: FinancialStats;
  revenusStats: FinancialStats;
  soldeStats: FinancialStats;
  currentMonth: {
    depenses: number;
    revenus: number;
    solde: number;
  };
  isLoading: boolean;
}

/**
 * Hook personnalisé pour calculer les statistiques financières
 *
 * Récupère les données des 12 derniers mois et calcule :
 * - Moyenne mensuelle
 * - Minimum et maximum
 * - Tendance (hausse/baisse/stable)
 *
 * @param statsContext - Contexte ('moi' ou 'couple')
 * @returns Statistiques calculées pour dépenses, revenus et solde
 */
export function useFinancialStats(statsContext: "moi" | "couple" = "moi"): UseFinancialStatsReturn {
  // Récupération des données historiques (12 derniers mois)
  const { data: depensesData, isLoading: depensesLoading } = useMonthlyFlowsEvolution(12, statsContext, "depenses");

  const { data: revenusData, isLoading: revenusLoading } = useMonthlyFlowsEvolution(12, statsContext, "revenus");

  const { data: soldeData, isLoading: soldeLoading } = useMonthlyFlowsEvolution(12, statsContext, "solde");

  // Récupération des données du mois en cours
  const { totalDepenses, totalRevenus, solde, isLoading: currentMonthLoading } = useCurrentMonthFlows(statsContext);

  // Transformation des données en format utilisable
  const depensesArr = useMemo(
    () =>
      Array.isArray(depensesData)
        ? depensesData.map((item) => ({
            value: item.totalDepenses ?? 0,
            mois: item.mois,
          }))
        : [],
    [depensesData],
  );

  const revenusArr = useMemo(
    () =>
      Array.isArray(revenusData)
        ? revenusData.map((item) => ({
            value: item.totalRevenus ?? 0,
            mois: item.mois,
          }))
        : [],
    [revenusData],
  );

  const soldeArr = useMemo(
    () =>
      Array.isArray(soldeData)
        ? soldeData.map((item) => ({
            value: item.soldeMensuel ?? 0,
            mois: item.mois,
          }))
        : [],
    [soldeData],
  );

  // Calcul des statistiques
  const depensesStats = useMemo(() => computeFinancialStats(depensesArr, totalDepenses), [depensesArr, totalDepenses]);

  const revenusStats = useMemo(() => computeFinancialStats(revenusArr, totalRevenus), [revenusArr, totalRevenus]);

  const soldeStats = useMemo(() => computeFinancialStats(soldeArr, solde), [soldeArr, solde]);

  const isLoading = depensesLoading || revenusLoading || soldeLoading || currentMonthLoading;

  return {
    depensesStats,
    revenusStats,
    soldeStats,
    currentMonth: {
      depenses: totalDepenses,
      revenus: totalRevenus,
      solde,
    },
    isLoading,
  };
}

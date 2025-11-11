/**
 * Utilitaires pour les calculs statistiques financiers
 */

export interface MonthlyDataPoint {
  value?: number;
  mois: string;
}

export interface FinancialStats {
  average: number;
  minimum: { value: number; month: string };
  maximum: { value: number; month: string };
  trend: "up" | "down" | "stable";
  hasEnoughData: boolean;
}

/**
 * Formate une date au format YYYY-MM en texte lisible
 *
 * @param dateStr - Date au format YYYY-MM
 * @returns Date formatée en français (ex: "janvier 2025")
 */
export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return "Date inconnue";

  if (!/^\d{4}-\d{2}$/.test(dateStr)) {
    return "Date incorrecte";
  }

  try {
    const date = new Date(`${dateStr}-01`);
    if (isNaN(date.getTime())) return "Date incorrecte";

    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    console.error("Erreur lors du formatage de la date:", e);
    return "Date incorrecte";
  }
}

/**
 * Calcule le pourcentage de variation entre deux valeurs
 *
 * @param current - Valeur actuelle
 * @param average - Valeur moyenne de référence
 * @returns Pourcentage formaté (ex: "15.5%")
 */
export function calculatePercentage(current: number, average: number): string {
  if (average === 0) {
    return "N/A (moyenne à 0)";
  }
  return ((Math.abs(current - average) / Math.abs(average)) * 100).toFixed(1) + "%";
}

/**
 * Calcule les statistiques financières (moyenne, min, max, tendance)
 * à partir d'un ensemble de données mensuelles
 *
 * @param data - Tableau de données mensuelles
 * @param currentValue - Valeur du mois en cours
 * @returns Statistiques calculées
 */
export function computeFinancialStats(data: MonthlyDataPoint[], currentValue: number): FinancialStats {
  // Filtrer les données valides (non nulles et non zéro)
  const filtered = data.filter((item) => typeof item.value === "number" && item.value !== 0);

  // Ajouter le mois en cours si valeur non nulle
  const hasCurrentValue = currentValue !== 0;
  const currentMonthEntry = hasCurrentValue ? { value: currentValue, mois: "Mois en cours" } : null;

  const dataForAnalysis = filtered.slice();
  if (currentMonthEntry) {
    dataForAnalysis.push(currentMonthEntry);
  }

  const hasEnoughData = dataForAnalysis.length >= 2;

  // Cas : aucune donnée
  if (dataForAnalysis.length === 0) {
    return {
      average: 0,
      minimum: { value: 0, month: "Aucune donnée" },
      maximum: { value: 0, month: "Aucune donnée" },
      trend: "stable",
      hasEnoughData: false,
    };
  }

  // Calcul de la moyenne
  const average = dataForAnalysis.reduce((sum, item) => sum + (item.value ?? 0), 0) / dataForAnalysis.length;

  // Calcul du minimum et maximum
  let min = dataForAnalysis[0];
  let max = dataForAnalysis[0];

  dataForAnalysis.forEach((item) => {
    if ((item.value ?? 0) < (min.value ?? 0)) min = item;
    if ((item.value ?? 0) > (max.value ?? 0)) max = item;
  });

  // Calcul de la tendance (sur les 3 derniers mois)
  let trend: "up" | "down" | "stable" = "stable";

  if (hasEnoughData) {
    const sortedData = [...dataForAnalysis].sort((a, b) => {
      if (a.mois === "Mois en cours") return 1;
      if (b.mois === "Mois en cours") return -1;
      return a.mois.localeCompare(b.mois);
    });

    const lastThree = sortedData.slice(-3);

    if (lastThree.length >= 2) {
      const firstValue = lastThree[0].value ?? 0;
      const lastValue = lastThree[lastThree.length - 1].value ?? 0;

      if (firstValue === 0) {
        trend = lastValue > 0 ? "up" : "stable";
      } else {
        const changeRatio = lastValue / firstValue;
        if (changeRatio > 1.1) trend = "up";
        else if (changeRatio < 0.9) trend = "down";
      }
    }
  }

  return {
    average,
    minimum: {
      value: min.value ?? 0,
      month: min.mois,
    },
    maximum: {
      value: max.value ?? 0,
      month: max.mois,
    },
    trend,
    hasEnoughData,
  };
}

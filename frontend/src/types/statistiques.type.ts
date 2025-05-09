export interface MonthlyEvolutionDataPoint {
  mois: string; // Format YYYY-MM
  totalDepenses: number;
}

// Le type de réponse pour un hook utilisant cet endpoint serait MonthlyEvolutionDataPoint[]

export interface MonthlyComparisonData {
  totalMoisActuel: number; // Total expenses for the current month
  totalMoisPrecedent: number; // Total expenses for the previous month
  difference: number; // Difference between the two months
  pourcentageVariation: number; // Percentage variation between the two months
}

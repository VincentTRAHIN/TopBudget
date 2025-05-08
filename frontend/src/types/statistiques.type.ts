export interface MonthlyEvolutionDataPoint {
  mois: string; // Format YYYY-MM
  totalDepenses: number;
}

// Le type de réponse pour un hook utilisant cet endpoint serait MonthlyEvolutionDataPoint[]

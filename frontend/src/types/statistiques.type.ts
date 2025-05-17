export interface MonthlyEvolutionDataPoint {
  mois: string;
  totalDepenses: number;
  // Champs pour le mode couple (optionnels)
  depensesPersoUserA?: number;
  depensesPersoUserB?: number;
  depensesCommunes?: number;
}

export interface MonthlyComparisonData {
  totalMoisActuel: number;
  totalMoisPrecedent: number;
  difference: number;
  pourcentageVariation: number;
}

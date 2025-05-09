export interface MonthlyEvolutionDataPoint {
  mois: string; 
  totalDepenses: number;
}


export interface MonthlyComparisonData {
  totalMoisActuel: number; 
  totalMoisPrecedent: number; 
  difference: number; 
  pourcentageVariation: number;
}

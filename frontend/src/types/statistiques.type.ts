export interface MonthlyEvolutionDataPoint {
  mois: string;
  totalDepenses?: number;
  totalRevenus?: number;
  soldeMensuel?: number;
  depensesPersoUserA?: number;
  depensesPersoUserB?: number;
  depensesCommunes?: number;
  revenusPersoUserA?: number;
  revenusPersoUserB?: number;
  revenusCommuns?: number;
  soldePersoUserA?: number;
  soldePersoUserB?: number;
  soldeCommuns?: number;
}

export interface MonthlyComparisonData {
  totalMoisActuel: number;
  totalMoisPrecedent: number;
  difference: number;
  pourcentageVariation: number;
}

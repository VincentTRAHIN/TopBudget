'use client';

import { useMonthlyComparison } from '../../hooks/useMonthlyComparison.hook';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
} from 'chart.js';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

/**
 * Formate un montant en devise (EUR)
 */
const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}€`;
};

/**
 * Icône SVG TrendingUp (flèche montante)
 */
const TrendingUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/**
 * Icône SVG TrendingDown (flèche descendante)
 */
const TrendingDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

/**
 * Composant MonthlyExpenseSummary
 * 
 * Affiche un résumé financier du mois en cours avec :
 * - Revenus du mois
 * - Dépenses du mois
 * - Solde (revenus - dépenses)
 * - Variation par rapport au mois précédent
 * - Mini sparkline Chart.js pour visualiser la tendance
 * 
 * @example
 * ```tsx
 * <MonthlyExpenseSummary />
 * ```
 */
export default function MonthlyExpenseSummary() {
  // Récupération des données financières
  const {
    data: depensesData,
    isLoading: depensesLoading,
    isError: depensesError,
  } = useMonthlyComparison('moi', 'depenses');

  const {
    data: revenusData,
    isLoading: revenusLoading,
    isError: revenusError,
  } = useMonthlyComparison('moi', 'revenus');

  const {
    data: soldeData,
    isLoading: soldeLoading,
    isError: soldeError,
  } = useMonthlyComparison('moi', 'solde');

  const isLoading = depensesLoading || revenusLoading || soldeLoading;
  const isError = depensesError || revenusError || soldeError;

  // État loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="h-24 bg-gray-100 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  // État error
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">
            Erreur lors du chargement des données
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Veuillez réessayer plus tard
          </p>
        </div>
      </div>
    );
  }

  // Extraction des données
  const depensesMois = depensesData?.totalMoisActuel || 0;
  const revenusMois = revenusData?.totalMoisActuel || 0;
  const soldeMois = soldeData?.totalMoisActuel || 0;

  const depensesPrecedent = depensesData?.totalMoisPrecedent || 0;
  const revenusPrecedent = revenusData?.totalMoisPrecedent || 0;
  const soldePrecedent = soldeData?.totalMoisPrecedent || 0;

  // Calcul des variations
  const variationDepenses = depensesData?.difference || 0;
  const variationRevenus = revenusData?.difference || 0;
  const variationSolde = soldeData?.difference || 0;

  // Données pour le mini sparkline
  const sparklineData = {
    labels: ['Mois précédent', 'Mois actuel'],
    datasets: [
      {
        label: 'Solde',
        data: [soldePrecedent, soldeMois],
        borderColor: soldeMois >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: soldeMois >= 0 
          ? 'rgba(34, 197, 94, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const sparklineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(2)}€`,
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Résumé du mois
        </h3>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>

      {/* KPIs */}
      <div className="space-y-4 mb-6">
        {/* Revenus */}
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Revenus</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(revenusMois)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-medium ${
              variationRevenus >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {variationRevenus >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <span>{variationRevenus >= 0 ? '+' : ''}{formatCurrency(variationRevenus)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs mois précédent</p>
          </div>
        </div>

        {/* Dépenses */}
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Dépenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(depensesMois)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-medium ${
              variationDepenses <= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {variationDepenses >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <span>{variationDepenses >= 0 ? '+' : ''}{formatCurrency(variationDepenses)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs mois précédent</p>
          </div>
        </div>

        {/* Solde */}
        <div className={`flex items-center justify-between p-4 border-2 rounded-lg ${
          soldeMois >= 0 
            ? 'bg-indigo-50 border-indigo-300' 
            : 'bg-orange-50 border-orange-300'
        }`}>
          <div>
            <p className="text-sm font-medium text-gray-600">Solde</p>
            <p className={`text-2xl font-bold ${
              soldeMois >= 0 ? 'text-indigo-600' : 'text-orange-600'
            }`}>
              {formatCurrency(soldeMois)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-medium ${
              variationSolde >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {variationSolde >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <span>{variationSolde >= 0 ? '+' : ''}{formatCurrency(variationSolde)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs mois précédent</p>
          </div>
        </div>
      </div>

      {/* Mini Sparkline */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-600 mb-3">
          Évolution du solde
        </p>
        <div className="h-20">
          <Line data={sparklineData} options={sparklineOptions} />
        </div>
      </div>
    </div>
  );
}

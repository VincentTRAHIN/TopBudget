'use client';

import { useMonthlyComparison } from '@/hooks/useMonthlyComparison.hook';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * MonthlyComparisonChart - Graphique de comparaison mensuelle revenus vs dépenses
 *
 * Affiche un graphique en barres comparant les revenus et dépenses
 * du mois actuel avec le mois précédent.
 *
 * @param contexte - Contexte des statistiques ('moi' ou 'couple')
 */
interface MonthlyComparisonChartProps {
  contexte?: 'moi' | 'couple';
}

export default function MonthlyComparisonChart({
  contexte = 'moi',
}: MonthlyComparisonChartProps) {
  // Récupérer les données pour revenus, dépenses et solde
  const depensesData = useMonthlyComparison(contexte, 'depenses');
  const revenusData = useMonthlyComparison(contexte, 'revenus');
  const soldeData = useMonthlyComparison(contexte, 'solde');

  const isLoading =
    depensesData.isLoading || revenusData.isLoading || soldeData.isLoading;
  const isError =
    depensesData.isError || revenusData.isError || soldeData.isError;

  // Noms des mois en français
  const currentDate = new Date();
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const previousMonth = monthNames[previousDate.getMonth()];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Erreur de chargement</p>
          <p className="text-sm mt-1">
            Impossible de récupérer les données de comparaison
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données du graphique
  const chartData = {
    labels: [previousMonth, currentMonth],
    datasets: [
      {
        label: 'Revenus',
        data: [
          revenusData.data?.totalMoisPrecedent || 0,
          revenusData.data?.totalMoisActuel || 0,
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.7)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
      {
        label: 'Dépenses',
        data: [
          depensesData.data?.totalMoisPrecedent || 0,
          depensesData.data?.totalMoisActuel || 0,
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // red-500
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)} €`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} €`,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Calculer les variations
  const depensesVariation = depensesData.data?.difference || 0;
  const revenusVariation = revenusData.data?.difference || 0;
  const soldeVariation = soldeData.data?.difference || 0;

  const depensesVariationPercent =
    depensesData.data?.pourcentageVariation || 0;
  const revenusVariationPercent = revenusData.data?.pourcentageVariation || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Comparaison Mensuelle
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Revenus vs Dépenses : {previousMonth} / {currentMonth}
        </p>
      </div>

      {/* Graphique */}
      <div className="h-64 mb-6">
        <Bar data={chartData} options={options} />
      </div>

      {/* Résumé des variations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenus */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {(revenusData.data?.totalMoisActuel || 0).toFixed(2)} €
              </p>
            </div>
            <MoneyIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-3 flex items-center text-sm">
            {revenusVariation >= 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span
              className={
                revenusVariation >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {Math.abs(revenusVariationPercent).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">
              ({revenusVariation >= 0 ? '+' : ''}
              {revenusVariation.toFixed(2)} €)
            </span>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dépenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {(depensesData.data?.totalMoisActuel || 0).toFixed(2)} €
              </p>
            </div>
            <ShoppingIcon className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-3 flex items-center text-sm">
            {depensesVariation >= 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-red-600 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-green-600 mr-1" />
            )}
            <span
              className={
                depensesVariation >= 0 ? 'text-red-600' : 'text-green-600'
              }
            >
              {Math.abs(depensesVariationPercent).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">
              ({depensesVariation >= 0 ? '+' : ''}
              {depensesVariation.toFixed(2)} €)
            </span>
          </div>
        </div>

        {/* Solde */}
        <div
          className={`${
            (soldeData.data?.totalMoisActuel || 0) >= 0
              ? 'bg-indigo-50'
              : 'bg-orange-50'
          } rounded-lg p-4`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solde</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  (soldeData.data?.totalMoisActuel || 0) >= 0
                    ? 'text-indigo-600'
                    : 'text-orange-600'
                }`}
              >
                {(soldeData.data?.totalMoisActuel || 0).toFixed(2)} €
              </p>
            </div>
            <WalletIcon
              className={`w-8 h-8 ${
                (soldeData.data?.totalMoisActuel || 0) >= 0
                  ? 'text-indigo-500'
                  : 'text-orange-500'
              }`}
            />
          </div>
          <div className="mt-3 flex items-center text-sm">
            {soldeVariation >= 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span
              className={
                soldeVariation >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {soldeVariation >= 0 ? '+' : ''}
              {soldeVariation.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icônes SVG inline
function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ShoppingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );
}

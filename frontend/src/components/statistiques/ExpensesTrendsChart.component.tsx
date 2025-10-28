'use client';

import { useExpensesTrends } from '@/hooks/useExpensesTrends.hook';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * ExpensesTrendsChart - Graphique des tendances de dépenses par catégorie
 *
 * Affiche un graphique linéaire montrant l'évolution des dépenses
 * pour les principales catégories sur plusieurs mois.
 *
 * @param contexte - Contexte des statistiques ('moi' ou 'couple')
 * @param nbMois - Nombre de mois à afficher (défaut: 6)
 */
interface ExpensesTrendsChartProps {
  contexte?: 'moi' | 'couple';
  nbMois?: number;
}

export default function ExpensesTrendsChart({
  contexte = 'moi',
  nbMois = 6,
}: ExpensesTrendsChartProps) {
  const { evolutionMensuelle, topCategories, isLoading, isError } =
    useExpensesTrends(contexte, nbMois);

  // Palette de couleurs pour les catégories
  const colorPalette = [
    'rgb(239, 68, 68)', // red-500
    'rgb(59, 130, 246)', // blue-500
    'rgb(34, 197, 94)', // green-500
    'rgb(234, 179, 8)', // yellow-500
    'rgb(168, 85, 247)', // purple-500
    'rgb(236, 72, 153)', // pink-500
    'rgb(20, 184, 166)', // teal-500
    'rgb(249, 115, 22)', // orange-500
  ];

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
            Impossible de récupérer les tendances de dépenses
          </p>
        </div>
      </div>
    );
  }

  if (!evolutionMensuelle || evolutionMensuelle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tendances de Dépenses
        </h3>
        <div className="text-center py-8 text-gray-500">
          <p>Aucune donnée disponible pour la période sélectionnée</p>
        </div>
      </div>
    );
  }

  // Extraire les top 5 catégories pour le graphique
  const top5Categories = topCategories.slice(0, 5);

  // Préparer les labels (mois)
  const labels = evolutionMensuelle.map((mois) => {
    const monthNames = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];
    return `${monthNames[mois.mois - 1]} ${mois.annee}`;
  });

  // Préparer les datasets (une ligne par catégorie)
  const datasets = top5Categories.map((category, index) => {
    const data = evolutionMensuelle.map((mois) => {
      const catData = mois.categories.find(
        (c) => c.categorieId === category.categorieId
      );
      return catData ? catData.total : 0;
    });

    const color = colorPalette[index % colorPalette.length];

    return {
      label: category.nom,
      data,
      borderColor: color,
      backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const options: ChartOptions<'line'> = {
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
        mode: 'index' as const,
        intersect: false,
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
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Tendances de Dépenses
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Évolution des top 5 catégories sur {nbMois} mois
        </p>
      </div>

      {/* Graphique */}
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>

      {/* Indicateurs de tendance */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {top5Categories.map((category, index) => {
          const color = colorPalette[index % colorPalette.length];
          const TrendIcon =
            category.tendance === 'hausse'
              ? TrendingUpIcon
              : category.tendance === 'baisse'
                ? TrendingDownIcon
                : MinusIcon;

          const tendanceColor =
            category.tendance === 'hausse'
              ? 'text-red-600'
              : category.tendance === 'baisse'
                ? 'text-green-600'
                : 'text-gray-600';

          return (
            <div
              key={category.categorieId}
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {category.nom}
                </p>
                <p className="text-xs text-gray-500">
                  {category.totalActuel.toFixed(2)} €
                </p>
              </div>
              <div className={`flex items-center ${tendanceColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-xs font-medium ml-1">
                  {Math.abs(category.variationPourcent).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icônes SVG inline
function TrendingUpIcon({ className }: { className?: string }) {
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
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function TrendingDownIcon({ className }: { className?: string }) {
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
        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
      />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
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
        d="M20 12H4"
      />
    </svg>
  );
}

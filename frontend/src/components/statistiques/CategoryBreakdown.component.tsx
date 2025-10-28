'use client';

import { useExpensesTrends } from '@/hooks/useExpensesTrends.hook';

/**
 * CategoryBreakdown - Répartition des dépenses par catégorie (Top 5)
 *
 * Affiche les 5 principales catégories de dépenses du mois actuel
 * avec leurs montants et pourcentages.
 *
 * @param contexte - Contexte des statistiques ('moi' ou 'couple')
 */
interface CategoryBreakdownProps {
  contexte?: 'moi' | 'couple';
}

export default function CategoryBreakdown({
  contexte = 'moi',
}: CategoryBreakdownProps) {
  const { topCategories, isLoading, isError } = useExpensesTrends(contexte, 3);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
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
            Impossible de récupérer la répartition par catégorie
          </p>
        </div>
      </div>
    );
  }

  if (!topCategories || topCategories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Catégories
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FolderIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Aucune dépense enregistrée ce mois-ci</p>
        </div>
      </div>
    );
  }

  // Prendre seulement les 5 premières
  const top5 = topCategories.slice(0, 5);

  // Calculer le total pour les pourcentages
  const totalDepenses = top5.reduce((sum, cat) => sum + cat.totalActuel, 0);

  // Palette de couleurs
  const colorPalette = [
    {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-500',
      icon: 'bg-red-500',
    },
    {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-500',
      icon: 'bg-blue-500',
    },
    {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-500',
      icon: 'bg-green-500',
    },
    {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-500',
      icon: 'bg-yellow-500',
    },
    {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-500',
      icon: 'bg-purple-500',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Catégories</h3>
        <p className="text-sm text-gray-600 mt-1">
          Les 5 principales catégories de dépenses ce mois
        </p>
      </div>

      {/* Liste des catégories */}
      <div className="space-y-4">
        {top5.map((category, index) => {
          const percentage =
            totalDepenses > 0 ? (category.totalActuel / totalDepenses) * 100 : 0;
          const colors = colorPalette[index];

          return (
            <div
              key={category.categorieId}
              className="flex items-center space-x-4"
            >
              {/* Badge numéro */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center text-white font-bold text-lg shadow-md`}
              >
                {index + 1}
              </div>

              {/* Informations catégorie */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {category.nom}
                  </h4>
                  <span className={`text-sm font-bold ${colors.text} ml-2`}>
                    {category.totalActuel.toFixed(2)} €
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.icon} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% du total
                  </p>
                </div>
              </div>

              {/* Indicateur de tendance */}
              <div className="flex-shrink-0">
                {category.tendance === 'hausse' && (
                  <div className="flex items-center text-red-600">
                    <TrendingUpIcon className="w-5 h-5" />
                    <span className="text-xs font-medium ml-1">
                      +{Math.abs(category.variationPourcent).toFixed(0)}%
                    </span>
                  </div>
                )}
                {category.tendance === 'baisse' && (
                  <div className="flex items-center text-green-600">
                    <TrendingDownIcon className="w-5 h-5" />
                    <span className="text-xs font-medium ml-1">
                      -{Math.abs(category.variationPourcent).toFixed(0)}%
                    </span>
                  </div>
                )}
                {category.tendance === 'stable' && (
                  <div className="flex items-center text-gray-500">
                    <MinusIcon className="w-5 h-5" />
                    <span className="text-xs font-medium ml-1">Stable</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé total */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SumIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">
              Total (Top 5)
            </span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {totalDepenses.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Message informatif */}
      {topCategories.length > 5 && (
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-xs text-blue-700">
            <InfoIcon className="w-4 h-4 inline mr-1" />
            {topCategories.length - 5} autre(s) catégorie(s) non affichée(s)
          </p>
        </div>
      )}
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

function FolderIcon({ className }: { className?: string }) {
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
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function SumIcon({ className }: { className?: string }) {
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
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

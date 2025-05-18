'use client';

import React from 'react';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison.hook';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MonthlyComparisonSummary: React.FC<{
  statsContext?: 'moi' | 'couple';
}> = ({ statsContext = 'moi' }) => {
  const { data, isLoading, isError } = useMonthlyComparison(statsContext);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Comparaison Mensuelle</h3>
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-red-500">
        Erreur lors du chargement des données.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        Aucune donnée disponible.
      </div>
    );
  }

  const {
    totalMoisActuel = 0,
    totalMoisPrecedent = 0,
    difference = 0,
    pourcentageVariation = 0,
  } = data;

  const TrendIcon =
    difference === 0 ? Minus : difference > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    difference === 0
      ? 'text-gray-600'
      : difference > 0
        ? 'text-red-600'
        : 'text-green-600';
  const trendBg =
    difference === 0
      ? 'bg-gray-50'
      : difference > 0
        ? 'bg-red-50'
        : 'bg-green-50';
  const trendText =
    difference === 0
      ? 'Dépenses stables'
      : difference > 0
        ? 'Augmentation des dépenses'
        : 'Réduction des dépenses';

  const currentMonth = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
  });
  const prevMonth = new Date(
    new Date().setMonth(new Date().getMonth() - 1),
  ).toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Comparaison Mensuelle</h3>

      <div className="grid grid-cols-1 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-600 mr-2" size={20} />
            <h4 className="text-md font-medium text-blue-700">
              Dépenses Mensuelles
            </h4>
          </div>
          <p className="text-gray-700">
            {currentMonth}:{' '}
            <span className="font-bold">
              {(totalMoisActuel || 0).toFixed(2)}€
            </span>
          </p>
          <p className="text-gray-700">
            {prevMonth}:{' '}
            <span className="font-bold">
              {(totalMoisPrecedent || 0).toFixed(2)}€
            </span>
          </p>
        </div>

        <div className={`border rounded-lg p-4 ${trendBg}`}>
          <div className="flex items-center mb-2">
            <TrendIcon className={`${trendColor} mr-2`} size={20} />
            <h4 className="text-md font-medium text-green-700">Évolution</h4>
          </div>
          <div className="flex items-center">
            <span className={`${trendColor} font-semibold`}>
              {(difference || 0).toFixed(2)}€ (
              {(pourcentageVariation || 0).toFixed(1)}%)
            </span>
          </div>
          <p className={`text-sm mt-1 ${trendColor}`}>{trendText}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonSummary;

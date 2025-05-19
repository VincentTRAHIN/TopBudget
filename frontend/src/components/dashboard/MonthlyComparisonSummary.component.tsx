'use client';

import React from 'react';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison.hook';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from 'lucide-react';

const MonthlyComparisonSummary: React.FC<{
  statsContext?: 'moi' | 'couple';
  type?: 'depenses' | 'revenus' | 'solde';
}> = ({ statsContext = 'moi', type = 'depenses' }) => {
  console.log('[MonthlyComparisonSummary] Props reçues:', { statsContext, type }); // AJOUT/VÉRIFICATION
  const { data, isLoading, isError } = useMonthlyComparison(statsContext, type);
  console.log('[MonthlyComparisonSummary] Données reçues du hook:', { data, isLoading, isError }); // AJOUT

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

  // Pour les dépenses: une différence < 0 (baisse) est une tendance positive pour les finances.
  // Pour les revenus: une différence > 0 (hausse) est une tendance positive pour les finances.
  // Pour le solde: une différence > 0 (hausse) est une tendance positive pour les finances.
  const isFinancialImprovement =
    type === 'depenses'
      ? difference < 0
      : type === 'revenus' // Explicitement pour revenus
        ? difference > 0
        : type === 'solde' // Explicitement pour solde
          ? difference > 0
          : false; // Cas par défaut ou si type est inattendu
  const isNeutralTrend = difference === 0;

  const TrendIcon = isNeutralTrend
    ? Minus
    : difference > 0 // La valeur a augmenté
      ? TrendingUp
      : TrendingDown; // La valeur a diminué

  const trendColor = isNeutralTrend
    ? 'text-gray-600'
    : isFinancialImprovement 
      ? 'text-green-600' // Amélioration financière = vert
      : 'text-red-600';   // Détérioration financière = rouge

  const trendBg = isNeutralTrend
    ? 'bg-gray-50'
    : isFinancialImprovement
      ? 'bg-green-50'
      : 'bg-red-50';

  let trendText = '';
  if (isNeutralTrend) {
    trendText =
      type === 'depenses'
        ? 'Dépenses stables'
        : type === 'revenus'
          ? 'Revenus stables'
          : 'Solde stable';
  } else if (type === 'depenses') {
    trendText = isFinancialImprovement 
      ? 'Réduction des dépenses' // Vert
      : 'Augmentation des dépenses'; // Rouge
  } else if (type === 'revenus') {
    trendText = isFinancialImprovement
      ? 'Augmentation des revenus' // Vert
      : 'Réduction des revenus'; // Rouge
  } else { // pour le type 'solde'
    trendText = isFinancialImprovement 
      ? 'Amélioration du solde' // Vert
      : 'Détérioration du solde'; // Rouge
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
  });
  const prevMonth = new Date(
    new Date().setMonth(new Date().getMonth() - 1),
  ).toLocaleDateString('fr-FR', { month: 'long' });

  const categoryTitle =
    type === 'depenses'
      ? 'Dépenses Mensuelles'
      : type === 'revenus'
        ? 'Revenus Mensuels'
        : 'Solde Mensuel';

  const categoryBg =
    type === 'depenses'
      ? 'bg-blue-50'
      : type === 'revenus'
        ? 'bg-green-50'
        : 'bg-purple-50';

  const categoryTextColor =
    type === 'depenses'
      ? 'text-blue-700'
      : type === 'revenus'
        ? 'text-green-700'
        : 'text-purple-700';

  const CategoryIcon = type === 'solde' ? DollarSign : Calendar;
  const categoryIconColor =
    type === 'depenses'
      ? 'text-blue-600'
      : type === 'revenus'
        ? 'text-green-600'
        : 'text-purple-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Comparaison Mensuelle</h3>

      <div className="grid grid-cols-1 gap-4">
        <div className={`border rounded-lg p-4 ${categoryBg}`}>
          <div className="flex items-center mb-2">
            <CategoryIcon className={`${categoryIconColor} mr-2`} size={20} />
            <h4 className={`text-md font-medium ${categoryTextColor}`}>
              {categoryTitle}
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
            <h4 className="text-md font-medium text-gray-700">Évolution</h4>
          </div>
          <div className="flex items-center">
            <span className={`${trendColor} font-semibold`}>
              {Math.abs(difference || 0).toFixed(2)}€ (
              {Math.abs(pourcentageVariation || 0).toFixed(1)}%)
            </span>
          </div>
          <p className={`text-sm mt-1 ${trendColor}`}>{trendText}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonSummary;

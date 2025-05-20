'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMonthlyComparison } from '../../hooks/useMonthlyComparison.hook';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

const Tooltip = ({
  children,
  content,
  isOpen,
  onToggle,
  onClickOutside
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClickOutside: () => void;
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClickOutside]);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-expanded={isOpen}
        aria-label="Plus d'informations"
      >
        {children}
      </button>
      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg md:left-auto md:right-0 md:-translate-x-0"
        >
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 bg-gray-800 rotate-45 md:left-auto md:right-3"></div> {/* Flèche */}
        </div>
      )}
    </div>
  );
};

const MonthlyComparisonSummary: React.FC<{
  statsContext?: 'moi' | 'couple';
  type?: 'depenses' | 'revenus' | 'solde';
}> = ({ statsContext = 'moi', type = 'depenses' }) => {
  const { data, isLoading, isError } = useMonthlyComparison(statsContext, type);
  

  const [comparisonTooltipOpen, setComparisonTooltipOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Comparaison Mensuelle</h3>
        </div>
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

  const isFinancialImprovement =
    type === 'depenses'
      ? difference < 0
      : type === 'revenus'
        ? difference > 0
        : type === 'solde'
          ? difference > 0
          : false;
  const isNeutralTrend = difference === 0;

  const TrendIcon = isNeutralTrend
    ? Minus
    : difference > 0
      ? TrendingUp
      : TrendingDown;

  const trendColor = isNeutralTrend
    ? 'text-gray-600'
    : isFinancialImprovement 
      ? 'text-green-600'
      : 'text-red-600';

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
      ? 'Réduction des dépenses'
      : 'Augmentation des dépenses';
  } else if (type === 'revenus') {
    trendText = isFinancialImprovement
      ? 'Augmentation des revenus'
      : 'Réduction des revenus';
  } else {
    trendText = isFinancialImprovement
      ? 'Amélioration du solde'
      : 'Détérioration du solde';
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Comparaison Mensuelle</h3>
        <Tooltip
          isOpen={comparisonTooltipOpen}
          onToggle={() => setComparisonTooltipOpen(prev => !prev)}
          onClickOutside={() => setComparisonTooltipOpen(false)}
          content={
            <div>
              <p className="font-medium mb-1">Info Comparaison Mensuelle</p>
              <p>Ce bloc compare les {type === 'depenses' ? 'dépenses' : type === 'revenus' ? 'revenus' : 'soldes'} du mois de {currentMonth} avec ceux de {prevMonth}. Il indique la différence absolue et en pourcentage.</p>
            </div>
          }
        >
          <HelpCircle size={16} aria-label="Aide sur la comparaison mensuelle" />
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={`border rounded-lg p-4 ${categoryBg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CategoryIcon className={`${categoryIconColor} mr-2`} size={20} />
              <h4 className={`text-md font-medium ${categoryTextColor}`}>
                {categoryTitle}
              </h4>
            </div>
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
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center">
                <TrendIcon className={`${trendColor} mr-2`} size={20} />
                <h4 className="text-md font-medium text-gray-700">Évolution</h4>
             </div>
          </div>
          <div className="flex items-center">
            <span className={`${trendColor} font-semibold`}>
              {difference >= 0 ? '+' : ''}{difference.toFixed(2)}€ (
              {pourcentageVariation >= 0 ? '+' : ''}{Math.abs(pourcentageVariation).toFixed(1)}%)
            </span>
          </div>
          <p className={`text-sm mt-1 ${trendColor}`}>{trendText}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonSummary;

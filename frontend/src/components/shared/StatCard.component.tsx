'use client';

import React, { useState } from 'react';
import Tooltip from '@/components/shared/Tooltip.component';
import { formatMonthYear, calculatePercentage, FinancialStats } from '@/utils/stats.utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export interface StatCardProps {
  title: string;
  stats: FinancialStats;
  currentValue: number;
  tooltipContent: React.ReactNode;
  bgColor: string;
  iconColor: string;
  Icon?: LucideIcon;
  trendType: 'depenses' | 'revenus' | 'solde';
}

/**
 * Composant carte de statistique réutilisable
 * 
 * Affiche les statistiques financières d'une catégorie (dépenses, revenus, solde) :
 * - Moyenne mensuelle
 * - Valeur du mois en cours
 * - Comparaison avec la moyenne
 * - Maximum et minimum historiques
 * - Tendance (hausse/baisse/stable)
 * 
 * @param title - Titre de la carte
 * @param stats - Statistiques calculées
 * @param currentValue - Valeur actuelle du mois en cours
 * @param tooltipContent - Contenu du tooltip d'aide
 * @param bgColor - Classe Tailwind pour la couleur de fond
 * @param iconColor - Classe Tailwind pour la couleur de l'icône
 * @param Icon - Icône Lucide à afficher
 * @param trendType - Type de tendance pour déterminer les couleurs
 */
export default function StatCard({
  title,
  stats,
  currentValue,
  tooltipContent,
  bgColor,
  iconColor,
  Icon = Activity,
  trendType,
}: StatCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Déterminer si l'augmentation est positive ou négative selon le type
  const isIncreaseGood = trendType === 'revenus' || trendType === 'solde';
  const isAboveAverage = currentValue > stats.average;

  // Couleur de la comparaison avec la moyenne
  const comparisonColor = stats.hasEnoughData
    ? isAboveAverage
      ? isIncreaseGood
        ? 'text-green-500'
        : 'text-red-500'
      : isIncreaseGood
        ? 'text-red-500'
        : 'text-green-500'
    : 'text-gray-500';

  // Couleur de la tendance
  const getTrendColor = () => {
    if (!stats.hasEnoughData) return 'text-gray-500';
    
    if (stats.trend === 'stable') return 'text-gray-500';
    
    if (trendType === 'depenses') {
      return stats.trend === 'up' ? 'text-red-500' : 'text-green-500';
    } else {
      return stats.trend === 'up' ? 'text-green-500' : 'text-red-500';
    }
  };

  // Texte de la tendance
  const getTrendText = () => {
    if (!stats.hasEnoughData) return 'Pas assez de données historiques';
    
    if (stats.trend === 'up') return 'Tendance à la hausse';
    if (stats.trend === 'down') return 'Tendance à la baisse';
    return 'Stable';
  };

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      {/* En-tête avec titre et tooltip */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className={`${iconColor} mr-2`} size={20} />
          <h4 className={`text-md font-medium ${iconColor.replace('text-', 'text-')}`}>
            {title}
          </h4>
        </div>
        <Tooltip
          isOpen={tooltipOpen}
          onToggle={() => setTooltipOpen((prev) => !prev)}
          onClickOutside={() => setTooltipOpen(false)}
          content={tooltipContent}
        >
          <HelpCircle size={16} aria-label={`Aide sur ${title.toLowerCase()}`} />
        </Tooltip>
      </div>

      {/* Moyenne mensuelle */}
      <p className="text-gray-700">
        Moyenne mensuelle:{' '}
        <span className="font-bold">{stats.average.toFixed(2)}€</span>
        {!stats.hasEnoughData && (
          <span className="text-xs text-gray-500 ml-1">
            (basée sur le mois en cours)
          </span>
        )}
      </p>

      {/* Mois en cours */}
      <p className="text-gray-700">
        Mois en cours:{' '}
        <span className="font-bold">{currentValue.toFixed(2)}€</span>
      </p>

      {/* Comparaison avec la moyenne */}
      <p className="text-gray-700 text-sm mt-1">
        {stats.hasEnoughData ? (
          isAboveAverage ? (
            <span className={`${comparisonColor} flex items-center`}>
              <ArrowUpRight size={16} className="inline mr-1" />
              {calculatePercentage(currentValue, stats.average)} au-dessus de la
              moyenne
            </span>
          ) : (
            <span className={`${comparisonColor} flex items-center`}>
              <ArrowDownRight size={16} className="inline mr-1" />
              {calculatePercentage(currentValue, stats.average)} en-dessous de la
              moyenne
            </span>
          )
        ) : (
          <span className="text-gray-500">Pas assez de données historiques</span>
        )}
      </p>

      {/* Maximum */}
      <p className="text-gray-700">
        Maximum:{' '}
        <span className="font-bold">{stats.maximum.value.toFixed(2)}€</span>{' '}
        <span className="text-sm ml-1">
          (
          {typeof stats.maximum.month === 'string' &&
          stats.maximum.month !== 'Mois en cours'
            ? formatMonthYear(stats.maximum.month)
            : stats.maximum.month}
          )
        </span>
      </p>

      {/* Minimum */}
      <p className="text-gray-700">
        Minimum:{' '}
        <span className="font-bold">{stats.minimum.value.toFixed(2)}€</span>{' '}
        <span className="text-sm ml-1">
          (
          {typeof stats.minimum.month === 'string' &&
          stats.minimum.month !== 'Mois en cours'
            ? formatMonthYear(stats.minimum.month)
            : stats.minimum.month}
          )
        </span>
      </p>

      {/* Tendance */}
      <p className="text-gray-700 text-sm mt-1">
        <span className={getTrendColor()}>{getTrendText()}</span>
      </p>
    </div>
  );
}

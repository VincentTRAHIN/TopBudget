'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMonthlyFlowsEvolution } from '@/hooks/useMonthlyExpensesEvolution.hook';
import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  HelpCircle,
} from 'lucide-react';

const Tooltip = ({
  children,
  content,
  isOpen,
  onToggle,
  onClickOutside,
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
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClickOutside]);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <div
        onClick={onToggle}
        className="inline-flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {children}
      </div>
      {isOpen && (
        <div className="absolute z-10 right-0 mt-2 w-64 px-4 py-3 bg-white border rounded-md shadow-lg text-sm text-gray-700">
          {content}
        </div>
      )}
    </div>
  );
};

const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return 'Date inconnue';

  if (!/^\d{4}-\d{2}$/.test(dateStr)) {
    return 'Date incorrecte';
  }

  try {
    const date = new Date(`${dateStr}-01`);
    if (isNaN(date.getTime())) return 'Date incorrecte';

    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return 'Date incorrecte';
  }
};

const calculatePercentage = (current: number, average: number): string => {
  if (average === 0) {
    return 'N/A (moyenne à 0)';
  }
  return (
    ((Math.abs(current - average) / Math.abs(average)) * 100).toFixed(1) + '%'
  );
};

export default function StatsSummary({
  statsContext = 'moi',
}: {
  statsContext?: 'moi' | 'couple';
}) {
  const { data: depensesData, isLoading: depensesLoading } =
    useMonthlyFlowsEvolution(12, statsContext, 'depenses');

  const { data: revenusData, isLoading: revenusLoading } =
    useMonthlyFlowsEvolution(12, statsContext, 'revenus');
  const { data: soldeData, isLoading: soldeLoading } = useMonthlyFlowsEvolution(
    12,
    statsContext,
    'solde',
  );

  const {
    totalDepenses,
    totalRevenus,
    solde,
    isLoading: currentMonthLoading,
  } = useCurrentMonthFlows(statsContext);

  const [depensesTooltipOpen, setDepensesTooltipOpen] = useState(false);
  const [revenuesTooltipOpen, setRevenuesTooltipOpen] = useState(false);
  const [soldeTooltipOpen, setSoldeTooltipOpen] = useState(false);

  function computeStats(
    arr: { value?: number; mois: string }[],
    currentValue: number,
  ) {
    const filtered = arr.filter(
      (item) => typeof item.value === 'number' && item.value !== 0,
    );

    const hasCurrentValue = currentValue !== 0;
    const currentMonthEntry = hasCurrentValue
      ? { value: currentValue, mois: 'Mois en cours' }
      : null;

    const dataForAnalysis = filtered.slice();
    if (currentMonthEntry) {
      dataForAnalysis.push(currentMonthEntry);
    }

    const hasEnoughData = dataForAnalysis.length >= 2;

    if (dataForAnalysis.length === 0) {
      return {
        average: 0,
        minimum: { value: 0, month: 'Aucune donnée' },
        maximum: { value: 0, month: 'Aucune donnée' },
        trend: 'stable',
        hasEnoughData: false,
      };
    }

    const average =
      dataForAnalysis.reduce((sum, item) => sum + (item.value ?? 0), 0) /
      dataForAnalysis.length;

    let min = dataForAnalysis[0];
    let max = dataForAnalysis[0];

    dataForAnalysis.forEach((item) => {
      if ((item.value ?? 0) < (min.value ?? 0)) min = item;
      if ((item.value ?? 0) > (max.value ?? 0)) max = item;
    });

    let trend = 'stable';

    if (hasEnoughData) {
      const sortedData = [...dataForAnalysis].sort((a, b) => {
        if (a.mois === 'Mois en cours') return 1;
        if (b.mois === 'Mois en cours') return -1;

        return a.mois.localeCompare(b.mois);
      });

      const lastThree = sortedData.slice(-3);

      if (lastThree.length >= 2) {
        const firstValue = lastThree[0].value ?? 0;
        const lastValue = lastThree[lastThree.length - 1].value ?? 0;

        if (firstValue === 0) {
          trend = lastValue > 0 ? 'up' : 'stable';
        } else {
          const changeRatio = lastValue / firstValue;
          if (changeRatio > 1.1) trend = 'up';
          else if (changeRatio < 0.9) trend = 'down';
        }
      }
    }

    return {
      average,
      minimum: {
        value: min.value ?? 0,
        month: min.mois,
      },
      maximum: {
        value: max.value ?? 0,
        month: max.mois,
      },
      trend,
      hasEnoughData,
    };
  }

  const depensesArr = Array.isArray(depensesData)
    ? depensesData.map((item) => ({
        value: item.totalDepenses ?? 0,
        mois: item.mois,
      }))
    : [];

  const revenusArr = Array.isArray(revenusData)
    ? revenusData.map((item) => ({
        value: item.totalRevenus ?? 0,
        mois: item.mois,
      }))
    : [];

  const soldeArr = Array.isArray(soldeData)
    ? soldeData.map((item) => ({
        value: item.soldeMensuel ?? 0,
        mois: item.mois,
      }))
    : [];

  const depensesStats = computeStats(depensesArr, totalDepenses);
  const revenusStats = computeStats(revenusArr, totalRevenus);
  const soldeStats = computeStats(soldeArr, solde);

  if (
    depensesLoading ||
    revenusLoading ||
    soldeLoading ||
    currentMonthLoading
  ) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Résumé des Statistiques</h3>
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Résumé des Statistiques</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dépenses */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Activity className="text-blue-600 mr-2" size={20} />
              <h4 className="text-md font-medium text-blue-700">Dépenses</h4>
            </div>
            <Tooltip
              isOpen={depensesTooltipOpen}
              onToggle={() => setDepensesTooltipOpen((prev) => !prev)}
              onClickOutside={() => setDepensesTooltipOpen(false)}
              content={
                <div>
                  <p className="font-medium mb-1">À propos des dépenses</p>
                  <p>
                    Ce bloc résume vos dépenses. 'Moyenne mensuelle' est
                    calculée sur les 12 derniers mois. 'Mois en cours' sont les
                    dépenses depuis le début du mois actuel. La tendance indique
                    si vos dépenses récentes augmentent ou diminuent.
                  </p>
                </div>
              }
            >
              <HelpCircle size={16} aria-label="Aide sur les dépenses" />
            </Tooltip>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">
              {depensesStats.average.toFixed(2)}€
            </span>
            {!depensesStats.hasEnoughData && (
              <span className="text-xs text-gray-500 ml-1">
                (basée sur le mois en cours)
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{totalDepenses.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {depensesStats.hasEnoughData ? (
              totalDepenses > depensesStats.average ? (
                <span className="text-red-500 flex items-center">
                  <ArrowUpRight size={16} className="inline mr-1" />
                  {calculatePercentage(
                    totalDepenses,
                    depensesStats.average,
                  )}{' '}
                  au-dessus de la moyenne
                </span>
              ) : (
                <span className="text-green-500 flex items-center">
                  <ArrowDownRight size={16} className="inline mr-1" />
                  {calculatePercentage(
                    totalDepenses,
                    depensesStats.average,
                  )}{' '}
                  en-dessous de la moyenne
                </span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {depensesStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof depensesStats.maximum.month === 'string' &&
              depensesStats.maximum.month !== 'Mois en cours'
                ? formatMonthYear(depensesStats.maximum.month)
                : depensesStats.maximum.month}
              )
            </span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {depensesStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof depensesStats.minimum.month === 'string' &&
              depensesStats.minimum.month !== 'Mois en cours'
                ? formatMonthYear(depensesStats.minimum.month)
                : depensesStats.minimum.month}
              )
            </span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {depensesStats.hasEnoughData ? (
              depensesStats.trend === 'up' ? (
                <span className="text-red-500">Tendance à la hausse</span>
              ) : depensesStats.trend === 'down' ? (
                <span className="text-green-500">Tendance à la baisse</span>
              ) : (
                <span className="text-gray-500">Stable</span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
        </div>
        {/* Revenus */}
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Activity className="text-green-600 mr-2" size={20} />
              <h4 className="text-md font-medium text-green-700">Revenus</h4>
            </div>
            <Tooltip
              isOpen={revenuesTooltipOpen}
              onToggle={() => setRevenuesTooltipOpen((prev) => !prev)}
              onClickOutside={() => setRevenuesTooltipOpen(false)}
              content={
                <div>
                  <p className="font-medium mb-1">À propos des revenus</p>
                  <p>
                    Ce bloc résume vos revenus. 'Moyenne mensuelle' est calculée
                    sur les 12 derniers mois. 'Mois en cours' sont les revenus
                    depuis le début du mois actuel. La tendance indique si vos
                    revenus récents augmentent ou diminuent.
                  </p>
                </div>
              }
            >
              <HelpCircle size={16} aria-label="Aide sur les revenus" />
            </Tooltip>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">
              {revenusStats.average.toFixed(2)}€
            </span>
            {!revenusStats.hasEnoughData && (
              <span className="text-xs text-gray-500 ml-1">
                (basée sur le mois en cours)
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{totalRevenus.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {revenusStats.hasEnoughData ? (
              totalRevenus > revenusStats.average ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight size={16} className="inline mr-1" />
                  {calculatePercentage(totalRevenus, revenusStats.average)}{' '}
                  au-dessus de la moyenne
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight size={16} className="inline mr-1" />
                  {calculatePercentage(totalRevenus, revenusStats.average)}{' '}
                  en-dessous de la moyenne
                </span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {revenusStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof revenusStats.maximum.month === 'string' &&
              revenusStats.maximum.month !== 'Mois en cours'
                ? formatMonthYear(revenusStats.maximum.month)
                : revenusStats.maximum.month}
              )
            </span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {revenusStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof revenusStats.minimum.month === 'string' &&
              revenusStats.minimum.month !== 'Mois en cours'
                ? formatMonthYear(revenusStats.minimum.month)
                : revenusStats.minimum.month}
              )
            </span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {revenusStats.hasEnoughData ? (
              revenusStats.trend === 'up' ? (
                <span className="text-green-500">Tendance à la hausse</span>
              ) : revenusStats.trend === 'down' ? (
                <span className="text-red-500">Tendance à la baisse</span>
              ) : (
                <span className="text-gray-500">Stable</span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
        </div>
        {/* Solde */}
        <div className="border rounded-lg p-4 bg-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Activity className="text-indigo-600 mr-2" size={20} />
              <h4 className="text-md font-medium text-indigo-700">Solde</h4>
            </div>
            <Tooltip
              isOpen={soldeTooltipOpen}
              onToggle={() => setSoldeTooltipOpen((prev) => !prev)}
              onClickOutside={() => setSoldeTooltipOpen(false)}
              content={
                <div>
                  <p className="font-medium mb-1">À propos du solde</p>
                  <p>
                    Ce bloc montre votre solde (Revenus - Dépenses). 'Moyenne
                    mensuelle' est calculée sur les 12 derniers mois. 'Mois en
                    cours' est le solde depuis le début du mois actuel. La
                    tendance indique si votre solde récent s'améliore ou se
                    dégrade.
                  </p>
                </div>
              }
            >
              <HelpCircle size={16} aria-label="Aide sur le solde" />
            </Tooltip>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">{soldeStats.average.toFixed(2)}€</span>
            {!soldeStats.hasEnoughData && (
              <span className="text-xs text-gray-500 ml-1">
                (basée sur le mois en cours)
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{solde.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {soldeStats.hasEnoughData ? (
              solde > soldeStats.average ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight size={16} className="inline mr-1" />
                  {soldeStats.average !== 0
                    ? `${calculatePercentage(solde, soldeStats.average)} au-dessus de la moyenne`
                    : 'Pas de comparaison possible (moyenne à 0)'}
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight size={16} className="inline mr-1" />
                  {soldeStats.average !== 0
                    ? `${calculatePercentage(solde, soldeStats.average)} en-dessous de la moyenne`
                    : 'Pas de comparaison possible (moyenne à 0)'}
                </span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {soldeStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof soldeStats.maximum.month === 'string' &&
              soldeStats.maximum.month !== 'Mois en cours'
                ? formatMonthYear(soldeStats.maximum.month)
                : soldeStats.maximum.month}
              )
            </span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {soldeStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              (
              {typeof soldeStats.minimum.month === 'string' &&
              soldeStats.minimum.month !== 'Mois en cours'
                ? formatMonthYear(soldeStats.minimum.month)
                : soldeStats.minimum.month}
              )
            </span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {soldeStats.hasEnoughData ? (
              soldeStats.trend === 'up' ? (
                <span className="text-green-500">Tendance à la hausse</span>
              ) : soldeStats.trend === 'down' ? (
                <span className="text-red-500">Tendance à la baisse</span>
              ) : (
                <span className="text-gray-500">Stable</span>
              )
            ) : (
              <span className="text-gray-500">
                Pas assez de données historiques
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

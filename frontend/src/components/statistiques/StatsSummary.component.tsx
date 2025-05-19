'use client';

import React from 'react';
import { useMonthlyFlowsEvolution } from '@/hooks/useMonthlyExpensesEvolution.hook';
import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import { ArrowDownRight, ArrowUpRight, Activity } from 'lucide-react';

export default function StatsSummary({
  statsContext = 'moi',
}: {
  statsContext?: 'moi' | 'couple';
}) {
  // Dépenses
  const { data: depensesData, isLoading: depensesLoading } =
    useMonthlyFlowsEvolution(12, statsContext, 'depenses');
  // Revenus
  const { data: revenusData, isLoading: revenusLoading } =
    useMonthlyFlowsEvolution(12, statsContext, 'revenus');
  // Solde
  const { data: soldeData, isLoading: soldeLoading } = useMonthlyFlowsEvolution(
    12,
    statsContext,
    'solde',
  );
  // Mois courant
  const {
    totalDepenses,
    totalRevenus,
    solde,
    isLoading: currentMonthLoading,
  } = useCurrentMonthFlows(statsContext);

  // Helper pour stats (moyenne, min, max, trend)
  function computeStats(arr: { value?: number; mois: string }[]) {
    const filtered = arr.filter((item) => typeof item.value === 'number');
    if (filtered.length === 0)
      return {
        average: 0,
        minimum: { value: 0, month: '' },
        maximum: { value: 0, month: '' },
        trend: 'stable',
      };
    const average =
      filtered.reduce((sum, item) => sum + (item.value ?? 0), 0) /
      filtered.length;
    let min = filtered[0];
    let max = filtered[0];
    filtered.forEach((item) => {
      if ((item.value ?? 0) < (min.value ?? 0)) min = item;
      if ((item.value ?? 0) > (max.value ?? 0)) max = item;
    });
    // Trend
    const lastThree = filtered.slice(-3);
    let trend = 'stable';
    if (lastThree.length >= 2) {
      const firstValue = lastThree[0].value ?? 0;
      const lastValue = lastThree[lastThree.length - 1].value ?? 0;
      if (lastValue > firstValue * 1.1) trend = 'up';
      else if (lastValue < firstValue * 0.9) trend = 'down';
    }
    return {
      average,
      minimum: {
        value: min.value ?? 0,
        month: new Date(min.mois + '-01').toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
      },
      maximum: {
        value: max.value ?? 0,
        month: new Date(max.mois + '-01').toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
      },
      trend,
    };
  }

  // S'assurer que les données sont des tableaux
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

  const depensesStats = computeStats(depensesArr);
  const revenusStats = computeStats(revenusArr);
  const soldeStats = computeStats(soldeArr);

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
          <div className="flex items-center mb-2">
            <Activity className="text-blue-600 mr-2" size={20} />
            <h4 className="text-md font-medium text-blue-700">Dépenses</h4>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">
              {depensesStats.average.toFixed(2)}€
            </span>
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{totalDepenses.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {totalDepenses > depensesStats.average ? (
              <span className="text-red-500 flex items-center">
                <ArrowUpRight size={16} className="inline mr-1" />
                {(
                  ((totalDepenses - depensesStats.average) /
                    depensesStats.average) *
                  100
                ).toFixed(1)}
                % au-dessus de la moyenne
              </span>
            ) : (
              <span className="text-green-500 flex items-center">
                <ArrowDownRight size={16} className="inline mr-1" />
                {(
                  ((depensesStats.average - totalDepenses) /
                    depensesStats.average) *
                  100
                ).toFixed(1)}
                % en-dessous de la moyenne
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {depensesStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              ({depensesStats.maximum.month})
            </span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {depensesStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">
              ({depensesStats.minimum.month})
            </span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {depensesStats.trend === 'up' ? (
              <span className="text-red-500">Tendance à la hausse</span>
            ) : depensesStats.trend === 'down' ? (
              <span className="text-green-500">Tendance à la baisse</span>
            ) : (
              <span className="text-gray-500">Stable</span>
            )}
          </p>
        </div>
        {/* Revenus */}
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center mb-2">
            <Activity className="text-green-600 mr-2" size={20} />
            <h4 className="text-md font-medium text-green-700">Revenus</h4>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">
              {revenusStats.average.toFixed(2)}€
            </span>
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{totalRevenus.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {totalRevenus > revenusStats.average ? (
              <span className="text-green-500 flex items-center">
                <ArrowUpRight size={16} className="inline mr-1" />
                {(
                  ((totalRevenus - revenusStats.average) /
                    revenusStats.average) *
                  100
                ).toFixed(1)}
                % au-dessus de la moyenne
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <ArrowDownRight size={16} className="inline mr-1" />
                {(
                  ((revenusStats.average - totalRevenus) /
                    revenusStats.average) *
                  100
                ).toFixed(1)}
                % en-dessous de la moyenne
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {revenusStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">({revenusStats.maximum.month})</span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {revenusStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">({revenusStats.minimum.month})</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {revenusStats.trend === 'up' ? (
              <span className="text-green-500">Tendance à la hausse</span>
            ) : revenusStats.trend === 'down' ? (
              <span className="text-red-500">Tendance à la baisse</span>
            ) : (
              <span className="text-gray-500">Stable</span>
            )}
          </p>
        </div>
        {/* Solde */}
        <div className="border rounded-lg p-4 bg-indigo-50">
          <div className="flex items-center mb-2">
            <Activity className="text-indigo-600 mr-2" size={20} />
            <h4 className="text-md font-medium text-indigo-700">Solde</h4>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">{soldeStats.average.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{solde.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {solde > soldeStats.average ? (
              <span className="text-green-500 flex items-center">
                <ArrowUpRight size={16} className="inline mr-1" />
                {(
                  ((solde - soldeStats.average) / soldeStats.average) *
                  100
                ).toFixed(1)}
                % au-dessus de la moyenne
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <ArrowDownRight size={16} className="inline mr-1" />
                {(
                  ((soldeStats.average - solde) / soldeStats.average) *
                  100
                ).toFixed(1)}
                % en-dessous de la moyenne
              </span>
            )}
          </p>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">
              {soldeStats.maximum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">({soldeStats.maximum.month})</span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">
              {soldeStats.minimum.value.toFixed(2)}€
            </span>{' '}
            <span className="text-sm ml-1">({soldeStats.minimum.month})</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {soldeStats.trend === 'up' ? (
              <span className="text-green-500">Tendance à la hausse</span>
            ) : soldeStats.trend === 'down' ? (
              <span className="text-red-500">Tendance à la baisse</span>
            ) : (
              <span className="text-gray-500">Stable</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

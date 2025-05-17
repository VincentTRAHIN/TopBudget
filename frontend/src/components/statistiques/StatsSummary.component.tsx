'use client';

import React, { useState, useEffect } from 'react';
import { useMonthlyExpensesEvolution } from '@/hooks/useMonthlyExpensesEvolution.hook';
import { useCurrentMonthTotal } from '@/hooks/useCurrentMonthTotal.hook';
import {
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
} from 'lucide-react';

export default function StatsSummary({
  statsContext = 'moi',
}: {
  statsContext?: 'moi' | 'couple';
}) {
  const { data: evolutionData, isLoading: evolutionLoading } =
    useMonthlyExpensesEvolution(12, statsContext);
  const { total: currentMonthTotal, isLoading: currentMonthLoading } =
    useCurrentMonthTotal(statsContext);
  const [stats, setStats] = useState({
    average: 0,
    minimum: { value: 0, month: '' },
    maximum: { value: 0, month: '' },
    trend: 'stable',
  });

  useEffect(() => {
    if (!evolutionLoading && evolutionData && evolutionData.length > 0) {
      const totalExpenses = evolutionData.reduce(
        (sum, item) => sum + item.totalDepenses,
        0,
      );
      const average = totalExpenses / evolutionData.length;

      let minExpense = { value: Infinity, month: '' };
      let maxExpense = { value: 0, month: '' };

      evolutionData.forEach((item) => {
        if (item.totalDepenses < minExpense.value) {
          minExpense = {
            value: item.totalDepenses,
            month: new Date(item.mois + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            }),
          };
        }
        if (item.totalDepenses > maxExpense.value) {
          maxExpense = {
            value: item.totalDepenses,
            month: new Date(item.mois + '-01').toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            }),
          };
        }
      });

      const lastThreeMonths = [...evolutionData].slice(-3);
      if (lastThreeMonths.length >= 2) {
        const firstValue = lastThreeMonths[0].totalDepenses;
        const lastValue =
          lastThreeMonths[lastThreeMonths.length - 1].totalDepenses;

        let trend = 'stable';
        if (lastValue > firstValue * 1.1) {
          trend = 'up';
        } else if (lastValue < firstValue * 0.9) {
          trend = 'down';
        }

        setStats({
          average,
          minimum: { value: minExpense.value, month: minExpense.month },
          maximum: { value: maxExpense.value, month: maxExpense.month },
          trend,
        });
      }
    }
  }, [evolutionData, evolutionLoading]);

  if (evolutionLoading || currentMonthLoading) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-2">
            <Activity className="text-blue-600 mr-2" size={20} />
            <h4 className="text-md font-medium text-blue-700">Moyennes</h4>
          </div>
          <p className="text-gray-700">
            Moyenne mensuelle:{' '}
            <span className="font-bold">{stats.average.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700">
            Mois en cours:{' '}
            <span className="font-bold">{currentMonthTotal.toFixed(2)}€</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {currentMonthTotal > stats.average ? (
              <span className="text-red-500 flex items-center">
                <ArrowUpRight size={16} className="inline mr-1" />
                {(
                  ((currentMonthTotal - stats.average) / stats.average) *
                  100
                ).toFixed(1)}
                % au-dessus de la moyenne
              </span>
            ) : (
              <span className="text-green-500 flex items-center">
                <ArrowDownRight size={16} className="inline mr-1" />
                {(
                  ((stats.average - currentMonthTotal) / stats.average) *
                  100
                ).toFixed(1)}
                % en-dessous de la moyenne
              </span>
            )}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center mb-2">
            {stats.trend === 'up' ? (
              <TrendingUp className="text-red-600 mr-2" size={20} />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="text-green-600 mr-2" size={20} />
            ) : (
              <Activity className="text-gray-600 mr-2" size={20} />
            )}
            <h4 className="text-md font-medium text-green-700">Tendances</h4>
          </div>
          <p className="text-gray-700">
            Maximum:{' '}
            <span className="font-bold">{stats.maximum.value.toFixed(2)}€</span>
            <span className="text-sm ml-1">({stats.maximum.month})</span>
          </p>
          <p className="text-gray-700">
            Minimum:{' '}
            <span className="font-bold">{stats.minimum.value.toFixed(2)}€</span>
            <span className="text-sm ml-1">({stats.minimum.month})</span>
          </p>
          <p className="text-gray-700 text-sm mt-1">
            {stats.trend === 'up' ? (
              <span className="text-red-500">
                Tendance à la hausse des dépenses
              </span>
            ) : stats.trend === 'down' ? (
              <span className="text-green-500">
                Tendance à la baisse des dépenses
              </span>
            ) : (
              <span className="text-gray-500">
                Dépenses stables sur les derniers mois
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

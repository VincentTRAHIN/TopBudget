'use client';

import React from 'react';
import { useFinancialStats } from '@/hooks/useFinancialStats.hook';
import StatCard from '@/components/shared/StatCard.component';

export default function StatsSummary({
  statsContext = 'moi',
}: {
  statsContext?: 'moi' | 'couple';
}) {
  const { depensesStats, revenusStats, soldeStats, currentMonth, isLoading } =
    useFinancialStats(statsContext);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Indicateurs Clés</h3>
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
      <h3 className="text-lg font-semibold mb-4">Indicateurs Clés</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte Dépenses */}
        <StatCard
          title="Dépenses"
          stats={depensesStats}
          currentValue={currentMonth.depenses}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          trendType="depenses"
          tooltipContent={
            <div>
              <p className="font-medium mb-1">À propos des dépenses</p>
              <p>
                Ce bloc résume vos dépenses. `Moyenne mensuelle` est calculée
                sur les 12 derniers mois. `Mois en cours` sont les dépenses
                depuis le début du mois actuel. La tendance indique si vos
                dépenses récentes augmentent ou diminuent.
              </p>
            </div>
          }
        />

        {/* Carte Revenus */}
        <StatCard
          title="Revenus"
          stats={revenusStats}
          currentValue={currentMonth.revenus}
          bgColor="bg-green-50"
          iconColor="text-green-600"
          trendType="revenus"
          tooltipContent={
            <div>
              <p className="font-medium mb-1">À propos des revenus</p>
              <p>
                Ce bloc résume vos revenus. `Moyenne mensuelle` est calculée sur
                les 12 derniers mois. `Mois en cours` sont les revenus depuis le
                début du mois actuel. La tendance indique si vos revenus récents
                augmentent ou diminuent.
              </p>
            </div>
          }
        />

        {/* Carte Solde */}
        <StatCard
          title="Solde"
          stats={soldeStats}
          currentValue={currentMonth.solde}
          bgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          trendType="solde"
          tooltipContent={
            <div>
              <p className="font-medium mb-1">À propos du solde</p>
              <p>
                Ce bloc montre votre solde (Revenus - Dépenses). `Moyenne
                mensuelle` est calculée sur les 12 derniers mois. `Mois en cours`
                est le solde depuis le début du mois actuel. La tendance indique
                si votre solde récent s&apos;améliore ou se dégrade.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}

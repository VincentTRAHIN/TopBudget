'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import PieChartFlows from '@/components/shared/PieChartFlows.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import { MonthlyFlowsChart } from '@/components/dashboard/MonthlyExpensesChart.component';
import StatsSummary from '@/components/statistiques/StatsSummary.component';
import CoupleContributionsSummary from '@/components/statistiques/CoupleContributionsSummary.component';
import CoupleFixedChargesList from '@/components/statistiques/CoupleFixedChargesList.component';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState } from 'react';
import { User, Users } from 'lucide-react';

export default function StatistiquesPage() {
  const { user } = useAuth();
  const [statsContext, setStatsContext] = useState<'moi' | 'couple'>('moi');
  const partenaireNom =
    typeof user?.partenaireId === 'object' && user?.partenaireId?.nom
      ? user.partenaireId.nom
      : 'Partenaire';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const getTitleForChart = (type: 'depenses' | 'revenus') => {
    return type === 'depenses'
      ? 'Dépenses par Catégorie'
      : 'Revenus par Catégorie';
  };

  const getTooltipContent = (type: 'depenses' | 'revenus') => {
    if (type === 'depenses') {
      return (
        <div>
          <p className="font-medium mb-1">Répartition des dépenses</p>
          <p>
            Ce graphique montre comment vos dépenses se répartissent entre les différentes catégories. 
            Chaque segment représente le pourcentage et le montant dépensé dans une catégorie spécifique.
          </p>
        </div>
      );
    }
    return (
      <div>
        <p className="font-medium mb-1">Répartition des revenus</p>
        <p>
          Ce graphique montre la répartition de vos revenus par catégorie (salaire, investissements, autres sources). 
          Visualisez facilement d&apos;où proviennent vos entrées d&apos;argent.
        </p>
      </div>
    );
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          {/* Enhanced Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Statistiques Financières
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {statsContext === 'moi'
                ? 'Analyse détaillée de vos finances personnelles'
                : `Analyse détaillée des finances du couple${partenaireNom !== 'Partenaire' ? ` avec ${partenaireNom}` : ''}`}
            </p>

            {/* Enhanced Context Switcher */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setStatsContext('moi')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  statsContext === 'moi'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Mes Statistiques</span>
              </button>
              {user?.partenaireId && (
                <button
                  onClick={() => setStatsContext('couple')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    statsContext === 'couple'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Statistiques du Couple</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Vue d'Ensemble */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Vue d&apos;Ensemble
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StatsSummary statsContext={statsContext} />
              </div>
              <div className="lg:col-span-1">
                <MonthlyComparisonSummary statsContext={statsContext} />
              </div>
            </div>
          </section>

          {/* Section 2: Répartitions par Catégorie */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Répartitions par Catégorie
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <PieChartFlows
                  type="depenses"
                  statsContext={statsContext}
                  customTitle={getTitleForChart('depenses')}
                  tooltipContent={getTooltipContent('depenses')}
                />
              </div>
              <div>
                <PieChartFlows
                  type="revenus"
                  statsContext={statsContext}
                  customTitle={getTitleForChart('revenus')}
                  tooltipContent={getTooltipContent('revenus')}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Tendances et Évolutions */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Tendances et Évolutions
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <MonthlyFlowsChart statsContext={statsContext} />
              </div>
              <div className="xl:col-span-1">
                <PieChartFlows
                  type="depenses"
                  statsContext={statsContext}
                  mode="year"
                  showModeToggle={true}
                  customTitle="Top 5 des Dépenses"
                  tooltipContent={
                    <div>
                      <p className="font-medium mb-1">Catégories principales</p>
                      <p>
                        Identifiez rapidement vos 5 catégories de dépenses les plus importantes. 
                        Basculez entre vue mensuelle et annuelle pour comparer vos habitudes de consommation.
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </section>

          {/* Section 4: Statistiques du Couple */}
          {user?.partenaireId && statsContext === 'couple' && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Statistiques du Couple
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CoupleContributionsSummary partenaireNom={partenaireNom} />
                <CoupleFixedChargesList />
              </div>
            </section>
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}

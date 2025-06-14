'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import PieChartCategories from '@/components/dashboard/pieChartCategories.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import { MonthlyFlowsChart } from '@/components/dashboard/MonthlyExpensesChart.component';
import StatsSummary from '@/components/statistiques/StatsSummary.component';
import TopCategoriesYearToDate from '@/components/statistiques/TopCategoriesYearToDate.component';
import CoupleContributionsSummary from '@/components/statistiques/CoupleContributionsSummary.component';
import CoupleFixedChargesList from '@/components/statistiques/CoupleFixedChargesList.component';
import { PieChartCategoriesRevenu } from '@/components/statistiques/PieChartCategoriesRevenu.component';
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
    if (statsContext === 'couple') {
      return type === 'depenses'
        ? `Répartition des Dépenses Communes par Catégorie - ${monthNames[currentMonth - 1]} ${currentYear}`
        : `Répartition des Revenus du Couple par Catégorie - ${monthNames[currentMonth - 1]} ${currentYear}`;
    }

    return type === 'depenses'
      ? `Répartition par Catégorie - ${monthNames[currentMonth - 1]} ${currentYear}`
      : `Répartition des Revenus par Catégorie - ${monthNames[currentMonth - 1]} ${currentYear}`;
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
                <PieChartCategories
                  statsContext={statsContext}
                  customTitle={getTitleForChart('depenses')}
                />
              </div>
              <div>
                <PieChartCategoriesRevenu
                  year={currentYear}
                  month={currentMonth}
                  contexte={statsContext === 'moi' ? 'perso' : statsContext}
                  customTitle={getTitleForChart('revenus')}
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
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Évolution des Flux Mensuels
                  </h3>
                  <MonthlyFlowsChart statsContext={statsContext} />
                </div>
              </div>
              <div className="xl:col-span-1">
                <TopCategoriesYearToDate statsContext={statsContext} />
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

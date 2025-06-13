'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import KPICard from '@/components/dashboard/KPICard.component';
import LastDepenses from '@/components/dashboard/lastDepenses.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import { MonthlyFlowsChart } from '@/components/dashboard/MonthlyExpensesChart.component';
import PieChartCategories from '@/components/dashboard/pieChartCategories.component';
import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function DashboardPage() {
  // Call the hook once and extract individual values
  const { totalDepenses, totalRevenus, solde, isLoading, isError } = useCurrentMonthFlows('moi');

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="mt-2 text-sm text-gray-600">
              Vue d&apos;ensemble de votre situation financière
            </p>
          </div>

          {/* Section 1: Indicateurs Clés */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Indicateurs Clés
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <KPICard
                title="Dépenses du Mois"
                value={totalDepenses}
                icon={TrendingDown}
                colorTheme="expense"
                isLoading={isLoading}
                isError={isError}
              />
              <KPICard
                title="Revenus du Mois"
                value={totalRevenus}
                icon={TrendingUp}
                colorTheme="income"
                isLoading={isLoading}
                isError={isError}
              />
              <KPICard
                title="Solde du Mois"
                value={solde}
                icon={Wallet}
                colorTheme="balance"
                isLoading={isLoading}
                isError={isError}
              />
            </div>
          </section>

          {/* Section 2: Analyses Graphiques */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Analyses Graphiques
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Évolution des flux mensuels */}
              <div className="xl:col-span-2">
                <MonthlyFlowsChart 
                  statsContext="moi"
                  defaultDataType="solde"
                />
              </div>

              {/* Répartition des dépenses par catégorie */}
              <div className="xl:col-span-1">
                <PieChartCategories 
                  statsContext="moi"
                  customTitle="Dépenses (Mois en cours)"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Aperçu Rapide */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Aperçu Rapide
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparaison mensuelle */}
              <div>
                <MonthlyComparisonSummary statsContext="moi" />
              </div>

              {/* Dernières dépenses */}
              <div>
                <LastDepenses />
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </RequireAuth>
  );
}

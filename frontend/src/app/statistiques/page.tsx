'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import PieChartCategories from '@/components/dashboard/pieChartCategories.component';
import MonthlyExpensesChart from '@/components/dashboard/MonthlyExpensesChart.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import StatsSummary from '@/components/statistiques/StatsSummary.component';
import TopCategoriesYearToDate from '@/components/statistiques/TopCategoriesYearToDate.component';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState } from 'react';

export default function StatistiquesPage() {
  const { user } = useAuth();
  const [statsContext, setStatsContext] = useState<'moi' | 'couple'>('moi');

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Statistiques</h1>

          {/* Sélecteur de contexte statistiques */}
          <div className="mb-4">
            <label htmlFor="stats-context-select" className="mr-2 font-medium">Vue :</label>
            <select
              id="stats-context-select"
              value={statsContext}
              onChange={e => setStatsContext(e.target.value as 'moi' | 'couple')}
              className="border rounded px-2 py-1"
            >
              <option value="moi">Mes Statistiques</option>
              {user?.partenaireId && (
                <option value="couple">Statistiques du Couple</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <StatsSummary statsContext={statsContext} />
            </div>
            <div className="md:col-span-1">
              <MonthlyComparisonSummary statsContext={statsContext} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="col-span-1">
              <PieChartCategories statsContext={statsContext} />
            </div>
            <div className="col-span-1">
              <TopCategoriesYearToDate statsContext={statsContext} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Évolution des Dépenses
              </h2>
              <MonthlyExpensesChart statsContext={statsContext} />
            </div>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}

'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import PieChartCategories from '@/components/dashboard/pieChartCategories.component';
import MonthlyExpensesChart from '@/components/dashboard/MonthlyExpensesChart.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import StatsSummary from '@/components/statistiques/StatsSummary.component';
import TopCategoriesYearToDate from '@/components/statistiques/TopCategoriesYearToDate.component';

export default function StatistiquesPage() {
  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Statistiques</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <StatsSummary />
            </div>
            <div className="md:col-span-1">
              <MonthlyComparisonSummary />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="col-span-1">
              <PieChartCategories />
            </div>
            <div className="col-span-1">
              <TopCategoriesYearToDate />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Évolution des Dépenses
              </h2>
              <MonthlyExpensesChart />
            </div>
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}

import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/requireAuth.component";
import TotalDepenses from "@/components/dashboard/totalDepenses.component";
import PieChartCategories from "@/components/dashboard/pieChartCategories.component";
import LastDepenses from "@/components/dashboard/lastDepenses.component";
import MonthlyExpensesChart from "@/components/dashboard/MonthlyExpensesChart.component";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <TotalDepenses />
          <PieChartCategories />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <MonthlyExpensesChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <LastDepenses />
        </div>
      </Layout>
    </RequireAuth>
  );
}

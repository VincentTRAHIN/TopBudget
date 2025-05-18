'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TotalFlows from '@/components/dashboard/totalDepenses.component';
import LastDepenses from '@/components/dashboard/lastDepenses.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import SyntheseMensuelle from '@/components/statistiques/SyntheseMensuelle.component';
import { useAuth } from '@/hooks/useAuth.hook';

export default function DashboardPage() {
  const { user } = useAuth();
  const contexteSynthese = user?.partenaireId ? 'couple' : 'moi';

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>

          {/* Section pour les indicateurs clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total des flux du mois en cours */}
            <div className="lg:col-span-1">
              <TotalFlows />
            </div>

            {/* Comparaison mensuelle */}
            <div className="lg:col-span-1">
              <MonthlyComparisonSummary />
            </div>

            {/* Synthèse Mensuelle */}
            <div className="lg:col-span-1">
              <SyntheseMensuelle contexte={contexteSynthese} />
            </div>
          </div>

          {/* Section pour les dernières dépenses */}
          <div className="grid grid-cols-1 gap-6">
            <LastDepenses />
          </div>
        </div>
      </Layout>
    </RequireAuth>
  );
}

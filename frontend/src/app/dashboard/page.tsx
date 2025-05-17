'use client'; // Ajouter cette directive en haut du fichier

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TotalDepenses from '@/components/dashboard/totalDepenses.component';
import LastDepenses from '@/components/dashboard/lastDepenses.component';
import MonthlyComparisonSummary from '@/components/dashboard/MonthlyComparisonSummary.component';
import SyntheseMensuelle from '@/components/statistiques/SyntheseMensuelle.component'; // Importer SyntheseMensuelle
import { useAuth } from '@/hooks/useAuth.hook'; // Importer useAuth

export default function DashboardPage() {
  const { user } = useAuth(); // Utiliser useAuth pour déterminer le contexte
  const contexteSynthese = user?.partenaireId ? 'couple' : 'moi'; // Déterminer le contexte

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>

          {/* Section pour les indicateurs clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total des dépenses du mois en cours */}
            <div className="lg:col-span-1">
              <TotalDepenses />
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

"use client";

import RequireAuth from "@/components/auth/requireAuth.component";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth.hook";
import { Suspense, lazy, memo, useCallback, useMemo, useState } from "react";

// Lazy loading des composants lourds (graphiques Chart.js)
const MonthlyComparisonChart = lazy(() => import("@/components/statistiques/MonthlyComparisonChart.component"));
const ExpensesTrendsChart = lazy(() => import("@/components/statistiques/ExpensesTrendsChart.component"));
const CategoryBreakdown = lazy(() => import("@/components/statistiques/CategoryBreakdown.component"));
const PieChartFlows = lazy(() => import("@/components/shared/PieChartFlows.component"));
const CoupleContributionsSummary = lazy(() => import("@/components/statistiques/CoupleContributionsSummary.component"));
const CoupleFixedChargesList = lazy(() => import("@/components/statistiques/CoupleFixedChargesList.component"));

// Skeleton de chargement pour les graphiques
const ChartSkeleton = memo(({ height = "h-96" }: { height?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm p-6 ${height}`}>
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex-1 bg-gray-200 rounded mt-4 h-64"></div>
    </div>
  </div>
));
ChartSkeleton.displayName = "ChartSkeleton";

// Icons SVG memoizés
const UserIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
));
UserIcon.displayName = "UserIcon";

const UsersIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
));
UsersIcon.displayName = "UsersIcon";

/**
 * Page Statistiques - Analyse financière détaillée avec optimisations
 *
 * Optimisations appliquées :
 * - Lazy loading de tous les graphiques Chart.js
 * - Memoization des composants statiques (icons)
 * - useMemo pour les tooltips et titres
 * - useCallback pour les handlers d'événements
 * - Suspense boundaries pour chargement progressif
 *
 * Cette page offre une vue complète des statistiques financières avec :
 * - Comparaison mensuelle revenus/dépenses
 * - Tendances des dépenses par catégorie
 * - Répartition détaillée des dépenses
 * - Statistiques spécifiques au couple (si applicable)
 */
export default function StatistiquesPage() {
  const { user } = useAuth();
  const [statsContext, setStatsContext] = useState<"moi" | "couple">("moi");

  // Memoization du nom du partenaire
  const partenaireNom = useMemo(() => {
    return typeof user?.partenaireId === "object" && user?.partenaireId?.nom ? user.partenaireId.nom : "Partenaire";
  }, [user?.partenaireId]);

  // Memoization de la description
  const pageDescription = useMemo(() => {
    return statsContext === "moi"
      ? "Analyse détaillée de vos finances personnelles"
      : `Analyse détaillée des finances du couple${partenaireNom !== "Partenaire" ? ` avec ${partenaireNom}` : ""}`;
  }, [statsContext, partenaireNom]);

  // Handlers avec useCallback pour éviter les re-renders
  const handleSetMoiContext = useCallback(() => setStatsContext("moi"), []);
  const handleSetCoupleContext = useCallback(() => setStatsContext("couple"), []);

  // Memoization des tooltips
  const depensesTooltipContent = useMemo(
    () => (
      <div>
        <p className="font-medium mb-1">Répartition des dépenses</p>
        <p>
          Ce graphique montre comment vos dépenses se répartissent entre les différentes catégories. Chaque segment
          représente le pourcentage et le montant dépensé dans une catégorie spécifique.
        </p>
      </div>
    ),
    [],
  );

  const revenusTooltipContent = useMemo(
    () => (
      <div>
        <p className="font-medium mb-1">Répartition des revenus</p>
        <p>
          Ce graphique montre la répartition de vos revenus par catégorie (salaire, investissements, autres sources).
          Visualisez facilement d&apos;où proviennent vos entrées d&apos;argent.
        </p>
      </div>
    ),
    [],
  );

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          {/* En-tête de page avec switcher de contexte */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques Financières</h1>
            <p className="text-sm text-gray-600 mb-6">{pageDescription}</p>

            {/* Switcher de contexte (Moi / Couple) */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={handleSetMoiContext}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  statsContext === "moi" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
                aria-label="Afficher mes statistiques personnelles">
                <UserIcon />
                <span>Mes Statistiques</span>
              </button>
              {user?.partenaireId && (
                <button
                  onClick={handleSetCoupleContext}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    statsContext === "couple"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="Afficher les statistiques du couple">
                  <UsersIcon />
                  <span>Statistiques du Couple</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Vue d'Ensemble Mensuelle */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Vue d&apos;Ensemble Mensuelle</h2>
              <p className="text-sm text-gray-600 mt-1">
                Comparaison de vos revenus et dépenses du mois en cours avec le mois précédent
              </p>
            </div>
            <Suspense fallback={<ChartSkeleton />}>
              <MonthlyComparisonChart contexte={statsContext} />
            </Suspense>
          </section>

          {/* Section 2: Analyse des Dépenses */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Analyse des Dépenses</h2>
              <p className="text-sm text-gray-600 mt-1">Tendances et répartition de vos dépenses par catégorie</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <Suspense fallback={<ChartSkeleton height="h-80" />}>
                  <ExpensesTrendsChart contexte={statsContext} nbMois={6} />
                </Suspense>
              </div>
              <div className="xl:col-span-1">
                <Suspense fallback={<ChartSkeleton height="h-80" />}>
                  <CategoryBreakdown contexte={statsContext} />
                </Suspense>
              </div>
            </div>
          </section>

          {/* Section 3: Répartitions par Catégorie (vue en camembert) */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Répartitions par Catégorie</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visualisation circulaire de la distribution de vos flux financiers
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <PieChartFlows
                  type="depenses"
                  statsContext={statsContext}
                  customTitle="Dépenses par Catégorie"
                  tooltipContent={depensesTooltipContent}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <PieChartFlows
                  type="revenus"
                  statsContext={statsContext}
                  customTitle="Revenus par Catégorie"
                  tooltipContent={revenusTooltipContent}
                />
              </Suspense>
            </div>
          </section>

          {/* Section 4: Statistiques du Couple */}
          {user?.partenaireId && statsContext === "couple" && (
            <section className="mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Statistiques du Couple</h2>
                <p className="text-sm text-gray-600 mt-1">Analyse des contributions et charges partagées</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<ChartSkeleton height="h-64" />}>
                  <CoupleContributionsSummary partenaireNom={partenaireNom} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton height="h-64" />}>
                  <CoupleFixedChargesList />
                </Suspense>
              </div>
            </section>
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}

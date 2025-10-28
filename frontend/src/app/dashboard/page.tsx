'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import { lazy, Suspense } from 'react';

// Lazy loading des composants lourds pour améliorer les performances
const ExpensesSyncReminder = lazy(() => import('@/components/dashboard/ExpensesSyncReminder.component'));
const MonthlyExpenseSummary = lazy(() => import('@/components/dashboard/MonthlyExpenseSummary.component'));
const UpcomingChargesCalendar = lazy(() => import('@/components/dashboard/UpcomingChargesCalendar.component'));
const QuickActionsPanel = lazy(() => import('@/components/dashboard/QuickActionsPanel.component'));

// Skeleton de chargement réutilisable
const LoadingSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm ${height} animate-pulse`}>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

/**
 * DashboardPage - Page du tableau de bord refactorisée avec optimisations
 *
 * Optimisations appliquées :
 * - Lazy loading de tous les composants lourds
 * - Suspense boundaries pour un chargement progressif
 * - Skeletons de chargement pour améliorer l'UX
 * 
 * Layout structuré :
 * 1. ExpensesSyncReminder (pleine largeur) - Alerte si inactivité > 7 jours
 * 2. Row avec :
 *    - MonthlyExpenseSummary (60%) - Résumé financier mensuel avec graphique
 *    - UpcomingChargesCalendar (40%) - Charges fixes à venir
 * 3. QuickActionsPanel (pleine largeur) - Actions rapides
 */
export default function DashboardPage() {
  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          {/* En-tête de la page */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Vue d&apos;ensemble de votre situation financière
            </p>
          </div>

          {/* Section 1 : Alerte de synchronisation (pleine largeur) */}
          <section>
            <Suspense fallback={<LoadingSkeleton height="h-32" />}>
              <ExpensesSyncReminder />
            </Suspense>
          </section>

          {/* Section 2 : Résumé mensuel (60%) + Charges fixes (40%) */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Suspense fallback={<LoadingSkeleton height="h-96" />}>
                <MonthlyExpenseSummary />
              </Suspense>
            </div>
            <div className="lg:col-span-2">
              <Suspense fallback={<LoadingSkeleton height="h-96" />}>
                <UpcomingChargesCalendar />
              </Suspense>
            </div>
          </section>

          {/* Section 3 : Actions rapides (pleine largeur) */}
          <section>
            <Suspense fallback={<LoadingSkeleton height="h-48" />}>
              <QuickActionsPanel />
            </Suspense>
          </section>
        </div>
      </Layout>
    </RequireAuth>
  );
}

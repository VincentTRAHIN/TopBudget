'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import ExpensesSyncReminder from '@/components/dashboard/ExpensesSyncReminder.component';
import MonthlyExpenseSummary from '@/components/dashboard/MonthlyExpenseSummary.component';
import UpcomingChargesCalendar from '@/components/dashboard/UpcomingChargesCalendar.component';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel.component';

/**
 * DashboardPage - Page du tableau de bord refactorisée
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
            <ExpensesSyncReminder />
          </section>

          {/* Section 2 : Résumé mensuel (60%) + Charges fixes (40%) */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <MonthlyExpenseSummary />
            </div>
            <div className="lg:col-span-2">
              <UpcomingChargesCalendar />
            </div>
          </section>

          {/* Section 3 : Actions rapides (pleine largeur) */}
          <section>
            <QuickActionsPanel />
          </section>
        </div>
      </Layout>
    </RequireAuth>
  );
}

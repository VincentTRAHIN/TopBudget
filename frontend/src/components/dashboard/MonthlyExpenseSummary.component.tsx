"use client";

import { useUpcomingCharges } from "@/hooks/useUpcomingCharges.hook";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";

import { useMonthlyComparison } from "../../hooks/useMonthlyComparison.hook";
import { WidgetMonthResume } from "../widget/monthResume";
import { WidgetSparkGraph } from "../widget/sparkGraph";

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

/**
 * Composant MonthlyExpenseSummary
 *
 * Affiche un résumé financier du mois en cours avec :
 * - Revenus du mois
 * - Dépenses du mois
 * - Solde (revenus - dépenses)
 * - Variation par rapport au mois précédent
 * - Mini sparkline Chart.js pour visualiser la tendance
 *
 * @example
 * ```tsx
 * <MonthlyExpenseSummary />
 * ```
 */
export default function MonthlyExpenseSummary() {
  // Récupération des données financières
  const {
    data: depensesData,
    isLoading: depensesLoading,
    isError: depensesError,
  } = useMonthlyComparison("moi", "depenses");

  const {
    data: revenusData,
    isLoading: revenusLoading,
    isError: revenusError,
  } = useMonthlyComparison("moi", "revenus");

  const { data: soldeData, isLoading: soldeLoading, isError: soldeError } = useMonthlyComparison("moi", "solde");

  const { remainingToPay } = useUpcomingCharges();
  const isLoading = depensesLoading || revenusLoading || soldeLoading;
  const isError = depensesError || revenusError || soldeError;

  // État loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="h-24 bg-gray-100 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  // État error
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">Erreur lors du chargement des données</p>
          <p className="text-gray-500 text-sm mt-2">Veuillez réessayer plus tard</p>
        </div>
      </div>
    );
  }

  // Extraction des données
  const depensesMois = depensesData?.totalMoisActuel || 0;
  const revenusMois = revenusData?.totalMoisActuel || 0;
  const soldeMois = soldeData?.totalMoisActuel || 0;

  const soldePrecedent = soldeData?.totalMoisPrecedent || 0;

  // Calcul des variations
  const variationDepenses = depensesData?.difference || 0;
  const variationRevenus = revenusData?.difference || 0;
  const variationSolde = soldeData?.difference || 0;

  // Données pour le mini sparkline
  const sparklineData = {
    labels: ["Mois précédent", "Mois actuel"],
    datasets: [
      {
        label: "Solde",
        data: [soldePrecedent, soldeMois],
        borderColor: soldeMois >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
        backgroundColor: soldeMois >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const sparklineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${(context.parsed.y || 0).toFixed(2)}€`,
        },
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Résumé du mois</h3>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPIs */}
      <div className="space-y-4 mb-6">
        {/* Revenus */}
        <WidgetMonthResume amount={revenusMois} title="Revenus" variationAmount={variationRevenus} color="green" />
        {/* Dépenses */}
        <WidgetMonthResume amount={depensesMois} title="Dépenses" variationAmount={variationDepenses} color="red" />
        {/* Solde */}
        <WidgetMonthResume
          amount={soldeMois}
          title="Solde"
          variationAmount={variationSolde}
          color={soldeMois >= 0 ? "indigo" : "orange"}
        />
        <WidgetMonthResume
          amount={soldeMois - remainingToPay}
          title="Solde après toutes dépenses"
          variationAmount={variationSolde}
          color="orange"
        />
      </div>

      {/* Mini Sparkline */}
      <WidgetSparkGraph data={sparklineData} />
    </div>
  );
}

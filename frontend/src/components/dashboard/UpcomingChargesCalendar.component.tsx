"use client";

import { DynamicIcon } from "lucide-react/dynamic";

import { useUpcomingCharges } from "../../hooks/useUpcomingCharges.hook";
import { AmountResume } from "../widget/amountResume";

/**
 * Formate un montant en devise (EUR)
 */
const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}€`;
};

/**
 * Composant UpcomingChargesCalendar
 *
 * Affiche la liste des charges fixes du mois en cours avec leur statut :
 * - ✅ Charges payées (vert)
 * - ⏳ Charges à venir (ambre/orange)
 *
 * Répond à la question clé : "Combien me reste-t-il à payer ce mois-ci ?"
 *
 * Fonctionnalités :
 * - Liste interactive des charges fixes
 * - Distinction visuelle payé/à venir
 * - Totaux : payé, à venir, reste à payer
 * - États : loading, error, empty
 *
 * @example
 * ```tsx
 * <UpcomingChargesCalendar />
 * ```
 */
export default function UpcomingChargesCalendar() {
  const { paid, upcoming, totalPaid, totalUpcoming, remainingToPay, isLoading, isError } = useUpcomingCharges();

  // État loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // État error
  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">Erreur lors du chargement des charges fixes</p>
          <p className="text-gray-500 text-sm mt-2">Veuillez réessayer plus tard</p>
        </div>
      </div>
    );
  }

  // État empty - aucune charge fixe
  const hasCharges = paid.length > 0 || upcoming.length > 0;

  if (!hasCharges) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Charges fixes du mois</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune charge fixe pour ce mois</p>
          <p className="text-gray-400 text-sm mt-2">Les charges récurrentes apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Charges fixes du mois</h3>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-green-600">
              <DynamicIcon name="circle-check-big" size={22} />
              <span className="font-medium">Payé</span>
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <DynamicIcon name="clock" size={22} />
              <span className="font-medium">À venir</span>
            </span>
          </div>
        </div>
      </div>

      {/* Liste des charges payées */}
      {paid.length > 0 && <AmountResume color="green" paid charges={paid} title="Charges payées" />}
      {/* Liste des charges à venir */}
      {upcoming.length > 0 && <AmountResume color="amber" paid charges={upcoming} title="Charges à venir" />}

      {/* Résumé des totaux */}
      <div className="pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {/* Total payé */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total payé</span>
            <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
          </div>

          {/* Total à venir */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total à venir</span>
            <span className="font-semibold text-amber-600">{formatCurrency(totalUpcoming)}</span>
          </div>

          {/* Reste à payer (highlight) */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
            <span className="font-medium text-gray-800">Reste à payer</span>
            <span className="text-xl font-bold text-indigo-600">{formatCurrency(remainingToPay)}</span>
          </div>
        </div>
      </div>

      {/* Message incitatif si charges à venir */}
      {upcoming.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <span className="font-medium">{upcoming.length}</span> charge{upcoming.length > 1 ? "s" : ""} fixe
            {upcoming.length > 1 ? "s" : ""} à prévoir ce mois
          </p>
        </div>
      )}
    </div>
  );
}

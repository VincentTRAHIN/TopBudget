"use client";

import { useCurrentMonthTotal } from "@/hooks/useCurrentMonthTotal.hook";

export default function TotalDepenses() {
  const { total, isLoading, isError } = useCurrentMonthTotal();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px]">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px]">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Dépenses du Mois</h3>
        <p className="text-red-500">Erreur de chargement.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px]">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Dépenses du Mois en Cours</h3>
      <p className="text-3xl font-bold text-indigo-600">{total.toFixed(2)} €</p>
    </div>
  );
}

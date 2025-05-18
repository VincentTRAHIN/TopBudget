'use client';

import { useCurrentMonthFlows } from '@/hooks/useCurrentMonthTotal.hook';

export default function TotalFlows() {
  const { totalDepenses, totalRevenus, solde, isLoading, isError } =
    useCurrentMonthFlows();

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
        <h3 className="text-lg font-semibold mb-2 text-gray-700">
          Flux du Mois
        </h3>
        <p className="text-red-500">Erreur de chargement.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px] gap-4">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-1 text-gray-700">
          Dépenses du Mois
        </h3>
        <p className="text-2xl font-bold text-red-600">
          {totalDepenses.toFixed(2)} €
        </p>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-1 text-gray-700">
          Revenus du Mois
        </h3>
        <p className="text-2xl font-bold text-green-600">
          {totalRevenus.toFixed(2)} €
        </p>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-1 text-gray-700">
          Solde du Mois
        </h3>
        <p
          className={`text-2xl font-bold ${solde >= 0 ? 'text-indigo-600' : 'text-red-600'}`}
        >
          {solde.toFixed(2)} €
        </p>
      </div>
    </div>
  );
}

"use client";

import { useDepenses } from "@/hooks/useDepenses.hook";

export default function TotalDepenses() {
  const { depenses, isLoading } = useDepenses();

  const totalCalculated = depenses.reduce((acc, curr) => acc + curr.montant, 0);


  if (isLoading) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px]">
          <p className="text-gray-500">Chargement...</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center min-h-[100px]">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Dépenses (Page)</h3>
      <p className="text-3xl font-bold text-indigo-600">{totalCalculated.toFixed(2)} €</p>
    </div>
  );
}

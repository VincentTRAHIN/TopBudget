"use client";

import { useDepenses } from "@/hooks/useDepenses.hook";

export default function TotalDepenses() {
  const { depenses, isLoading } = useDepenses();

  const total = depenses.reduce((acc, curr) => acc + curr.montant, 0);

  if (isLoading) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-2">Total Dépenses</h3>
      <p className="text-3xl font-bold text-primary">{total.toFixed(2)} €</p>
    </div>
  );
}

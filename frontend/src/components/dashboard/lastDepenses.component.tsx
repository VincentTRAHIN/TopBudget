"use client";

import { useDepenses } from "@/hooks/useDepenses.hook";

export default function LastDepenses() {
  const { depenses, isLoading } = useDepenses();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const derniereDepenses = depenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Dernières dépenses</h3>
      <ul className="space-y-2">
        {derniereDepenses.map((depense) => (
          <li key={depense._id} className="flex justify-between">
            <span>{new Date(depense.date).toLocaleDateString("fr-FR")}</span>
            <span className="font-bold">{depense.montant.toFixed(2)} €</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

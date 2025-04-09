import { useDepenses } from "@/hooks/useDepenses.hook";
import { useState } from "react";

export default function TableDepenses() {
  const { depenses, isLoading, isError } = useDepenses();
  const [search, setSearch] = useState("");

  const filtredDepenses = depenses.filter((depense) =>
    (depense.commentaire?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (typeof depense.categorie !== "string" && depense.categorie.nom.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) {
    return <div>Chargement des dépenses...</div>;
  }

  if (isError) {
    return <div>Erreur lors de la récupération des dépenses.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Mes dépenses</h3>
        <input
          type="text"
          placeholder="Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 w-1/3"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Montant</th>
              <th className="text-left px-4 py-2">Type de Compte</th>
              <th className="text-left px-4 py-2">Catégorie</th>
              <th className="text-left px-4 py-2">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {filtredDepenses.map((depense) => (
              <tr key={depense._id} className="border-b">
                <td className="px-4 py-2">{new Date(depense.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-2 font-semibold">{depense.montant.toFixed(2)} €</td>
                <td className="px-4 py-2">{depense.typeCompte}</td>
                <td className="px-4 py-2">
                  {typeof depense.categorie !== "string" ? depense.categorie.nom : ""}
                </td>
                <td className="px-4 py-2">{depense.commentaire}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSyntheseMensuelle, SyntheseCoupleResponse, SyntheseMoiResponse } from "@/hooks/useSyntheseMensuelle.hook";
import { useAuth } from "@/hooks/useAuth.hook";

interface SyntheseMensuelleProps {
  contexte: "moi" | "couple";
}

export default function SyntheseMensuelle({ contexte }: SyntheseMensuelleProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const { data, isLoading, isError } = useSyntheseMensuelle(selectedYear, selectedMonth, contexte);
  const { user } = useAuth();

  // Pour affichage des noms
  const nomMoi = user?.nom || "Moi";
  const nomPartenaire = typeof user?.partenaireId === "object" && user?.partenaireId?.nom ? user.partenaireId.nom : "Partenaire";

  // Helper pour formatage
  const formatEuros = (n: number) => `${n.toFixed(2)} €`;
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto text-gray-800">
      <h3 className="text-xl font-semibold mb-6 text-center text-gray-700">Synthèse Mensuelle</h3>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center items-center">
        <div>
          <label htmlFor="mois-select-synthese" className="mr-2 text-sm font-medium text-gray-600">Mois :</label>
          <select id="mois-select-synthese" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="input border-gray-300 rounded-md px-3 py-2 w-full sm:w-32 focus:ring-2 focus:ring-indigo-500 text-gray-700">
            {monthNames.map((name, i) => (
              <option key={i+1} value={i+1} className="text-gray-700">{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee-select-synthese" className="mr-2 text-sm font-medium text-gray-600">Année :</label>
          <select id="annee-select-synthese" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="input border-gray-300 rounded-md px-3 py-2 w-full sm:w-28 focus:ring-2 focus:ring-indigo-500 text-gray-700">
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y} className="text-gray-700">{y}</option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && <p className="text-center py-4 text-gray-500">Chargement...</p>}
      {isError && <p className="text-center py-4 text-red-500">Erreur lors du chargement des données.</p>}
      {!isLoading && !isError && !data && <p className="text-center py-4 text-gray-500">Aucune donnée disponible pour cette période.</p>}
      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {contexte === 'moi' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="mb-2"><span className="font-semibold text-gray-700">Vos dépenses personnelles :</span> {formatEuros((data as SyntheseMoiResponse).totaux.personnelles)}</p>
              <p><span className="font-semibold text-gray-700">Dépenses communes payées par vous :</span> {formatEuros((data as SyntheseMoiResponse).totaux.communesPayeesParMoi)}</p>
            </div>
          )}
          {contexte === 'couple' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="mb-2"><span className="font-semibold text-gray-700">Dépenses personnelles {nomMoi} :</span> {formatEuros((data as SyntheseCoupleResponse).totaux.personnellesMoi)}</p>
              <p className="mb-2"><span className="font-semibold text-gray-700">Dépenses personnelles {nomPartenaire} :</span> {formatEuros((data as SyntheseCoupleResponse).totaux.personnellesPartenaire)}</p>
              <p><span className="font-semibold text-gray-700">Total dépenses communes du couple :</span> {formatEuros((data as SyntheseCoupleResponse).totaux.communesCouple)}</p>
            </div>
          )}
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-3 text-red-700">Catégories en Forte Hausse :</h4>
            {data.categoriesEnHausse.length === 0 ? (
              <p className="text-gray-500">Aucune catégorie en forte hausse ce mois-ci.</p>
            ) : (
              <ul className="space-y-2">
                {data.categoriesEnHausse.map(cat => (
                  <li key={cat.categorieId} className="p-3 bg-red-100 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-800">{cat.nom}</span>
                      <span className="text-sm font-semibold text-red-600">+{cat.variationValeur.toFixed(2)} € ({cat.variationPourcent.toFixed(1)}%)</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { useCoupleContributionsSummary } from '@/hooks/useCoupleContributionsSummary.hook';

export default function CoupleContributionsSummary() {
  const today = new Date();
  const [annee, setAnnee] = useState<string>(today.getFullYear().toString());
  const [mois, setMois] = useState<string>((today.getMonth() + 1).toString().padStart(2, '0'));
  const { data, isLoading, isError } = useCoupleContributionsSummary(annee, mois);

  let message = '';
  if (data) {
    if (data.ecartUtilisateurActuel < 0) {
      message = `Vous devez ${Math.abs(data.ecartUtilisateurActuel).toFixed(2)}€ à votre partenaire`;
    } else if (data.ecartUtilisateurActuel > 0) {
      message = `Votre partenaire vous doit ${data.ecartUtilisateurActuel.toFixed(2)}€`;
    } else {
      message = 'Les contributions sont équilibrées ce mois-ci.';
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Résumé des Contributions du Couple</h3>
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="mois-select" className="mr-2">Mois :</label>
          <select id="mois-select" value={mois} onChange={e => setMois(e.target.value)} className="input w-24">
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={(i+1).toString().padStart(2, '0')}>
                {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee-select" className="mr-2">Année :</label>
          <select id="annee-select" value={annee} onChange={e => setAnnee(e.target.value)} className="input w-24">
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && <p>Chargement...</p>}
      {isError && <p className="text-red-500">Erreur lors du chargement des données.</p>}
      {data && (
        <div className="space-y-2">
          <p><span className="font-medium">Total des dépenses communes :</span> {data.totalDepensesCommunes.toFixed(2)}€</p>
          <p><span className="font-medium">Votre contribution :</span> {data.contributionUtilisateurActuel.toFixed(2)}€</p>
          <p><span className="font-medium">Contribution de votre partenaire :</span> {data.contributionPartenaire.toFixed(2)}€</p>
          <p className="mt-2 font-semibold text-blue-700">{message}</p>
        </div>
      )}
    </div>
  );
}

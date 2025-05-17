'use client';

import React, { useState } from 'react';
import { useCoupleFixedCharges } from '@/hooks/useCoupleFixedCharges.hook';

export default function CoupleFixedChargesList() {
  const today = new Date();
  const [annee, setAnnee] = useState<string>(today.getFullYear().toString());
  const [mois, setMois] = useState<string>(
    (today.getMonth() + 1).toString().padStart(2, '0'),
  );
  const { data, isLoading, isError } = useCoupleFixedCharges(annee, mois);

  // Gestion loading
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        <h3 className="text-lg font-semibold mb-4">Charges Fixes Communes</h3>
        <div className="mb-4 flex gap-4 justify-center">
          <div>
            <label htmlFor="mois-select-charges" className="mr-2">
              Mois :
            </label>
            <select
              id="mois-select-charges"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="input w-24"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="annee-select-charges" className="mr-2">
              Année :
            </label>
            <select
              id="annee-select-charges"
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="input w-24"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p>Chargement...</p>
      </div>
    );
  }

  // Gestion erreur
  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500">
        <h3 className="text-lg font-semibold mb-4">Charges Fixes Communes</h3>
        <div className="mb-4 flex gap-4 justify-center">
          <div>
            <label htmlFor="mois-select-charges" className="mr-2">
              Mois :
            </label>
            <select
              id="mois-select-charges"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="input w-24"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="annee-select-charges" className="mr-2">
              Année :
            </label>
            <select
              id="annee-select-charges"
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="input w-24"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p>Erreur lors du chargement des données des charges fixes.</p>
      </div>
    );
  }

  // Gestion absence de données
  if (!data || !data.listeChargesFixes) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        <h3 className="text-lg font-semibold mb-4">Charges Fixes Communes</h3>
        <div className="mb-4 flex gap-4 justify-center">
          <div>
            <label htmlFor="mois-select-charges" className="mr-2">
              Mois :
            </label>
            <select
              id="mois-select-charges"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="input w-24"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="annee-select-charges" className="mr-2">
              Année :
            </label>
            <select
              id="annee-select-charges"
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="input w-24"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p>Aucune donnée de charge fixe disponible pour cette période.</p>
      </div>
    );
  }

  // Rendu principal si data et data.listeChargesFixes existent
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Charges Fixes Communes</h3>
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="mois-select-charges" className="mr-2">
            Mois :
          </label>
          <select
            id="mois-select-charges"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            className="input w-24"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee-select-charges" className="mr-2">
            Année :
          </label>
          <select
            id="annee-select-charges"
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            className="input w-24"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Description
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Montant
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Catégorie
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Payé par
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.listeChargesFixes.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-2 text-center text-gray-400">
                Aucune charge fixe commune pour cette période.
              </td>
            </tr>
          )}
          {data.listeChargesFixes.map((charge) => (
            <tr
              key={
                charge._id ||
                `${charge.description}-${charge.montant}-${charge.payePar}`
              }
            >
              <td className="px-4 py-2">{charge.description}</td>
              <td className="px-4 py-2">{charge.montant.toFixed(2)}€</td>
              <td className="px-4 py-2">
                {typeof charge.categorie === 'string'
                  ? charge.categorie
                  : charge.categorie?.nom || 'N/A'}
              </td>
              <td className="px-4 py-2">{charge.payePar}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="font-semibold text-right">
        Total des charges fixes communes :{' '}
        {data.totalChargesFixesCommunes.toFixed(2)}€
      </div>
    </div>
  );
}

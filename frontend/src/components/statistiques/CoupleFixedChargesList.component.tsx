"use client";

import React, { useState } from 'react';
import { useCoupleFixedCharges } from '@/hooks/useCoupleFixedCharges.hook';

export default function CoupleFixedChargesList() {
  const today = new Date();
  const [annee, setAnnee] = useState<string>(today.getFullYear().toString());
  const [mois, setMois] = useState<string>((today.getMonth() + 1).toString().padStart(2, '0'));
  const { data, isLoading, isError } = useCoupleFixedCharges(annee, mois);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Charges Fixes Communes</h3>
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="mois-select-charges" className="mr-2">Mois :</label>
          <select id="mois-select-charges" value={mois} onChange={e => setMois(e.target.value)} className="input w-24">
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={(i+1).toString().padStart(2, '0')}>
                {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="annee-select-charges" className="mr-2">Année :</label>
          <select id="annee-select-charges" value={annee} onChange={e => setAnnee(e.target.value)} className="input w-24">
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && <p>Chargement...</p>}
      {isError && <p className="text-red-500">Erreur lors du chargement des données.</p>}
      {data && (
        <>
          <table className="min-w-full divide-y divide-gray-200 mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payé par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.chargesFixes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-gray-400">Aucune charge fixe commune pour cette période.</td>
                </tr>
              )}
              {data.chargesFixes.map(charge => (
                <tr key={charge._id}>
                  <td className="px-4 py-2">{charge.description}</td>
                  <td className="px-4 py-2">{charge.montant.toFixed(2)}€</td>
                  <td className="px-4 py-2">{typeof charge.categorie === 'string' ? charge.categorie : charge.categorie.nom}</td>
                  <td className="px-4 py-2">{charge.payePar}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="font-semibold text-right">
            Total des charges fixes communes : {data.totalChargesFixesCommunes.toFixed(2)}€
          </div>
        </>
      )}
    </div>
  );
}

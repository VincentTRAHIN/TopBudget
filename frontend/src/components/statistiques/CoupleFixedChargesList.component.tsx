'use client';

import React, { useState, useMemo } from 'react';
import { useCoupleFixedCharges, CoupleFixedCharge } from '@/hooks/useCoupleFixedCharges.hook';
import { Table } from '../table';
import { DataType, DisplayType, TableColumn } from '../table/table.types';

export default function CoupleFixedChargesList() {
  const today = new Date();
  const [annee, setAnnee] = useState<string>(today.getFullYear().toString());
  const [mois, setMois] = useState<string>(
    (today.getMonth() + 1).toString().padStart(2, '0'),
  );
  const { data, isLoading, isError } = useCoupleFixedCharges(annee, mois);

  const columns = useMemo<TableColumn<CoupleFixedCharge>[]>(() => [
    {
      header: 'Description',
      accessor: 'description',
      dataType: DataType.STRING,
      enableSort: true,
      className: 'font-medium',
    },
    {
      header: 'Catégorie',
      accessor: 'categorie',
      dataType: DataType.STRING,
      getValue: (row) => {
        if (typeof row.categorie === 'string') return row.categorie;
        return row.categorie?.nom || 'Non catégorisé';
      },
      enableSort: true,
    },
    {
      header: 'Montant',
      accessor: 'montant',
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
      enableSort: true,
      className: 'text-right font-semibold',
    },
    {
      header: 'Payé par',
      accessor: 'payePar',
      dataType: DataType.STRING,
      enableSort: true,
      className: 'text-center',
    },
  ], []);

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
      <Table
        data={data.listeChargesFixes}
        columns={columns}
        emptyRender={
          <div className="px-4 py-2 text-center text-gray-400">
            Aucune charge fixe commune pour cette période.
          </div>
        }
      />
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="font-semibold text-right text-lg text-gray-800">
          Total des charges fixes communes :{' '}
          <span className="text-indigo-600">
            {data.totalChargesFixesCommunes.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
}

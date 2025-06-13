'use client';

import { useDepenses } from '@/hooks/useDepenses.hook';
import { RefreshCw } from 'lucide-react';

export default function LastDepenses() {
  const { depenses, isLoading, isError, refreshDepenses } = useDepenses();

  const derniereDepenses = depenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Dernières dépenses</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Dernières dépenses</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-3 text-center">
            Erreur lors du chargement
          </p>
          <button
            onClick={() => refreshDepenses()}
            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Dernières dépenses</h3>
      {derniereDepenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm text-center">
            Aucune dépense enregistrée
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {derniereDepenses.map((depense) => (
            <li key={depense._id} className="flex justify-between items-center py-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{depense.description}</span>
                <span className="text-xs text-gray-500">
                  {new Date(depense.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <span className="font-bold text-red-600">{depense.montant.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

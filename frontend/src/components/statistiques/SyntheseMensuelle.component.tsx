'use client';

import { useState } from 'react';
import {
  useSyntheseMensuelle,
} from '@/hooks/useSyntheseMensuelle.hook';
import { useAuth } from '@/hooks/useAuth.hook';

interface SyntheseMensuelleProps {
  contexte: 'moi' | 'couple';
}

export default function SyntheseMensuelle({
  contexte,
}: SyntheseMensuelleProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    today.getMonth() + 1,
  );
  const { data, isLoading, isError } = useSyntheseMensuelle(
    selectedYear,
    selectedMonth,
    contexte,
  );
  const { user } = useAuth();

  const nomMoi = user?.nom || 'Moi';
  const nomPartenaire =
    typeof user?.partenaireId === 'object' && user?.partenaireId?.nom
      ? user.partenaireId.nom
      : 'Partenaire';

  const formatEuros = (n: number) => `${n.toFixed(2)} €`;
  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const processedData = data ? {
    ...data,
    totaux: data.totaux || (contexte === 'moi' ? 
      {
        personnelles: data.utilisateurPrincipal?.depenses || 0,
        communesPayeesParMoi: 0, 
      } : {
        personnellesMoi: data.utilisateurPrincipal?.depenses || 0,
        personnellesPartenaire: data.partenaire?.depenses || 0,
        communesCouple: 0,
      })
  } : null;

  const hasDataContent = processedData && (
    processedData.soldeGlobal || 
    processedData.utilisateurPrincipal || 
    processedData.partenaire || 
    (processedData.categoriesEnHausse && processedData.categoriesEnHausse.length > 0)
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto text-gray-800">
      <h3 className="text-xl font-semibold mb-6 text-center text-gray-700">
        Synthèse Mensuelle
      </h3>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center items-center">
        <div>
          <label
            htmlFor="mois-select-synthese"
            className="mr-2 text-sm font-medium text-gray-600"
          >
            Mois :
          </label>
          <select
            id="mois-select-synthese"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input border-gray-300 rounded-md px-3 py-2 w-full sm:w-32 focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1} className="text-gray-700">
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="annee-select-synthese"
            className="mr-2 text-sm font-medium text-gray-600"
          >
            Année :
          </label>
          <select
            id="annee-select-synthese"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input border-gray-300 rounded-md px-3 py-2 w-full sm:w-28 focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y} className="text-gray-700">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading && (
        <p className="text-center py-4 text-gray-500">Chargement...</p>
      )}
      {isError && (
        <p className="text-center py-4 text-red-500">
          Erreur lors du chargement des données.
        </p>
      )}
      {!isLoading && !isError && !hasDataContent && (
        <p className="text-center py-4 text-gray-500">
          Aucune donnée disponible pour cette période.
        </p>
      )}
      {!isLoading && !isError && hasDataContent && (
        <div className="space-y-6">
          {contexte === 'moi' && processedData?.utilisateurPrincipal && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Vos dépenses personnelles :
                </span>{' '}
                {formatEuros(processedData.utilisateurPrincipal.depenses)}
              </p>
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Vos revenus :
                </span>{' '}
                {formatEuros(processedData.utilisateurPrincipal.revenus)}
              </p>
              <p>
                <span className="font-semibold text-gray-700">
                  Votre solde pour ce mois :
                </span>{' '}
                {formatEuros(processedData.utilisateurPrincipal.solde)}
              </p>
            </div>
          )}
          {contexte === 'couple' && processedData?.utilisateurPrincipal && processedData?.partenaire && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Dépenses personnelles {nomMoi} :
                </span>{' '}
                {formatEuros(processedData.utilisateurPrincipal.depenses)}
              </p>
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Dépenses personnelles {nomPartenaire} :
                </span>{' '}
                {formatEuros(processedData.partenaire.depenses)}
              </p>
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Revenus {nomMoi} :
                </span>{' '}
                {formatEuros(processedData.utilisateurPrincipal.revenus)}
              </p>
              <p className="mb-2">
                <span className="font-semibold text-gray-700">
                  Revenus {nomPartenaire} :
                </span>{' '}
                {formatEuros(processedData.partenaire.revenus)}
              </p>
              {processedData.soldeGlobal && (
                <p>
                  <span className="font-semibold text-gray-700">
                    Solde global du couple :
                  </span>{' '}
                  {formatEuros(processedData.soldeGlobal.solde)}
                </p>
              )}
            </div>
          )}
          {processedData?.categoriesEnHausse && processedData.categoriesEnHausse.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 text-red-700">
                Catégories en Forte Hausse :
              </h4>
              <ul className="space-y-2">
                {processedData.categoriesEnHausse.map((cat) => (
                  <li
                    key={cat.categorieId}
                    className="p-3 bg-red-100 rounded-md"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-800">
                        {cat.nom}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        +{cat.variationValeur.toFixed(2)} € (
                        {cat.variationPourcent.toFixed(1)}%)
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const formatPourcentage = (n: number) => `${n.toFixed(1)}%`;
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

  const selectedMonthName = monthNames[selectedMonth - 1];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto text-gray-800">
      <h3 className="text-xl font-semibold mb-6 text-center text-gray-700">
        Synthèse Mensuelle - {selectedMonthName} {selectedYear}
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
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Chargement de la synthèse...</p>
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">
              Erreur lors du chargement des données.
            </p>
            <p className="text-red-500 text-sm mt-1">
              Veuillez réessayer plus tard.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && !hasDataContent && (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 font-medium">
              Aucune donnée disponible pour cette période.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Essayez de sélectionner un autre mois ou vérifiez vos données.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && hasDataContent && (
        <div className="space-y-6">
          {/* Solde Global Section */}
          {processedData?.soldeGlobal && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-4">
                {contexte === 'couple' ? 'Bilan Global du Couple' : 'Votre Bilan Global'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Revenus Totaux</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatEuros(processedData.soldeGlobal.totalRevenus)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Dépenses Totales</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatEuros(processedData.soldeGlobal.totalDepenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Solde Net</p>
                  <p className={`text-xl font-bold ${
                    processedData.soldeGlobal.solde >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatEuros(processedData.soldeGlobal.solde)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual User Data for 'moi' context */}
          {contexte === 'moi' && processedData?.utilisateurPrincipal && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Vos Finances Personnelles
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dépenses Personnelles</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatEuros(processedData.utilisateurPrincipal.depenses)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenus</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatEuros(processedData.utilisateurPrincipal.revenus)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Solde Personnel</p>
                  <p className={`text-lg font-semibold ${
                    processedData.utilisateurPrincipal.solde >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatEuros(processedData.utilisateurPrincipal.solde)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Couple Data for 'couple' context */}
          {contexte === 'couple' && processedData?.utilisateurPrincipal && processedData?.partenaire && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Détail par Partenaire
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Principal */}
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-3">{nomMoi}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dépenses:</span>
                      <span className="font-medium text-red-600">
                        {formatEuros(processedData.utilisateurPrincipal.depenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenus:</span>
                      <span className="font-medium text-green-600">
                        {formatEuros(processedData.utilisateurPrincipal.revenus)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">Solde:</span>
                      <span className={`font-semibold ${
                        processedData.utilisateurPrincipal.solde >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatEuros(processedData.utilisateurPrincipal.solde)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Partner */}
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-3">{nomPartenaire}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dépenses:</span>
                      <span className="font-medium text-red-600">
                        {formatEuros(processedData.partenaire.depenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenus:</span>
                      <span className="font-medium text-green-600">
                        {formatEuros(processedData.partenaire.revenus)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">Solde:</span>
                      <span className={`font-semibold ${
                        processedData.partenaire.solde >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatEuros(processedData.partenaire.solde)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ratios for couple */}
              {processedData.ratioDependes && processedData.ratioRevenus && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <h6 className="font-medium text-gray-700 mb-2">Répartition des Dépenses</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{nomMoi}:</span>
                        <span className="font-medium">{formatPourcentage(processedData.ratioDependes.utilisateurPrincipal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nomPartenaire}:</span>
                        <span className="font-medium">{formatPourcentage(processedData.ratioDependes.partenaire)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <h6 className="font-medium text-gray-700 mb-2">Répartition des Revenus</h6>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{nomMoi}:</span>
                        <span className="font-medium">{formatPourcentage(processedData.ratioRevenus.utilisateurPrincipal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nomPartenaire}:</span>
                        <span className="font-medium">{formatPourcentage(processedData.ratioRevenus.partenaire)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories en Hausse Section */}
          {processedData?.categoriesEnHausse && processedData.categoriesEnHausse.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <h4 className="text-lg font-semibold text-red-800">
                  Catégories en Forte Hausse
                </h4>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Catégories avec une augmentation significative par rapport au mois précédent
              </p>
              <div className="space-y-3">
                {processedData.categoriesEnHausse.map((cat, index) => (
                  <div
                    key={cat.categorieId}
                    className="bg-white rounded-lg p-4 border border-red-100 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 text-xs font-medium rounded-full mr-3">
                            {index + 1}
                          </span>
                          <h5 className="font-medium text-gray-900">{cat.nom}</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Mois précédent:</p>
                            <p className="font-medium text-gray-800">
                              {formatEuros(cat.totalMoisPrecedent)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Mois actuel:</p>
                            <p className="font-medium text-gray-800">
                              {formatEuros(cat.totalMoisActuel)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="bg-red-100 rounded-lg px-3 py-2">
                          <p className="text-sm font-semibold text-red-800">
                            +{formatEuros(cat.variationValeur)}
                          </p>
                          <p className="text-xs text-red-600">
                            (+{formatPourcentage(cat.variationPourcent)})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {processedData.categoriesEnHausse.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-red-600">
                    {processedData.categoriesEnHausse.length} catégorie(s) en hausse détectée(s)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Categories en Hausse Message */}
          {processedData?.categoriesEnHausse && processedData.categoriesEnHausse.length === 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <p className="text-green-800 font-medium">
                  Aucune catégorie en forte hausse détectée
                </p>
              </div>
              <p className="text-sm text-green-700 mt-1 ml-6">
                Vos dépenses sont restées stables par rapport au mois précédent.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

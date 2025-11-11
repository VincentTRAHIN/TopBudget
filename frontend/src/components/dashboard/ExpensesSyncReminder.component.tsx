"use client";

import { useLastSync } from "../../hooks/useLastSync.hook";

/**
 * Icône SVG AlertCircle
 */
const AlertCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/**
 * Icône SVG Upload
 */
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/**
 * Icône SVG PlusCircle
 */
const PlusCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

/**
 * Composant ExpensesSyncReminder
 *
 * Affiche un rappel de synchronisation lorsque l'utilisateur n'a pas enregistré
 * de dépense ou revenu depuis plus de 7 jours.
 *
 * Fonctionnalités :
 * - Détection automatique via le hook useLastSync
 * - Affichage du nombre de jours depuis la dernière activité
 * - Boutons d'action rapide : Import CSV et Ajout de dépense
 * - Masquage automatique si les données sont à jour
 *
 * @example
 * ```tsx
 * <ExpensesSyncReminder />
 * ```
 */
export default function ExpensesSyncReminder() {
  const { daysSinceLastActivity, needsUpdate, isLoading, isError } = useLastSync();

  // Ne rien afficher si les données sont en cours de chargement
  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="bg-gray-100 rounded-lg h-24 w-full"></div>
      </div>
    );
  }

  // Ne rien afficher en cas d'erreur (silencieux)
  if (isError) {
    return null;
  }

  // Ne rien afficher si la synchronisation est à jour
  if (!needsUpdate) {
    return null;
  }

  return (
    <div
      className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm"
      role="alert"
      aria-live="polite"
      aria-labelledby="sync-reminder-title">
      <div className="flex items-start">
        {/* Icône d'alerte */}
        <div className="flex-shrink-0 text-amber-600">
          <AlertCircleIcon />
        </div>

        {/* Contenu */}
        <div className="ml-4 flex-1">
          <h3 id="sync-reminder-title" className="text-lg font-semibold text-amber-800 mb-2">
            Rappel de synchronisation
          </h3>
          <p className="text-amber-700 mb-4">
            Cela fait{" "}
            <span className="font-bold">
              {daysSinceLastActivity} jour{daysSinceLastActivity! > 1 ? "s" : ""}
            </span>{" "}
            que vous n'avez pas enregistré de dépenses ou de revenus. Pensez à mettre à jour vos données pour une
            meilleure visibilité financière.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            {/* Bouton Import CSV */}
            <a
              href="/depenses?action=import"
              className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Importer des dépenses depuis un fichier CSV">
              <span className="mr-2" aria-hidden="true">
                <UploadIcon />
              </span>
              Importer CSV
            </a>

            {/* Bouton Ajouter dépense */}
            <a
              href="/depenses?action=add"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-amber-700 font-medium border-2 border-amber-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Ajouter une nouvelle dépense">
              <span className="mr-2" aria-hidden="true">
                <PlusCircleIcon />
              </span>
              Ajouter une dépense
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

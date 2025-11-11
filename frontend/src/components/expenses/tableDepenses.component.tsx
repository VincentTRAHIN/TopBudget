"use client";

import { DepenseFilters } from "@/hooks/useDepenses.hook";
import { ICategorie } from "@/types/categorie.type";
import { TYPE_COMPTE_OPTIONS, TYPE_DEPENSE_OPTIONS } from "@/types/common.type";
import { IDepense } from "@/types/depense.type";
import debug from "debug";
import { useCallback, useState } from "react";
import React from "react";

import { Table } from "../table";
import { useColumns } from "./useColumns";

const log = debug("app:frontend:TableDepenses");

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: Partial<DepenseFilters>) => void;
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
  currentSortKey?: string;
  currentSortOrder?: "asc" | "desc";
  currentUserId?: string;
  partenaireId?: string;
  currentFilters: DepenseFilters;
  refreshDepenses: any; // KeyedMutator depuis SWR
}

function TableDepenses({
  depenses = [],
  categories = [],
  onEdit,
  onFilterChange,
  onSortChange,
  currentSortKey,
  currentSortOrder,
  currentUserId,
  currentFilters,
  refreshDepenses,
}: TableDepensesProps) {
  log("Composant TableDepenses rendu avec props: %O", {
    depenses,
    categories,
    currentUserId,
  });

  // État local pour l'input de recherche (non synchronisé jusqu'à la soumission)
  const [localSearchValue, setLocalSearchValue] = useState(currentFilters.search || "");

  // États locaux pour tous les autres filtres
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categorie || "");
  const [dateDebut, setDateDebut] = useState(currentFilters.dateDebut || "");
  const [dateFin, setDateFin] = useState(currentFilters.dateFin || "");
  const [typeCompte, setTypeCompte] = useState(currentFilters.typeCompte || "");
  const [typeDepense, setTypeDepense] = useState(currentFilters.typeDepense || "");

  const { actions, columns } = useColumns({
    currentUserId,
    onEdit,
    onFilterChange,
    refreshDepenses,
  });

  // Handlers pour les changements de filtres
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Appliquer UNIQUEMENT la recherche à la soumission
      onFilterChange({
        search: localSearchValue || undefined,
      });
    },
    [localSearchValue, onFilterChange],
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setSelectedCategory(value);
      // Appliquer immédiatement le filtre catégorie
      onFilterChange({ categorie: value || undefined });
    },
    [onFilterChange],
  );

  const handleDateDebutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDateDebut(value);
      // Appliquer immédiatement le filtre date début
      onFilterChange({ dateDebut: value || undefined });
    },
    [onFilterChange],
  );

  const handleDateFinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDateFin(value);
      // Appliquer immédiatement le filtre date fin
      onFilterChange({ dateFin: value || undefined });
    },
    [onFilterChange],
  );

  const handleTypeCompteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setTypeCompte(value);
      // Appliquer immédiatement le filtre type compte
      onFilterChange({ typeCompte: value || undefined });
    },
    [onFilterChange],
  );

  const handleTypeDepenseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setTypeDepense(value);
      // Appliquer immédiatement le filtre type dépense
      onFilterChange({ typeDepense: value || undefined });
    },
    [onFilterChange],
  );

  const handleResetFilters = useCallback(() => {
    setLocalSearchValue("");
    setSelectedCategory("");
    setDateDebut("");
    setDateFin("");
    setTypeCompte("");
    setTypeDepense("");
    // Réinitialiser immédiatement les filtres
    onFilterChange({
      search: undefined,
      categorie: undefined,
      typeCompte: undefined,
      typeDepense: undefined,
      dateDebut: undefined,
      dateFin: undefined,
    });
  }, [onFilterChange]);

  // Handlers pour réinitialiser individuellement chaque filtre
  const handleClearSearch = useCallback(() => {
    setLocalSearchValue("");
    onFilterChange({ search: undefined });
  }, [onFilterChange]);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory("");
    onFilterChange({ categorie: undefined });
  }, [onFilterChange]);

  const handleClearDateDebut = useCallback(() => {
    setDateDebut("");
    onFilterChange({ dateDebut: undefined });
  }, [onFilterChange]);

  const handleClearDateFin = useCallback(() => {
    setDateFin("");
    onFilterChange({ dateFin: undefined });
  }, [onFilterChange]);

  const handleClearTypeCompte = useCallback(() => {
    setTypeCompte("");
    onFilterChange({ typeCompte: undefined });
  }, [onFilterChange]);

  const handleClearTypeDepense = useCallback(() => {
    setTypeDepense("");
    onFilterChange({ typeDepense: undefined });
  }, [onFilterChange]);

  // Gérer le tri côté serveur
  const handleSortChange = useCallback(
    (sortBy: string, order: "asc" | "desc") => {
      if (onSortChange) {
        onSortChange(sortBy, order);
      }
    },
    [onSortChange],
  );

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Boolean(
    currentFilters.search || selectedCategory || dateDebut || dateFin || typeCompte || typeDepense,
  );

  // Plus besoin de useEffect pour synchroniser - tout se fait à la soumission

  return (
    <div className="space-y-4">
      {/* Section des Filtres */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded items-end">
        {/* Formulaire de recherche isolé */}
        <form onSubmit={handleSearchSubmit} className="flex-grow min-w-[150px]">
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="search"
              placeholder="Description, commentaire, catégorie..."
              value={localSearchValue}
              onChange={handleSearchChange}
              className="input pr-20"
              autoComplete="off"
            />
            {localSearchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-11 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1"
                title="Effacer la recherche">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors"
              title="Rechercher">
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
              <span className="sr-only">Rechercher</span>
            </button>
          </div>
        </form>

        {/* Autres filtres (déclenchement immédiat) */}
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <div className="relative">
            <select
              id="category-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="input pr-8">
              <option value="">Toutes</option>
              {Array.isArray(categories) &&
                categories.map((categorie) => (
                  <option key={categorie._id} value={categorie._id}>
                    {categorie.nom}
                  </option>
                ))}
            </select>
            {selectedCategory && (
              <button
                type="button"
                onClick={handleClearCategory}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1"
                title="Effacer la catégorie">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow min-w-[130px]">
          <label htmlFor="date-debut" className="block text-sm font-medium text-gray-700 mb-1">
            Du
          </label>
          <div className="relative">
            <input
              id="date-debut"
              type="date"
              value={dateDebut}
              onChange={handleDateDebutChange}
              className="input cursor-pointer pr-8"
              aria-label="Date de début"
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.currentTarget.showPicker?.();
              }}
            />
            {dateDebut && (
              <button
                type="button"
                onClick={handleClearDateDebut}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1 z-10"
                title="Effacer la date de début">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow min-w-[130px]">
          <label htmlFor="date-fin" className="block text-sm font-medium text-gray-700 mb-1">
            Au
          </label>
          <div className="relative">
            <input
              id="date-fin"
              type="date"
              value={dateFin}
              onChange={handleDateFinChange}
              className="input cursor-pointer pr-8"
              aria-label="Date de fin"
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.currentTarget.showPicker?.();
              }}
            />
            {dateFin && (
              <button
                type="button"
                onClick={handleClearDateFin}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1 z-10"
                title="Effacer la date de fin">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="type-compte-select" className="block text-sm font-medium text-gray-700 mb-1">
            Compte
          </label>
          <div className="relative">
            <select id="type-compte-select" value={typeCompte} onChange={handleTypeCompteChange} className="input pr-8">
              <option value="">Tous</option>
              {TYPE_COMPTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {typeCompte && (
              <button
                type="button"
                onClick={handleClearTypeCompte}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1"
                title="Effacer le type de compte">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="type-depense-select" className="block text-sm font-medium text-gray-700 mb-1">
            Type de dépense
          </label>
          <div className="relative">
            <select
              id="type-depense-select"
              value={typeDepense}
              onChange={handleTypeDepenseChange}
              className="input pr-8">
              <option value="">Tous</option>
              {TYPE_DEPENSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {typeDepense && (
              <button
                type="button"
                onClick={handleClearTypeDepense}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1"
                title="Effacer le type de dépense">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bouton de reset des filtres */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={hasActiveFilters ? "Réinitialiser tous les filtres" : "Aucun filtre actif"}>
            {hasActiveFilters ? "🗑️ Réinitialiser" : "🗑️ Pas de filtres"}
          </button>
        </div>
      </div>

      {/* Tableau des Dépenses */}
      <Table<IDepense>
        data={depenses}
        emptyRender={<div className="text-center py-4 text-gray-500">Aucune dépense trouvée.</div>}
        columns={columns}
        rowAction={actions}
        getRowClassName={(row) => (row.estChargeFixe ? "bg-green-50/30 hover:!bg-green-100/40" : "")}
        onSortChange={onSortChange}
        currentSortKey={currentSortKey}
        currentSortOrder={currentSortOrder}
      />
    </div>
  );
}

export default TableDepenses;

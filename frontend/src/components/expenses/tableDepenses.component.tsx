'use client';

import { useCallback, useEffect } from 'react';
import { IDepense } from '@/types/depense.type';
import { useDepenses, DepenseFilters } from '@/hooks/useDepenses.hook';
import { ICategorie } from '@/types/categorie.type';
import debug from 'debug';
import React from 'react';
import { Table } from '../table';
import { useColumns } from './useColumns';
import { TYPE_COMPTE_OPTIONS, TYPE_DEPENSE_OPTIONS } from '@/types/common.type';
import { useDepenseFilters } from '@/hooks/useTableFilters.hook';

const log = debug('app:frontend:TableDepenses');

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: Partial<DepenseFilters>) => void;
  currentUserId?: string;
  partenaireId?: string;
}

function TableDepenses({
  depenses = [],
  categories = [],
  onEdit,
  onFilterChange,
  currentUserId,
}: TableDepensesProps) {
  log('Composant TableDepenses rendu avec props: %O', {
    depenses,
    categories,
    currentUserId,
  });

  const { refreshDepenses } = useDepenses();
  const { 
    filters, 
    setFilter, 
    resetFilters, 
    hasActiveFilters 
  } = useDepenseFilters();

  const {
    actions,
    columns,
  } = useColumns({
    currentUserId,
    onEdit,
    onFilterChange,
    refreshDepenses
  })

  // Extraire les valeurs des filtres pour faciliter l'usage
  const {
    categorie: selectedCategory = '',
    typeCompte = '',
    typeDepense = '',
    dateDebut = '',
    dateFin = '',
    search = '',
    estChargeFixe = '',
  } = filters;


  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter('search', value);
  }, [setFilter]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilter('categorie', value);
  }, [setFilter]);

  const handleDateDebutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter('dateDebut', value);
  }, [setFilter]);

  const handleDateFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter('dateFin', value);
  }, [setFilter]);

  const handleTypeCompteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilter('typeCompte', value);
  }, [setFilter]);

  const handleTypeDepenseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilter('typeDepense', value);
  }, [setFilter]);

  const handleEstChargeFixeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilter('estChargeFixe', value);
  }, [setFilter]);

  // Synchroniser avec le parent quand les filtres changent
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onFilterChange({
        search: search || undefined,
        categorie: selectedCategory || undefined,
        typeCompte: typeCompte || undefined,
        typeDepense: typeDepense || undefined,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
        estChargeFixe: estChargeFixe || undefined,
      });
    }, 300); // Debounce pour éviter trop d'appels

    return () => clearTimeout(debounceTimeout);
  }, [search, selectedCategory, typeCompte, typeDepense, dateDebut, dateFin, estChargeFixe, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Section des Filtres */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded items-end">
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="search-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Recherche
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Description, commentaire..."
            value={search}
            onChange={handleSearchChange}
            className="input"
          />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Catégorie
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="input"
          >
            <option value="">Toutes</option>
            {Array.isArray(categories) &&
              categories.map((categorie) => (
                <option key={categorie._id} value={categorie._id}>
                  {categorie.nom}
                </option>
              ))}
          </select>
        </div>
        <div className="flex-grow min-w-[130px]">
          <label
            htmlFor="date-debut"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Du
          </label>
          <input
            id="date-debut"
            type="date"
            value={dateDebut}
            onChange={handleDateDebutChange}
            className="input"
            aria-label="Date de début"
          />
        </div>
        <div className="flex-grow min-w-[130px]">
          <label
            htmlFor="date-fin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Au
          </label>
          <input
            id="date-fin"
            type="date"
            value={dateFin}
            onChange={handleDateFinChange}
            className="input"
            aria-label="Date de fin"
          />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="type-compte-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Compte
          </label>
          <select
            id="type-compte-select"
            value={typeCompte}
            onChange={handleTypeCompteChange}
            className="input"
          >
            <option value="">Tous</option>
            {TYPE_COMPTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="type-depense-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type de dépense
          </label>
          <select
            id="type-depense-select"
            value={typeDepense}
            onChange={handleTypeDepenseChange}
            className="input"
          >
            <option value="">Tous</option>
            {TYPE_DEPENSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-[140px]">
          <label
            htmlFor="charge-fixe-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Charge fixe
          </label>
          <select
            id="charge-fixe-select"
            value={estChargeFixe}
            onChange={handleEstChargeFixeChange}
            className="input"
          >
            <option value="">Toutes</option>
            <option value="true">Fixes uniquement</option>
            <option value="false">Variables uniquement</option>
          </select>
        </div>
        
        {/* Bouton de reset des filtres */}
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              hasActiveFilters 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={hasActiveFilters ? 'Réinitialiser tous les filtres' : 'Aucun filtre actif'}
          >
            {hasActiveFilters ? '🗑️ Réinitialiser' : '🗑️ Pas de filtres'}
          </button>
        </div>
      </div>

      {/* Tableau des Dépenses */}
      <Table<IDepense>
        data={depenses}
        emptyRender={
          <div className="text-center py-4 text-gray-500">
            Aucune dépense trouvée.
          </div>
        }
        columns={columns}
        rowAction={actions}
      />

    </div>
  );
}

export default React.memo(TableDepenses);

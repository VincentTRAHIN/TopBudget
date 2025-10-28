'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { IDepense } from '@/types/depense.type';
import { useDepenses, DepenseFilters } from '@/hooks/useDepenses.hook';
import { ICategorie } from '@/types/categorie.type';
import debug from 'debug';
import React from 'react';
import { Table } from '../table';
import { useColumns } from './useColumns';
import { TYPE_COMPTE_OPTIONS, TYPE_DEPENSE_OPTIONS } from '@/types/common.type';
import { useDebounce } from '@/hooks/useDebounce.hook';

const log = debug('app:frontend:TableDepenses');

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: Partial<DepenseFilters>) => void;
  onSortChange?: (sortBy: string, order: 'asc' | 'desc') => void;
  currentSortKey?: string;
  currentSortOrder?: 'asc' | 'desc';
  currentUserId?: string;
  partenaireId?: string;
  currentFilters: DepenseFilters; // IMPORTANT : les filtres viennent du parent
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
}: TableDepensesProps) {
  log('Composant TableDepenses rendu avec props: %O', {
    depenses,
    categories,
    currentUserId,
  });

  const { refreshDepenses } = useDepenses();

  // État local UNIQUEMENT pour l'input de recherche (controlled input)
  const [localSearchValue, setLocalSearchValue] = useState(currentFilters.search || '');
  
  // Debouncer la recherche
  const debouncedSearch = useDebounce(localSearchValue, 600);
  
  // États locaux pour tous les autres filtres (controlés par le parent)
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categorie || '');
  const [dateDebut, setDateDebut] = useState(currentFilters.dateDebut || '');
  const [dateFin, setDateFin] = useState(currentFilters.dateFin || '');
  const [typeCompte, setTypeCompte] = useState(currentFilters.typeCompte || '');
  const [typeDepense, setTypeDepense] = useState(currentFilters.typeDepense || '');

  // Ref pour tracker si c'est le premier render
  const isFirstRender = useRef(true);

  const {
    actions,
    columns,
  } = useColumns({
    currentUserId,
    onEdit,
    onFilterChange,
    refreshDepenses
  })

  // Handlers pour les changements de filtres
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  }, []);

  const handleDateDebutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateDebut(e.target.value);
  }, []);

  const handleDateFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFin(e.target.value);
  }, []);

  const handleTypeCompteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeCompte(e.target.value);
  }, []);

  const handleTypeDepenseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeDepense(e.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocalSearchValue('');
    setSelectedCategory('');
    setDateDebut('');
    setDateFin('');
    setTypeCompte('');
    setTypeDepense('');
  }, []);

  // Gérer le tri côté serveur
  const handleSortChange = useCallback((sortBy: string, order: 'asc' | 'desc') => {
    if (onSortChange) {
      onSortChange(sortBy, order);
    }
  }, [onSortChange]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Boolean(
    localSearchValue || 
    selectedCategory || 
    dateDebut || 
    dateFin || 
    typeCompte || 
    typeDepense
  );

  // Synchroniser avec le parent UNIQUEMENT quand les filtres changent
  useEffect(() => {
    // Ne rien faire au premier render pour éviter un appel inutile
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Envoyer TOUS les filtres (même vides) pour que le parent puisse les synchroniser
    onFilterChange({ 
      search: debouncedSearch || undefined,
      categorie: selectedCategory || undefined,
      typeCompte: typeCompte || undefined,
      typeDepense: typeDepense || undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    });
  }, [debouncedSearch, selectedCategory, typeCompte, typeDepense, dateDebut, dateFin, onFilterChange]);

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
            value={localSearchValue}
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
        
        {/* Bouton de reset des filtres */}
        <div className="flex items-end">
          <button
            onClick={handleResetFilters}
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
        getRowClassName={(row) => 
          row.estChargeFixe 
            ? 'bg-green-50/30 hover:!bg-green-100/40' 
            : ''
        }
        onSortChange={onSortChange}
        currentSortKey={currentSortKey}
        currentSortOrder={currentSortOrder}
      />

    </div>
  );
}

export default TableDepenses;

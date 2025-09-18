'use client';

import { useState, useCallback, useEffect } from 'react';
import { IRevenu } from '@/types/revenu.type';
import { useRevenus, RevenuFilters, RevenuSort } from '@/hooks/useRevenus.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { Table } from '../table';
import { useColumns } from './useColumn';
import { TYPE_REVENU_OPTIONS } from '@/types/common.type';
import { useRevenuFilters } from '@/hooks/useTableFilters.hook';

interface TableRevenusProps {
  revenus: IRevenu[];
  onEdit: (revenu: IRevenu) => void;
  onFilterChange: (filters: Partial<RevenuFilters>) => void;
  currentUserId?: string;
}

export default function TableRevenus({
  revenus = [],
  onEdit,
  onFilterChange,
  currentUserId,
}: TableRevenusProps) {
  const { 
    filters, 
    setFilter, 
    resetFilters, 
    hasActiveFilters 
  } = useRevenuFilters();
  
  const { refreshRevenus } = useRevenus();
  const { categoriesRevenu } = useCategoriesRevenu();

  // Extraire les valeurs des filtres
  const {
    search = '',
    dateDebut = '',
    dateFin = '',
    typeCompte = '',
    categorieRevenu = '',
    estRecurrent = ''
  } = filters;

  const { actions, columns } = useColumns({
    currentUserId,
    onEdit,
    refreshRevenus,
  });

  // Handlers pour les filtres
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter('search', e.target.value);
  }, [setFilter]);

  const handleCategorieRevenuChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter('categorieRevenu', e.target.value);
  }, [setFilter]);

  const handleTypeCompteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter('typeCompte', e.target.value);
  }, [setFilter]);

  const handleEstRecurrentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === '' ? null : e.target.value === 'true';
    setFilter('estRecurrent', value);
  }, [setFilter]);

  const handleDateDebutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter('dateDebut', e.target.value);
  }, [setFilter]);

  const handleDateFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter('dateFin', e.target.value);
  }, [setFilter]);

  // Synchroniser avec le parent quand les filtres changent
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onFilterChange({
        search: search || undefined,
        categorieRevenu: categorieRevenu || undefined,
        typeCompte: typeCompte || undefined,
        estRecurrent: estRecurrent || undefined,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
      });
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [search, categorieRevenu, typeCompte, estRecurrent, dateDebut, dateFin, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
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
            htmlFor="categorie-revenu-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Catégorie de Revenu
          </label>
          <select
            id="categorie-revenu-select"
            value={categorieRevenu}
            onChange={handleCategorieRevenuChange}
            className="input"
          >
            <option value="">Toutes</option>
            {Array.isArray(categoriesRevenu) &&
              categoriesRevenu.map((cat: ICategorieRevenu) => (
                <option key={cat._id} value={cat._id}>
                  {cat.nom}
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
            {TYPE_REVENU_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-grow min-w-[120px]">
          <label
            htmlFor="est-recurrent-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Récurrence
          </label>
          <select
            id="est-recurrent-select"
            value={estRecurrent === null ? '' : String(estRecurrent)}
            onChange={handleEstRecurrentChange}
            className="input"
          >
            <option value="">Tous</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
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
      {/* Tableau des Revenus */}
      <div className="overflow-x-auto">
        <Table<IRevenu>
          data={revenus}
          columns={columns}
          rowAction={actions}
          emptyRender={
            <div className="text-center py-4 text-gray-500">
              Aucun revenu trouvé.
            </div>
          }
        />
      </div>
    </div>
  );
}
